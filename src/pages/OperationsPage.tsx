import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { applyRules } from '../domain/categorization/applyRules';
import { applyBankMappings } from '../domain/categorization/applyBankMappings';
import EditCategoryModal from '../components/operations/EditCategoryModal';
import AppLayout from '../components/layout/AppLayout';
import BottomNavigation from '../components/layout/BottomNavigation';
import type { Transaction } from '../store/types';
import { formatDateShort } from '../shared/formatDate';

interface Props {
  onTabChange: (tab: string) => void;
}

// AICODE-NOTE: OPERATIONS_PAGE Lists all transactions with date/category/review-status filters, tap-to-edit category
export default function OperationsPage({ onTabChange }: Props) {
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [onlyUnreviewed, setOnlyUnreviewed] = useState(false);
  const [editTxn, setEditTxn] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    let result = [...transactions];
    if (dateFrom) result = result.filter((t) => t.date >= dateFrom);
    if (dateTo) result = result.filter((t) => t.date <= dateTo);
    if (categoryFilter) result = result.filter((t) => t.categoryId === categoryFilter);
    if (onlyUnreviewed) result = result.filter((t) => !t.isReviewed);
    result.sort((a, b) => b.date.localeCompare(a.date));
    return result;
  }, [transactions, dateFrom, dateTo, categoryFilter, onlyUnreviewed]);

  const handleReapplyRules = () => {
    const store = useStore.getState();
    const uncategorized = transactions.filter((t) => !t.isReviewed);
    const banked = applyBankMappings(uncategorized, store.bankMappings);
    const remaining = banked.filter((t) => !t.isReviewed);
    const ruled = applyRules(remaining, store.rules);
    const all = [...banked.filter((t) => t.isReviewed), ...ruled];
    for (const txn of all) {
      if (txn.categoryId && txn.isReviewed && txn.id) {
        store.updateTransactionCategory(txn.id, txn.categoryId);
      }
    }
  };

  return (
    <AppLayout>
      <h2 className="mb-4 text-lg font-bold tracking-[-0.02em] text-[#eef4f8]">Операции</h2>

      <section className="mb-[14px] rounded-[18px] bg-[#121821] p-[18px]">
        <div className="mb-3 grid grid-cols-2 gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8]"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8]"
          />
        </div>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8]"
          >
            <option value="">Все категории</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-[#8795a5]">
            <input
              type="checkbox"
              checked={onlyUnreviewed}
              onChange={(e) => setOnlyUnreviewed(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            Только без категории
          </label>
        </div>
        <button
          onClick={handleReapplyRules}
          className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] px-4 py-2 text-sm font-semibold text-[#8795a5] hover:text-[#eef4f8]"
        >
          Применить правила ко всем
        </button>
      </section>

      <div className="space-y-1">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#8795a5]">Нет операций</p>
        ) : (
          filtered.map((txn) => {
            const cat = categories.find((c) => c.id === txn.categoryId);
            return (
              <button
                key={txn.id}
                onClick={() => setEditTxn(txn)}
                className="flex w-full items-center justify-between rounded-xl bg-[#121821] px-4 py-3 text-left transition-colors hover:bg-[#171f2a]"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-[#eef4f8]">
                    {txn.description}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-xs text-[#8795a5]">{formatDateShort(txn.date)}</span>
                    {cat ? (
                      <span className="rounded-full bg-[#171f2a] px-2 py-0.5 text-xs text-[#75b8ff]">
                        {cat.name}
                      </span>
                    ) : (
                      <span className="rounded-full bg-[rgba(245,166,35,0.12)] px-2 py-0.5 text-xs text-[#f5a623]">
                        ?
                      </span>
                    )}
                  </div>
                </div>
                <span className={`ml-3 whitespace-nowrap text-sm font-bold ${
                  txn.amount >= 0 ? 'text-[#58d68d]' : 'text-[#e74c3c]'
                }`}>
                  {txn.amount.toLocaleString('ru-RU')} ₽
                </span>
              </button>
            );
          })
        )}
      </div>

      {editTxn && <EditCategoryModal transaction={editTxn} onClose={() => setEditTxn(null)} />}

      <div className="mt-[14px]">
        <BottomNavigation activeTab="operations" onTabChange={onTabChange} />
      </div>
    </AppLayout>
  );
}
