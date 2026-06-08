import { useStore } from '../store';
import AppLayout from '../components/layout/AppLayout';

function downloadBackup() {
  const state = useStore.getState();
  const json = JSON.stringify(
    {
      accounts: state.accounts,
      transactions: state.transactions,
      categories: state.categories,
      importBatches: state.importBatches,
      rules: state.rules,
      nextIncomeDate: state.nextIncomeDate,
      expectedMonthlyIncome: state.expectedMonthlyIncome,
      todayFlexibleSpent: state.todayFlexibleSpent,
    },
    null,
    2,
  );
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const today = new Date().toISOString().slice(0, 10);
  a.download = `denezhka-backup-${today}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function handleRestore(file: File) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      useStore.getState().restoreFromJSON(reader.result as string);
    } catch {
      alert('Ошибка: неверный формат файла');
    }
  };
  reader.readAsText(file);
}

export default function SettingsPage() {
  return (
    <AppLayout>
      <h1 className="mb-6 text-lg font-bold text-[#eef4f8]">Настройки</h1>

      <div className="flex flex-col gap-4">
        <button
          onClick={downloadBackup}
          className="rounded-xl bg-[#121821] px-4 py-3 text-sm font-semibold text-[#eef4f8] transition-colors hover:bg-[#171f2a]"
        >
          Экспорт JSON
        </button>

        <label className="flex cursor-pointer items-center justify-center rounded-xl bg-[#121821] px-4 py-3 text-sm font-semibold text-[#eef4f8] transition-colors hover:bg-[#171f2a]">
          Импорт JSON
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleRestore(file);
            }}
          />
        </label>
      </div>
    </AppLayout>
  );
}
