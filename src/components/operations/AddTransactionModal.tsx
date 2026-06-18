import { useState, useMemo } from 'react';
import { useStore } from '../../store';

interface Props {
  onClose: () => void;
  prefilledType?: 'income' | 'expense';
  prefilledCategoryId?: string;
}

export default function AddTransactionModal({ onClose, prefilledType = 'expense', prefilledCategoryId }: Props) {
  const store = useStore();
  const allOnBudgetAccounts = store.accounts.filter((a) => a.onBudget);
  const categories = store.categories;
  const groups = store.categoryGroups;

  const [type, setType] = useState<'income' | 'expense'>(prefilledType);
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState<string>(allOnBudgetAccounts[0]?.id ?? '');
  const [categoryId, setCategoryId] = useState<string>(prefilledCategoryId ?? '');
  const [description, setDescription] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Grouped categories for rendering
  const groupedCategories = useMemo(() => {
    return groups
      .map((g) => {
        const groupCats = categories.filter((c) => c.groupId === g.id && !c.id.startsWith('cc-payment-'));
        return { ...g, categories: groupCats };
      })
      .filter((g) => g.categories.length > 0);
  }, [groups, categories]);

  const handleSave = () => {
    if (amount === '' || amount <= 0) {
      window.alert('Пожалуйста, введите сумму больше нуля');
      return;
    }
    if (!accountId) {
      window.alert('Пожалуйста, выберите счёт');
      return;
    }

    const finalAmount = type === 'expense' ? -Number(amount) : Number(amount);

    store.addTransaction({
      date,
      amount: finalAmount,
      accountId,
      categoryId: categoryId || undefined,
      description: description.trim() || (type === 'income' ? 'Доход' : 'Расход'),
      isReviewed: true,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-8">
      <div className="w-full max-w-[430px] rounded-[18px] bg-[#121821] p-[18px]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-[#eef4f8]">Добавить операцию</h3>
          <button onClick={onClose} className="text-xs text-[#8795a5]">
            ✕ Закрыть
          </button>
        </div>

        {/* Expense/Income Toggle */}
        <div className="mb-4 flex rounded-xl bg-[#171f2a] p-1">
          <button
            onClick={() => { setType('expense'); setCategoryId(''); }}
            className={`flex-1 rounded-lg py-2 text-center text-sm font-semibold transition-colors ${
              type === 'expense' ? 'bg-[#e74c3c] text-[#eef4f8]' : 'text-[#8795a5] hover:text-[#eef4f8]'
            }`}
          >
            Расход
          </button>
          <button
            onClick={() => { setType('income'); setCategoryId(''); }}
            className={`flex-1 rounded-lg py-2 text-center text-sm font-semibold transition-colors ${
              type === 'income' ? 'bg-[#58d68d] text-[#090d12]' : 'text-[#8795a5] hover:text-[#eef4f8]'
            }`}
          >
            Доход
          </button>
        </div>

        <div className="mb-4 space-y-3">
          {/* Amount */}
          <div>
            <label className="mb-1 block text-xs text-[#8795a5]">Сумма (₽)</label>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8] outline-none"
              autoFocus
            />
          </div>

          {/* Account chips — all on-budget accounts incl. credit cards */}
          <div>
            <label className="mb-1 block text-xs text-[#8795a5]">Счёт</label>
            <div className="flex flex-wrap gap-2">
              {allOnBudgetAccounts.map((acc) => {
                const isSelected = acc.id === accountId;
                const isCredit = acc.type === 'credit';
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setAccountId(acc.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? isCredit
                          ? 'bg-[#e74c3c] text-[#eef4f8]'
                          : 'bg-[#75b8ff] text-[#090d12]'
                        : 'bg-[#171f2a] text-[#8795a5] hover:text-[#eef4f8]'
                    }`}
                  >
                    <span>{isCredit ? '💳' : '🏦'}</span>
                    <span>{acc.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category — primary field for expense */}
          <div>
            <label className="mb-1 block text-xs text-[#8795a5]">
              {type === 'expense' ? 'Категория (конверт)' : 'Категория'}
            </label>
            {type === 'income' ? (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8] outline-none"
              >
                <option value="">Готово к раздаче (Inflow: To Be Budgeted)</option>
                {categories
                  .filter((c) => !c.id.startsWith('cc-payment-'))
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
              </select>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8] outline-none"
              >
                <option value="">Без категории</option>
                {groupedCategories.map((g) => (
                  <optgroup key={g.id} label={g.name} className="text-xs text-[#8795a5]">
                    {g.categories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="text-sm text-[#eef4f8]">
                        {cat.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs text-[#8795a5]">Описание (необязательно)</label>
            <input
              type="text"
              placeholder={type === 'income' ? 'Зарплата' : 'Покупка'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8] outline-none"
            />
          </div>

          {/* Advanced: Date only */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl bg-[#171f2a] px-3 py-2 text-xs text-[#8795a5] transition-colors hover:text-[#eef4f8]"
          >
            <span>Дата</span>
            <span className="text-[10px]">
              {showAdvanced ? '▲' : '▼'}{' '}
              <span className="opacity-60">{date}</span>
            </span>
          </button>

          {showAdvanced && (
            <div className="rounded-xl bg-[#0d1520] p-3">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8] outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-[rgba(255,255,255,0.08)] px-4 py-3 text-sm font-semibold text-[#8795a5]"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-xl bg-[#75b8ff] px-4 py-3 text-sm font-bold text-[#090d12]"
          >
            Добавить
          </button>
        </div>
      </div>
    </div>
  );
}
