import { useState } from 'react';
import { useStore } from '../store';
import AppLayout from '../components/layout/AppLayout';
import BottomNavigation from '../components/layout/BottomNavigation';

interface Props {
  onTabChange: (tab: string) => void;
}

// AICODE-NOTE: PLAN_PAGE Manual editor for income date/amount, category groups/categories
export default function PlanPage({ onTabChange }: Props) {
  const store = useStore();
  const [incomeDate, setIncomeDate] = useState(store.nextIncomeDate);
  const [monthlyIncome, setMonthlyIncome] = useState(store.expectedMonthlyIncome);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatPlan, setNewCatPlan] = useState(0);
  const [newCatGroupId, setNewCatGroupId] = useState(store.categoryGroups[0]?.id ?? '');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatPlan, setEditCatPlan] = useState(0);
  const [editCatGroupId, setEditCatGroupId] = useState('');

  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<'debit' | 'credit'>('debit');
  const [newAccountBalance, setNewAccountBalance] = useState(0);
  const [newAccountCreditLimit, setNewAccountCreditLimit] = useState(0);

  const handleAddAccount = () => {
    if (!newAccountName.trim()) return;
    store.addAccount({
      name: newAccountName.trim(),
      type: newAccountType,
      includeInCashBalance: true,
      currentBalance: newAccountBalance,
      creditLimit: newAccountType === 'credit' ? newAccountCreditLimit || undefined : undefined,
    });
    setNewAccountName('');
    setNewAccountType('debit');
    setNewAccountBalance(0);
    setNewAccountCreditLimit(0);
  };

  const sortedGroups = [...store.categoryGroups].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleSaveIncome = () => {
    store.setNextIncomeDate(incomeDate);
    store.setExpectedMonthlyIncome(monthlyIncome);
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    store.upsertGroup({ name: newGroupName.trim() });
    setNewGroupName('');
  };

  const handleRenameGroup = (id: string) => {
    if (!editGroupName.trim()) return;
    store.upsertGroup({ id, name: editGroupName.trim() });
    setEditingGroupId(null);
  };

  const handleDeleteGroup = (id: string) => {
    const group = store.categoryGroups.find((g) => g.id === id);
    if (!group) return;
    if (window.confirm(`Удалить группу «${group.name}» и все её категории?`)) {
      store.deleteGroup(id);
    }
  };

  const handleAddCategory = () => {
    if (!newCatName || newCatPlan <= 0) return;
    if (store.categories.some((c) => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      window.alert('Категория с таким именем уже существует');
      return;
    }
    store.upsertCategory({
      name: newCatName.trim(),
      plan: newCatPlan,
      groupId: newCatGroupId,
    });
    setNewCatName('');
    setNewCatPlan(0);
  };

  const groupName = (id: string) => store.categoryGroups.find((g) => g.id === id)?.name ?? id;

  return (
    <AppLayout>
      <h2 className="mb-4 text-lg font-bold tracking-[-0.02em] text-[#eef4f8]">План</h2>

      <div className="flex flex-col gap-[14px]">
        <section className="rounded-[18px] bg-[#121821] p-[18px]">
          <h3 className="mb-3 text-base font-bold text-[#eef4f8]">Группы</h3>
          <div className="mb-3 space-y-2">
            {sortedGroups.map((group) => (
              <div key={group.id} className="rounded-xl bg-[#171f2a] p-3">
                {editingGroupId === group.id ? (
                  <div className="flex gap-2">
                    <input
                      value={editGroupName}
                      onChange={(e) => setEditGroupName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRenameGroup(group.id)}
                      className="flex-1 rounded-xl bg-[#121821] px-3 py-2 text-sm text-[#eef4f8]"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRenameGroup(group.id)}
                      className="rounded-xl bg-[#75b8ff] px-3 py-2 text-xs font-bold text-[#090d12]"
                    >
                      ОК
                    </button>
                    <button
                      onClick={() => setEditingGroupId(null)}
                      className="rounded-xl border border-[rgba(255,255,255,0.08)] px-3 py-2 text-xs text-[#8795a5]"
                    >
                      Отм
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-[#eef4f8]">{group.name}</span>
                      <span className="ml-2 text-xs text-[#8795a5]">
                        {store.categories.filter((c) => c.groupId === group.id).length} категорий
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingGroupId(group.id);
                          setEditGroupName(group.name);
                        }}
                        className="text-xs text-[#8795a5] hover:text-[#eef4f8]"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="text-xs text-[#e74c3c]"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              placeholder="Название новой группы"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
              className="flex-1 rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8]"
            />
            <button
              onClick={handleAddGroup}
              className="rounded-xl border border-[rgba(255,255,255,0.08)] px-4 py-2 text-sm font-semibold text-[#8795a5] hover:text-[#eef4f8]"
            >
              + Добавить
            </button>
          </div>
        </section>

        <section className="rounded-[18px] bg-[#121821] p-[18px]">
          <h3 className="mb-3 text-base font-bold text-[#eef4f8]">Доход</h3>
          <div className="mb-3 space-y-2">
            <div>
              <label className="mb-1 block text-xs text-[#8795a5]">Дата следующего дохода</label>
              <input
                type="date"
                value={incomeDate}
                onChange={(e) => setIncomeDate(e.target.value)}
                className="w-full rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#8795a5]">Ожидаемая сумма дохода</label>
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                className="w-full rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8]"
              />
            </div>
          </div>
          <button
            onClick={handleSaveIncome}
            className="w-full rounded-xl bg-[#75b8ff] px-4 py-2.5 text-sm font-bold text-[#090d12]"
          >
            Сохранить
          </button>
        </section>

        <section className="rounded-[18px] bg-[#121821] p-[18px]">
          <h3 className="mb-3 text-base font-bold text-[#eef4f8]">Категории</h3>
          <div className="mb-3 space-y-2">
            {store.categories.map((cat) => (
              <div key={cat.id} className="rounded-xl bg-[#171f2a] p-3">
                {editingCatId === cat.id ? (
                  <div className="space-y-2">
                    <input
                      value={editCatName}
                      onChange={(e) => setEditCatName(e.target.value)}
                      className="w-full rounded-xl bg-[#121821] px-3 py-2 text-sm text-[#eef4f8]"
                    />
                    <input
                      type="number"
                      value={editCatPlan || ''}
                      onChange={(e) => setEditCatPlan(Number(e.target.value))}
                      className="w-full rounded-xl bg-[#121821] px-3 py-2 text-sm text-[#eef4f8]"
                    />
                    <select
                      value={editCatGroupId}
                      onChange={(e) => setEditCatGroupId(e.target.value)}
                      className="w-full rounded-xl bg-[#121821] px-3 py-2 text-sm text-[#eef4f8]"
                    >
                      {sortedGroups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const trimmed = editCatName.trim();
                          if (trimmed.toLowerCase() !== cat.name.toLowerCase() &&
                              store.categories.some((c) => c.id !== cat.id && c.name.toLowerCase() === trimmed.toLowerCase())) {
                            window.alert('Категория с таким именем уже существует');
                            return;
                          }
                          store.upsertCategory({ id: cat.id, name: trimmed, plan: editCatPlan, groupId: editCatGroupId });
                          setEditingCatId(null);
                        }}
                        className="flex-1 rounded-xl bg-[#75b8ff] px-3 py-1.5 text-xs font-bold text-[#090d12]"
                      >
                        Сохранить
                      </button>
                      <button
                        onClick={() => setEditingCatId(null)}
                        className="flex-1 rounded-xl border border-[rgba(255,255,255,0.08)] px-3 py-1.5 text-xs text-[#8795a5]"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-[#eef4f8]">{cat.name}</span>
                      <span className="ml-2 rounded-full bg-[#171f2a] px-2 py-0.5 text-xs text-[#75b8ff]">
                        {groupName(cat.groupId)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#8795a5]">{cat.plan.toLocaleString('ru-RU')} ₽/мес</span>
                      <button
                        onClick={() => {
                          setEditingCatId(cat.id);
                          setEditCatName(cat.name);
                          setEditCatPlan(cat.plan);
                          setEditCatGroupId(cat.groupId);
                        }}
                        className="text-xs text-[#8795a5] hover:text-[#eef4f8]"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Удалить категорию «${cat.name}»? Транзакции останутся без группы.`)) {
                            store.deleteCategory(cat.id);
                          }
                        }}
                        className="text-xs text-[#e74c3c]"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Название"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8]"
            />
            <input
              type="number"
              placeholder="План в месяц"
              value={newCatPlan || ''}
              onChange={(e) => setNewCatPlan(Number(e.target.value))}
              className="rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8]"
            />
          </div>
          <select
            value={newCatGroupId}
            onChange={(e) => setNewCatGroupId(e.target.value)}
            className="mt-2 w-full rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8]"
          >
            {sortedGroups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <button
            onClick={handleAddCategory}
            className="mt-2 w-full rounded-xl border border-[rgba(255,255,255,0.08)] px-4 py-2 text-sm font-semibold text-[#8795a5] hover:text-[#eef4f8]"
          >
            + Добавить категорию
          </button>
        </section>

        <section className="rounded-[18px] bg-[#121821] p-[18px]">
          <h3 className="mb-3 text-base font-bold text-[#eef4f8]">Счета</h3>

          <div className="mb-3 rounded-xl bg-[#171f2a] p-3 space-y-2">
            <input
              placeholder="Название счёта"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              className="w-full rounded-xl bg-[#121821] px-3 py-2 text-sm text-[#eef4f8]"
            />
            <div className="flex gap-2">
              <select
                value={newAccountType}
                onChange={(e) => setNewAccountType(e.target.value as 'debit' | 'credit')}
                className="flex-1 rounded-xl bg-[#121821] px-3 py-2 text-sm text-[#eef4f8]"
              >
                <option value="debit">Дебетовый</option>
                <option value="credit">Кредитный</option>
              </select>
              <input
                type="number"
                placeholder="Баланс"
                value={newAccountBalance || ''}
                onChange={(e) => setNewAccountBalance(Number(e.target.value))}
                className="flex-1 rounded-xl bg-[#121821] px-3 py-2 text-sm text-[#eef4f8]"
              />
            </div>
            {newAccountType === 'credit' && (
              <input
                type="number"
                placeholder="Кредитный лимит"
                value={newAccountCreditLimit || ''}
                onChange={(e) => setNewAccountCreditLimit(Number(e.target.value))}
                className="w-full rounded-xl bg-[#121821] px-3 py-2 text-sm text-[#eef4f8]"
              />
            )}
            <button
              onClick={handleAddAccount}
              className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] px-4 py-2 text-sm font-semibold text-[#8795a5] hover:text-[#eef4f8]"
            >
              + Добавить счёт
            </button>
          </div>

          {store.accounts.map((acc) => (
            <div key={acc.id} className="mb-2 rounded-xl bg-[#171f2a] p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-[#eef4f8]">{acc.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs rounded-full bg-[#121821] px-2 py-0.5 text-[#8795a5]">
                    {acc.type === 'credit' ? 'Кредитный' : 'Дебетовый'}
                    {acc.includeInCashBalance ? '' : ' · исключён'}
                  </span>
                  <button
                    onClick={() => {
                      if (window.confirm(`Удалить счёт «${acc.name}»? Транзакции будут удалены.`)) {
                        store.deleteAccount(acc.id);
                      }
                    }}
                    className="text-xs text-[#e74c3c]"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <input
                type="number"
                value={acc.currentBalance}
                onChange={(e) =>
                  store.updateAccount(acc.id, {
                    currentBalance: Number(e.target.value),
                  })
                }
                className="w-full rounded-xl bg-[#121821] px-3 py-2 text-sm text-[#eef4f8]"
              />
              {acc.type === 'credit' && (
                <div className="mt-2">
                  <input
                    type="number"
                    placeholder="Кредитный лимит"
                    value={acc.creditLimit ?? ''}
                    onChange={(e) =>
                      store.updateAccount(acc.id, {
                        creditLimit: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl bg-[#121821] px-3 py-2 text-sm text-[#eef4f8]"
                  />
                  <div className="mt-1 text-xs text-[#75b8ff]">
                    Доступно: {(acc.creditLimit == null || acc.creditLimit === 0 ? 0 : Math.max(0, acc.creditLimit + acc.currentBalance)).toLocaleString('ru-RU')} ₽
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      </div>

      <div className="mt-[14px]">
        <BottomNavigation activeTab="plan" onTabChange={onTabChange} />
      </div>
    </AppLayout>
  );
}
