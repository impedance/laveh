import { useState, useCallback } from 'react';
import { useStore } from '../store';
import { parseWorkbook, mapToTBankRaw } from '../domain/import/parseWorkbook';
import { mapRowsToTransactions } from '../domain/import/mapRowsToTransactions';
import { deduplicateTransactions } from '../domain/import/deduplicateTransactions';
import { applyRules } from '../domain/categorization/applyRules';
import ImportPreview from '../components/import/ImportPreview';
import ImportHistory from '../components/import/ImportHistory';
import AppLayout from '../components/layout/AppLayout';
import BottomNavigation from '../components/layout/BottomNavigation';
import type { ParsedRow, ImportConfig, TBankParsedRow } from '../domain/import/types';
import type { Transaction } from '../store/types';
import { T_BANK_DEFAULT_MAPPING } from '../domain/import/types';
import { normalizeTBankRow } from '../domain/import/normalizeTBankRow';

type Step = 'idle' | 'parsing' | 'preview' | 'importing' | 'done' | 'error';

interface Props {
  onTabChange: (tab: string) => void;
}

const DEFAULT_IMPORT_CONFIG: Omit<ImportConfig, 'sourceProfile'> = {
  defaultAccountId: 'cash-1',
  cardMappings: [],
};

// AICODE-NOTE: IMPORT_FLOW Pipe: file -> parseWorkbook -> mapToTBankRaw -> normalize -> mapRows -> dedup -> applyRules -> commitImport
export default function ImportPage({ onTabChange }: Props) {
  const store = useStore();
  const [step, setStep] = useState<Step>('idle');
  const [filename, setFilename] = useState('');
  const [found, setFound] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [duplicates, setDuplicates] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingTxns, setPendingTxns] = useState<Omit<Transaction, 'id'>[]>([]);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStep('parsing');
    setFilename(file.name);
    try {
      // 1. raw parse
      const parsed: ParsedRow[] = await parseWorkbook(file);
      if (parsed.length === 0) {
        setStep('error');
        setErrorMessage('Файл не содержит данных');
        return;
      }

      // 2. map columns → typed raw rows
      const rawRows = mapToTBankRaw(parsed, T_BANK_DEFAULT_MAPPING);

      // 3. normalize strings → typed values
      const typedRows: TBankParsedRow[] = rawRows.map(normalizeTBankRow);

      setFound(typedRows.length);

      // 4. map to transactions
      const defaultAccountId = store.accounts[0]?.id || 'cash-1';
      const config: ImportConfig = {
        ...DEFAULT_IMPORT_CONFIG,
        defaultAccountId,
        sourceProfile: 'tbank',
      };
      const mapped = await mapRowsToTransactions(typedRows, config);

      // 5. dedup
      const { new: newTxns, duplicates: dupTxns } = deduplicateTransactions(mapped, store.transactions);

      // 6. auto-categorize
      const categorized = applyRules(newTxns, store.rules);

      setNewCount(categorized.length);
      setDuplicates(dupTxns.length);
      setPendingTxns(categorized);
      setStep('preview');
    } catch (err) {
      setStep('error');
      setErrorMessage(err instanceof Error ? err.message : 'Ошибка при чтении файла');
    }
  }, [store.accounts, store.transactions, store.rules]);

  const downloadBackup = useCallback(() => {
    const state = useStore.getState();
    const partial = {
      accounts: state.accounts,
      transactions: state.transactions,
      categories: state.categories,
      importBatches: state.importBatches,
      rules: state.rules,
      nextIncomeDate: state.nextIncomeDate,
      expectedMonthlyIncome: state.expectedMonthlyIncome,
      todayFlexibleSpent: state.todayFlexibleSpent,
    };
    const blob = new Blob([JSON.stringify(partial, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback(() => {
    if (pendingTxns.length === 0) return;
    setStep('importing');
    downloadBackup();
    store.commitImport(pendingTxns, {
      date: new Date().toISOString().slice(0, 10),
      filename,
      transactionCount: pendingTxns.length,
      status: 'completed',
    });
    setStep('done');
  }, [pendingTxns, store.commitImport, filename]);

  const handleCancel = useCallback(() => {
    setStep('idle');
    setPendingTxns([]);
    setFilename('');
  }, []);

  return (
    <AppLayout>
      <h2 className="mb-4 text-lg font-bold tracking-[-0.02em] text-[#eef4f8]">Импорт Excel</h2>

      {step === 'idle' && (
        <section className="rounded-[18px] bg-[#121821] p-[18px]">
          <p className="mb-4 text-sm text-[#8795a5]">
            Выберите Excel- или CSV-выписку из Т-Банка для импорта операций.
          </p>
          <label className="flex cursor-pointer items-center justify-center rounded-xl bg-[#75b8ff] px-4 py-3 text-sm font-bold text-[#090d12] transition-opacity hover:opacity-90">
            <span>Выбрать файл</span>
            <input
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFile}
              className="hidden"
            />
          </label>
        </section>
      )}

      {step === 'parsing' && (
        <section className="rounded-[18px] bg-[#121821] p-[18px]">
          <p className="text-sm text-[#8795a5]">Чтение файла...</p>
        </section>
      )}

      {step === 'preview' && (
        <ImportPreview
          filename={filename}
          found={found}
          newCount={newCount}
          duplicates={duplicates}
          onImport={handleImport}
          onCancel={handleCancel}
          loading={false}
        />
      )}

      {step === 'importing' && (
        <section className="rounded-[18px] bg-[#121821] p-[18px]">
          <p className="text-sm text-[#8795a5]">Импорт...</p>
        </section>
      )}

      {step === 'done' && (
        <section className="rounded-[18px] border-t-2 border-t-[#58d68d] bg-[#121821] p-[18px]">
          <p className="mb-2 text-sm font-bold text-[#58d68d]">Импорт завершён</p>
          <p className="mb-4 text-sm text-[#8795a5]">
            Импортировано {newCount} операций, пропущено {duplicates} дубликатов.
          </p>
          <button
            onClick={handleCancel}
            className="w-full rounded-xl bg-[#75b8ff] px-4 py-3 text-sm font-bold text-[#090d12]"
          >
            Импортировать ещё
          </button>
        </section>
      )}

      {step === 'error' && (
        <section className="rounded-[18px] border-t-2 border-t-[#e74c3c] bg-[#121821] p-[18px]">
          <p className="mb-1 text-sm font-bold text-[#e74c3c]">Ошибка</p>
          <p className="mb-4 text-sm text-[#8795a5]">{errorMessage}</p>
          <button
            onClick={handleCancel}
            className="w-full rounded-xl bg-[#75b8ff] px-4 py-3 text-sm font-bold text-[#090d12]"
          >
            Попробовать снова
          </button>
        </section>
      )}

      <div className="mt-[14px]">
        <ImportHistory />
      </div>

      <div className="mt-[14px]">
        <BottomNavigation activeTab="import" onTabChange={onTabChange} />
      </div>
    </AppLayout>
  );
}
