import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { calculateBudget } from '../domain/budget/calculateBudget';
import type { BudgetInput } from '../domain/budget/types';
import AppLayout from '../components/layout/AppLayout';
import BottomNavigation from '../components/layout/BottomNavigation';
import QuickActions from '../components/operations/QuickActions';

interface Props {
  onTabChange: (tab: string) => void;
}

export default function BudgetPage({ onTabChange }: Props) {
  const store = useStore();

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const monthState = useMemo(() => {
    return store.monthStates.find((ms) => ms.month === currentMonth);
  }, [store.monthStates, currentMonth]);

  const vm = useMemo(() => {
    const ms = monthState ?? {
      month: currentMonth,
      categoryAssignments: {},
      categoryCarryover: {},
      toBeBudgeted: 0,
    };

    const input: BudgetInput = {
      accounts: store.accounts,
      transactions: store.transactions,
      categories: store.categories,
      categoryGroups: store.categoryGroups,
      monthState: ms,
      month: currentMonth,
    };

    return calculateBudget(input);
  }, [store.accounts, store.transactions, store.categories, store.categoryGroups, monthState, currentMonth]);

  const sortedGroups = useMemo(
    () => [...store.categoryGroups].sort((a, b) => a.sortOrder - b.sortOrder),
    [store.categoryGroups],
  );

  const editableGroups = useMemo(
    () => sortedGroups.filter((g) => g.id !== 'group-cc-payments' && g.type !== 'sinking_fund'),
    [sortedGroups],
  );

  const visibleCategoryGroups = useMemo(
    () => vm.categoryGroups.filter((g) => {
      if (g.id === 'group-cc-payments') return false;
      const dbGroup = store.categoryGroups.find((cg) => cg.id === g.id);
      return dbGroup?.type !== 'sinking_fund';
    }),
    [vm.categoryGroups, store.categoryGroups],
  );

  const handleAssignChange = (categoryId: string, newAssigned: number) => {
    if (!monthState) return;
    const oldAssigned = monthState.categoryAssignments[categoryId] ?? 0;
    const delta = newAssigned - oldAssigned;
    store.setCategoryAssigned(currentMonth, categoryId, newAssigned);
    store.setToBeBudgeted(currentMonth, monthState.toBeBudgeted - delta);
  };

  const ensureMonthState = () => {
    if (!monthState) {
      store.setToBeBudgeted(currentMonth, 0);
    }
  };

  ensureMonthState();

  const [incomeDate, setIncomeDate] = useState(store.nextIncomeDate);
  const [monthlyIncome, setMonthlyIncome] = useState(store.expectedMonthlyIncome);

  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');

  const [newCatName, setNewCatName] = useState('');
  const [newCatPlan, setNewCatPlan] = useState(0);
  const [newCatGroupId, setNewCatGroupId] = useState(editableGroups[0]?.id ?? '');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatPlan, setEditCatPlan] = useState(0);
  const [editCatGroupId, setEditCatGroupId] = useState('');

  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<'debit' | 'credit'>('debit');
  const [newAccountBalance, setNewAccountBalance] = useState(0);
  const [newAccountCreditLimit, setNewAccountCreditLimit] = useState(0);

  const handleSaveIncome = () => {
    store.setNextIncomeDate(incomeDate);
    store.setExpectedMonthlyIncome(monthlyIncome);
  };

  const handleAddAccount = () => {
    if (!newAccountName.trim()) return;
    store.addAccount({
      name: newAccountName.trim(),
      type: newAccountType,
      onBudget: true,
      currentBalance: newAccountBalance,
      creditLimit: newAccountType === 'credit' ? newAccountCreditLimit || undefined : undefined,
    });
    setNewAccountName('');
    setNewAccountType('debit');
    setNewAccountBalance(0);
    setNewAccountCreditLimit(0);
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    store.upsertGroup({ name: newGroupName.trim(), type: 'regular' });
    setNewGroupName('');
  };

  const handleRenameGroup = (id: string) => {
    if (!editGroupName.trim()) return;
    store.upsertGroup({ id, name: editGroupName.trim(), type: 'regular' });
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
    if (newCatGroupId === 'group-cc-payments') return;
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

  const getCategoryAssignValue = (catId: string): string => {
    const val = monthState?.categoryAssignments[catId];
    if (val === undefined || val === 0) return '';
    return String(val);
  };

  return (
    <AppLayout>
      <h2 className="mb-4 text-lg font-bold tracking-[-0.02em] text-[#eef4f8]">Бюджет</h2>

      <div className="flex flex-col gap-[14px]">
        <section className="rounded-[18px] bg-[#121821] p-[18px]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#eef4f8]">Готово к раздаче</h3>
            <span
              className={`text-lg font-extrabold tabular-nums ${
                vm.toBeBudgeted > 0 ? 'text-[#58d68d]' : vm.toBeBudgeted < 0 ? 'text-[#e74c3c]' : 'text-[#eef4f8]'
              }`}
            >
              {vm.toBeBudgeted.toLocaleString('ru-RU')} ₽
            </span>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs text-[#8795a5]">Установить вручную</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Сумма"
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val)) store.setToBeBudgeted(currentMonth, val);
                }}
                className="flex-1 rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8]"
              />
            </div>
          </div>
          <div className="flex gap-4 text-xs text-[#8795a5]">
            <span>Свои средства: {vm.ownMoney.toLocaleString('ru-RU')} ₽</span>
            {vm.totalDebt > 0 && (
              <span className="text-[#e74c3c]">Долги: {vm.totalDebt.toLocaleString('ru-RU')} ₽</span>
            )}
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

          {visibleCategoryGroups.map((group) => (
            <div key={group.id} className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold text-[#75b8ff]">{group.name}</span>
                <span className="text-xs text-[#8795a5]">
                  {group.totalAvailable.toLocaleString('ru-RU')} ₽ доступно
                </span>
              </div>

              <div className="ml-3 space-y-2">
                {group.categories.map((cat) => (
                  <div key={cat.id} className="rounded-xl bg-[#171f2a] p-3">
                    {editingCatId === cat.id ? (
                      <div className="space-y-2">
                        <input
                          value={editCatName}
                          onChange={(e) => setEditCatName(e.target.value)}
                          className="w-full rounded-xl bg-[#121821] px-3 py-2 text-sm text-[#eef4f8]"
                          placeholder="Название"
                        />
                        <input
                          type="number"
                          value={editCatPlan || ''}
                          onChange={(e) => setEditCatPlan(Number(e.target.value))}
                          className="w-full rounded-xl bg-[#121821] px-3 py-2 text-sm text-[#eef4f8]"
                          placeholder="План в месяц"
                        />
                        <select
                          value={editCatGroupId}
                          onChange={(e) => setEditCatGroupId(e.target.value)}
                          className="w-full rounded-xl bg-[#121821] px-3 py-2 text-sm text-[#eef4f8]"
                        >
                          {editableGroups.map((g) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const trimmed = editCatName.trim();
                              if (
                                trimmed.toLowerCase() !== cat.name.toLowerCase() &&
                                store.categories.some((c) => c.id !== cat.id && c.name.toLowerCase() === trimmed.toLowerCase())
                              ) {
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
                      <>
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-[#eef4f8]">{cat.name}</span>
                            <span className="ml-2 text-xs text-[#8795a5]">
                              план {cat.plan.toLocaleString('ru-RU')} ₽
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingCatId(cat.id);
                                setEditCatName(cat.name);
                                setEditCatPlan(cat.plan);
                                setEditCatGroupId(group.id);
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
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="mb-0.5 block text-[10px] text-[#8795a5]">Выделено</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={getCategoryAssignValue(cat.id)}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const num = raw === '' ? 0 : Number(raw);
                                if (!isNaN(num)) handleAssignChange(cat.id, num);
                              }}
                              className="w-full rounded-lg bg-[#121821] px-2 py-1.5 text-sm tabular-nums text-[#eef4f8]"
                            />
                          </div>
                          <div>
                            <label className="mb-0.5 block text-[10px] text-[#8795a5]">Активность</label>
                            <span
                              className={`block rounded-lg bg-[#121821] px-2 py-1.5 text-sm tabular-nums ${
                                cat.activity > 0 ? 'text-[#58d68d]' : cat.activity < 0 ? 'text-[#e74c3c]' : 'text-[#8795a5]'
                              }`}
                            >
                              {cat.activity === 0 ? '0' : `${cat.activity > 0 ? '+' : ''}${cat.activity.toLocaleString('ru-RU')}`}
                            </span>
                          </div>
                          <div>
                            <label className="mb-0.5 block text-[10px] text-[#8795a5]">Доступно</label>
                            <span
                              className={`block rounded-lg bg-[#121821] px-2 py-1.5 text-sm tabular-nums font-semibold ${
                                cat.available >= 0 ? 'text-[#58d68d]' : 'text-[#e74c3c]'
                              }`}
                            >
                              {cat.available.toLocaleString('ru-RU')}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {store.categories.filter((c) => c.groupId === group.id && !group.categories.some((gc) => gc.id === c.id)).length === 0 && group.categories.length === 0 && (
                  <div className="rounded-xl border border-dashed border-[rgba(255,255,255,0.06)] p-3 text-center text-xs text-[#8795a5]">
                    Нет категорий
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="mt-3 border-t border-[rgba(255,255,255,0.06)] pt-3">
            <div className="grid grid-cols-2 gap-2 mb-2">
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
              className="mb-2 w-full rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8]"
            >
              {editableGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <button
              onClick={handleAddCategory}
              className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] px-4 py-2 text-sm font-semibold text-[#8795a5] hover:text-[#eef4f8]"
            >
              + Добавить категорию
            </button>
          </div>
        </section>

        <section className="rounded-[18px] bg-[#121821] p-[18px]">
          <h3 className="mb-3 text-base font-bold text-[#eef4f8]">Кредитные карты</h3>

          {vm.creditCardPayments.map((cc) => {
            const isOverpayment = cc.balance > 0;

            return (
              <div key={cc.accountId} className="mb-3 rounded-xl bg-[#171f2a] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#eef4f8]">{cc.accountName}</span>
                  <div className="flex items-center gap-2">
                    {cc.creditLimit && (
                      <span className="text-xs text-[#8795a5]">
                        Лимит: {cc.creditLimit.toLocaleString('ru-RU')} ₽
                      </span>
                    )}
                    <span
                      className={`text-sm font-semibold ${
                        cc.balance >= 0 ? 'text-[#58d68d]' : 'text-[#e74c3c]'
                      }`}
                    >
                      {cc.balance >= 0 ? '+' : ''}
                      {cc.balance.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>

                {isOverpayment ? (
                  <div className="rounded-lg bg-[rgba(88,214,141,0.08)] px-2 py-1.5 text-xs text-[#58d68d]">
                    Переплата: {cc.balance.toLocaleString('ru-RU')} ₽
                  </div>
                ) : (
                  <div className="space-y-1">
                    {cc.debtRemaining > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#8795a5]">Долг</span>
                        <span className="text-sm font-semibold text-[#e74c3c]">
                          {cc.debtRemaining.toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8795a5]">Траты в этом месяце</span>
                      <span className="text-sm text-[#e74c3c]">
                        {cc.activity.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8795a5]">Доступно для оплаты</span>
                      <span className="text-sm font-semibold text-[#75b8ff]">
                        {cc.available.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                    <div>
                      <label className="mb-0.5 block text-[10px] text-[#8795a5]">
                        Дополнительно на погашение
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={getCategoryAssignValue(`cc-payment-${cc.accountId}`)}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const num = raw === '' ? 0 : Number(raw);
                          if (!isNaN(num)) handleAssignChange(`cc-payment-${cc.accountId}`, num);
                        }}
                        className="w-full rounded-lg bg-[#121821] px-2 py-1.5 text-sm tabular-nums text-[#eef4f8]"
                      />
                    </div>
                    {cc.paymentGap > 0 && (
                      <div className="mt-2 rounded-lg bg-[rgba(231,76,60,0.1)] px-2 py-1 text-xs text-[#e74c3c]">
                        Не хватает для полного погашения: {cc.paymentGap.toLocaleString('ru-RU')} ₽
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {vm.creditCardPayments.length === 0 && (
            <p className="text-xs text-[#8795a5]">Нет кредитных карт на бюджете</p>
          )}
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
                    {acc.onBudget ? '' : ' · исключён'}
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
                  <div className="mt-1 text-xs text-[#e74c3c]">
                    Долг: {Math.max(0, -acc.currentBalance).toLocaleString('ru-RU')} ₽
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>

        <section className="rounded-[18px] bg-[#121821] p-[18px]">
          <h3 className="mb-3 text-base font-bold text-[#eef4f8]">Группы</h3>
          <div className="mb-3 space-y-2">
            {editableGroups.map((group) => (
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
      </div>

      <QuickActions />

      <div className="mt-[14px]">
        <BottomNavigation activeTab="plan" onTabChange={onTabChange} />
      </div>
    </AppLayout>
  );
}
