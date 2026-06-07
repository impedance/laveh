import { useStore } from '../../store';
import { formatDate } from '../../domain/money/dateUtils';

export default function ImportHistory() {
  const importBatches = useStore((s) => s.importBatches);
  const undoImport = useStore((s) => s.undoImport);

  if (importBatches.length === 0) {
    return (
      <section className="rounded-[18px] bg-[#121821] p-[18px]">
        <h3 className="text-base font-bold text-[#eef4f8]">История импорта</h3>
        <p className="mt-2 text-sm text-[#8795a5]">Импорт ещё не проводился</p>
      </section>
    );
  }

  return (
    <section className="rounded-[18px] bg-[#121821] p-[18px]">
      <h3 className="mb-3 text-base font-bold text-[#eef4f8]">История импорта</h3>
      <div className="space-y-2">
        {importBatches.map((batch) => (
          <div
            key={batch.id}
            className="flex items-center justify-between rounded-xl bg-[#171f2a] p-3"
          >
            <div>
              <div className="text-sm font-medium text-[#eef4f8]">{batch.filename}</div>
              <div className="text-xs text-[#8795a5]">
                {formatDate(batch.date)} · {batch.transactionCount} операций
              </div>
            </div>
            <button
              onClick={() => undoImport(batch.id)}
              className="rounded-lg border border-[rgba(255,255,255,0.08)] px-3 py-1.5 text-xs font-semibold text-[#f5a623] transition-colors hover:text-[#e74c3c]"
            >
              Отменить
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
