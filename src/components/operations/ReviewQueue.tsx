import { useState } from 'react';
import { useStore } from '../../store';
import EditCategoryModal from './EditCategoryModal';
import type { Transaction } from '../../store/types';
import { formatDateShort } from '../../shared/formatDate';

export default function ReviewQueue() {
  const transactions = useStore((s) => s.transactions);
  const uncategorized = transactions.filter((t) => !t.isReviewed);
  const [editTxn, setEditTxn] = useState<Transaction | null>(null);

  if (uncategorized.length === 0) return null;

  const current = uncategorized[0];

  if (editTxn) {
    return <EditCategoryModal transaction={editTxn} onClose={() => setEditTxn(null)} />;
  }

  return (
    <section className="rounded-[18px] border-t-2 border-t-[#f5a623] bg-[#121821] p-[18px]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-[#eef4f8]">
          {uncategorized.length} операций без категории
        </h3>
        <span className="text-xs text-[#8795a5]">
          {uncategorized.length} шт.
        </span>
      </div>
      {current && (
        <div className="mb-4 rounded-xl bg-[#171f2a] p-4">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-[#eef4f8]">{current.description}</div>
              <div className="mt-0.5 text-xs text-[#8795a5]">{formatDateShort(current.date)}</div>
            </div>
            <span className={`text-sm font-bold ${current.amount >= 0 ? 'text-[#58d68d]' : 'text-[#e74c3c]'}`}>
              {current.amount.toLocaleString('ru-RU')} ₽
            </span>
          </div>
          <button
            onClick={() => setEditTxn(current)}
            className="w-full rounded-xl bg-[#75b8ff] px-4 py-2.5 text-sm font-bold text-[#090d12] transition-opacity hover:opacity-90"
          >
            Назначить категорию
          </button>
        </div>
      )}
    </section>
  );
}
