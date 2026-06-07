import { useState } from 'react';
import { useStore } from '../../store';
import type { Transaction } from '../../store/types';

interface Props {
  transaction: Transaction;
  onClose: () => void;
}

export default function EditCategoryModal({ transaction, onClose }: Props) {
  const categories = useStore((s) => s.categories);
  const transactions = useStore((s) => s.transactions);
  const updateTransactionCategory = useStore((s) => s.updateTransactionCategory);
  const addRule = useStore((s) => s.addRule);
  const learnBankMapping = useStore((s) => s.learnBankMapping);
  const upsertCategory = useStore((s) => s.upsertCategory);
  const [selected, setSelected] = useState(transaction.categoryId || '');
  const [alwaysCategorize, setAlwaysCategorize] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const similarTransactions = transaction.bankCategory
    ? transactions.filter((t) => t.id !== transaction.id && t.bankCategory === transaction.bankCategory && !t.categoryId)
    : transactions.filter((t) => t.id !== transaction.id && t.description === transaction.description && !t.categoryId);

  const handleApplySimilar = () => {
    if (!selected) return;
    updateTransactionCategory(transaction.id, selected);
    similarTransactions.forEach((t) => {
      updateTransactionCategory(t.id, selected);
    });
    if (transaction.bankCategory && selected) {
      learnBankMapping(transaction.bankCategory, selected);
    }
    onClose();
  };

  const handleSave = () => {
    updateTransactionCategory(transaction.id, selected);
    if (transaction.bankCategory && selected) {
      learnBankMapping(transaction.bankCategory, selected);
    }
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

  const handleCreateGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      window.alert('Категория с таким именем уже существует');
      return;
    }
    upsertCategory({ name, plan: 0, type: 'living' });
    const created = useStore.getState().categories.find((c) => c.name === name);
    if (created) {
      setSelected(created.id);
      setIsCreating(false);
      setNewGroupName('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-8">
      <div className="w-full max-w-[430px] rounded-[18px] bg-[#121821] p-[18px]">
        <h3 className="mb-4 text-base font-bold text-[#eef4f8]">Группа</h3>
        <p className="mb-1 text-sm text-[#8795a5]">
          {transaction.description} · {transaction.amount.toLocaleString('ru-RU')} ₽
        </p>
        {transaction.bankCategory && (
          <p className="mb-4 text-xs text-[#8795a5]">
            Категория банка: {transaction.bankCategory}
          </p>
        )}
        <div className="mb-4 space-y-1">
          {isCreating ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                placeholder="Название группы"
                className="flex-1 rounded-xl bg-[#171f2a] px-4 py-3 text-sm text-[#eef4f8] outline-none"
                autoFocus
              />
              <button
                onClick={handleCreateGroup}
                className="rounded-xl bg-[#75b8ff] px-4 py-3 text-sm font-bold text-[#090d12]"
              >
                +
              </button>
            </div>
          ) : (
            <>
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
              <button
                onClick={() => setIsCreating(true)}
                className="w-full rounded-xl border border-dashed border-[rgba(255,255,255,0.12)] px-4 py-3 text-left text-sm text-[#8795a5]"
              >
                + Новая группа
              </button>
            </>
          )}
        </div>
        <label className="mb-4 flex items-center gap-2 text-sm text-[#8795a5]">
          <input
            type="checkbox"
            checked={alwaysCategorize}
            onChange={(e) => setAlwaysCategorize(e.target.checked)}
            className="h-4 w-4 rounded border-[rgba(255,255,255,0.08)] bg-[#171f2a]"
          />
          Всегда назначать эту группу для таких операций
        </label>
        {similarTransactions.length > 0 && selected && (
          <button
            onClick={handleApplySimilar}
            className="mb-4 w-full rounded-xl border border-[rgba(255,255,255,0.12)] px-4 py-3 text-sm font-semibold text-[#eef4f8] hover:bg-[#1e2a3a]"
          >
            Применить ко всем похожим ({similarTransactions.length})
          </button>
        )}
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
