import { useStore } from '../../store';
import { formatDateShort } from '../../shared/formatDate';

export interface ReviewTransactionProps {
  transactionId: string;
  description: string;
  amount: number;
  date: string;
  suggestedCategoryId?: string;
  onApprove: (transactionId: string, categoryId: string) => void;
}

export interface ReviewQueueProps {
  unreviewedTransactions: ReviewTransactionProps[];
  onApproveAll: () => void;
}

export default function ReviewQueue({
  unreviewedTransactions,
  onApproveAll,
}: ReviewQueueProps) {
  const categories = useStore((s) => s.categories);
  const categoryGroups = useStore((s) => s.categoryGroups);

  if (unreviewedTransactions.length === 0) return null;

  const hasSuggestions = unreviewedTransactions.some((t) => t.suggestedCategoryId);

  return (
    <section className="rounded-[18px] border-t-2 border-t-[#f5a623] bg-[#121821] p-[18px]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-[#eef4f8]">
          {unreviewedTransactions.length} операций без категории
        </h3>
        {hasSuggestions && (
          <button
            onClick={onApproveAll}
            className="rounded-xl bg-[#75b8ff]/10 border border-[#75b8ff]/20 px-3 py-1.5 text-xs font-bold text-[#75b8ff] hover:bg-[#75b8ff]/20 transition-colors"
          >
            Одобрить все
          </button>
        )}
      </div>

      <div className="space-y-3">
        {unreviewedTransactions.map((item) => {
          const suggestedCat = item.suggestedCategoryId
            ? categories.find((c) => c.id === item.suggestedCategoryId)
            : undefined;

          return (
            <div
              key={item.transactionId}
              className="rounded-xl bg-[#171f2a] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-[#eef4f8]">{item.description}</div>
                <div className="mt-0.5 text-xs text-[#8795a5]">{formatDateShort(item.date)}</div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3">
                <span className={`text-sm font-bold ${item.amount >= 0 ? 'text-[#58d68d]' : 'text-[#e74c3c]'}`}>
                  {item.amount.toLocaleString('ru-RU')} ₽
                </span>

                <div className="flex items-center gap-2">
                  {suggestedCat && (
                    <button
                      onClick={() => item.onApprove(item.transactionId, suggestedCat.id)}
                      className="rounded-xl bg-[#58d68d] px-3 py-1.5 text-xs font-bold text-[#090d12] hover:opacity-90 transition-opacity"
                      title={`Назначить категорию: ${suggestedCat.name}`}
                    >
                      ✓ {suggestedCat.name}
                    </button>
                  )}

                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        item.onApprove(item.transactionId, e.target.value);
                      }
                    }}
                    className="rounded-xl bg-[#121821] border border-[rgba(255,255,255,0.08)] px-3 py-1.5 text-xs text-[#eef4f8] focus:border-[#75b8ff] focus:outline-none"
                  >
                    <option value="">Выбрать...</option>
                    {[...categoryGroups]
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((group) => (
                        <optgroup key={group.id} label={group.name}>
                          {categories
                            .filter((c) => c.groupId === group.id)
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
