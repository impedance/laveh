import { useState } from 'react';
import { useStore } from '../../store';
import type { Transaction } from '../../store/types';

interface Props {
  transaction: Transaction;
  onClose: () => void;
}

export default function EditCategoryModal({ transaction, onClose }: Props) {
  const categories = useStore((s) => s.categories);
  const updateTransactionCategory = useStore((s) => s.updateTransactionCategory);
  const addRule = useStore((s) => s.addRule);
  const [selected, setSelected] = useState(transaction.categoryId || '');
  const [alwaysCategorize, setAlwaysCategorize] = useState(false);

  const handleSave = () => {
    updateTransactionCategory(transaction.id, selected);
    if (alwaysCategorize && selected) {
      addRule({
        pattern: transaction.description,
        categoryId: selected,
        priority: 10,
        matchType: 'contains',
        matchField: 'description',
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-8">
      <div className="w-full max-w-[430px] rounded-[18px] bg-[#121821] p-[18px]">
        <h3 className="mb-4 text-base font-bold text-[#eef4f8]">Категория</h3>
        <p className="mb-4 text-sm text-[#8795a5]">
          {transaction.description} · {transaction.amount.toLocaleString('ru-RU')} ₽
        </p>
        <div className="mb-4 space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelected(cat.id)}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                selected === cat.id
                  ? 'bg-[#75b8ff] text-[#090d12]'
                  : 'bg-[#171f2a] text-[#eef4f8] hover:bg-[#1e2a3a]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <label className="mb-4 flex items-center gap-2 text-sm text-[#8795a5]">
          <input
            type="checkbox"
            checked={alwaysCategorize}
            onChange={(e) => setAlwaysCategorize(e.target.checked)}
            className="h-4 w-4 rounded border-[rgba(255,255,255,0.08)] bg-[#171f2a]"
          />
          Всегда категоризировать так же
        </label>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-[rgba(255,255,255,0.08)] px-4 py-3 text-sm font-semibold text-[#8795a5]"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={!selected}
            className="flex-1 rounded-xl bg-[#75b8ff] px-4 py-3 text-sm font-bold text-[#090d12] disabled:opacity-40"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
