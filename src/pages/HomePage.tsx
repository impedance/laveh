import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { calculateBudget } from '../domain/budget/calculateBudget';
import type { BudgetInput } from '../domain/budget/types';
import AppLayout from '../components/layout/AppLayout';
import BottomNavigation from '../components/layout/BottomNavigation';
import CategoryBudgetRow from '../components/budget/CategoryBudgetRow';
import CoverOverspendingModal from '../components/budget/CoverOverspendingModal';

interface Props {
  onTabChange: (tab: string) => void;
}

export default function HomePage({ onTabChange }: Props) {
  const store = useStore();
  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  useEffect(() => {
    store.ensureCurrentMonthState();
  }, [currentMonth]);

  const monthState = useMemo(() => {
    return store.monthStates.find((ms) => ms.month === currentMonth) ?? {
      month: currentMonth,
      categoryAssignments: {},
      categoryCarryover: {},
      toBeBudgeted: 0,
    };
  }, [store.monthStates, currentMonth]);

  const vm = useMemo(() => {
    const input: BudgetInput = {
      accounts: store.accounts,
      transactions: store.transactions,
      categories: store.categories,
      categoryGroups: store.categoryGroups,
      monthState,
      month: currentMonth,
    };
    return calculateBudget(input);
  }, [store.accounts, store.transactions, store.categories, store.categoryGroups, monthState, currentMonth]);

  // Modal WAM state
  const [wamTargetId, setWamTargetId] = useState<string | null>(null);

  // WAM Options
  const wamOptions = useMemo(() => {
    const options: Array<{ id: string; name: string; available: number }> = [];
    
    // Regular categories
    for (const g of vm.categoryGroups) {
      if (g.id === 'group-cc-payments') continue;
      for (const c of g.categories) {
        if (c.available > 0) {
          options.push({
            id: c.id,
            name: c.name,
            available: c.available,
          });
        }
      }
    }

    // CC payment categories
    for (const cc of vm.creditCardPayments) {
      if (cc.available > 0) {
        options.push({
          id: `cc-payment-${cc.accountId}`,
          name: `Оплата: ${cc.accountName}`,
          available: cc.available,
        });
      }
    }

    return options;
  }, [vm.categoryGroups, vm.creditCardPayments]);

  // Find WAM shortfall
  const wamShortfall = useMemo(() => {
    if (!wamTargetId) return 0;
    if (wamTargetId.startsWith('cc-payment-')) {
      const cc = vm.creditCardPayments.find((c) => `cc-payment-${c.accountId}` === wamTargetId);
      return cc && cc.available < 0 ? Math.abs(cc.available) : 0;
    } else {
      for (const g of vm.categoryGroups) {
        const cat = g.categories.find((c) => c.id === wamTargetId);
        if (cat && cat.available < 0) {
          return Math.abs(cat.available);
        }
      }
    }
    return 0;
  }, [wamTargetId, vm.categoryGroups, vm.creditCardPayments]);

  const handleAssignChange = (categoryId: string, newAssigned: number) => {
    const oldAssigned = monthState.categoryAssignments[categoryId] ?? 0;
    const delta = newAssigned - oldAssigned;
    store.setCategoryAssigned(currentMonth, categoryId, newAssigned);
    store.setToBeBudgeted(currentMonth, monthState.toBeBudgeted - delta);
  };

  const handleCoverConfirm = (sourceCategoryId: string) => {
    if (!wamTargetId || wamShortfall <= 0) return;
    store.coverOverspending(currentMonth, sourceCategoryId, wamTargetId, wamShortfall);
    setWamTargetId(null);
  };

  // Quick Action: Auto-budget/Distribute
  const handleDistribute = () => {
    if (vm.toBeBudgeted <= 0) return;
    // Distribute equally or to underfunded plan goals
    const underfunded: Array<{ id: string; needed: number }> = [];
    
    // Collect regular category needs
    for (const g of vm.categoryGroups) {
      if (g.id === 'group-cc-payments') continue;
      const dbGroup = store.categoryGroups.find((cg) => cg.id === g.id);
      if (dbGroup?.type === 'sinking_fund') continue; // Skip sinking funds for auto-distribute
      for (const c of g.categories) {
        const needed = Math.max(0, c.plan - c.assigned);
        if (needed > 0) {
          underfunded.push({ id: c.id, needed });
        }
      }
    }

    if (underfunded.length === 0) {
      window.alert('Все категории полностью профинансированы по плану!');
      return;
    }

    let remaining = vm.toBeBudgeted;
    for (const item of underfunded) {
      if (remaining <= 0) break;
      const amountToAssign = Math.min(remaining, item.needed);
      const currentAssigned = monthState.categoryAssignments[item.id] ?? 0;
      handleAssignChange(item.id, currentAssigned + amountToAssign);
      remaining -= amountToAssign;
    }
  };

  // Filter out cc payments from standard groups list to render them separately
  const regularGroups = useMemo(() => {
    return vm.categoryGroups.filter((g) => g.id !== 'group-cc-payments');
  }, [vm.categoryGroups]);

  // State for new group / category creation
  const [newGroupName, setNewGroupName] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatPlan, setNewCatPlan] = useState(0);
  const [newCatGroupId, setNewCatGroupId] = useState('');

  const editableGroups = useMemo(() => {
    return store.categoryGroups.filter((g) => g.id !== 'group-cc-payments' && g.type !== 'sinking_fund');
  }, [store.categoryGroups]);

  // Initialize group selection
  useEffect(() => {
    if (editableGroups.length > 0 && !newCatGroupId) {
      setNewCatGroupId(editableGroups[0].id);
    }
  }, [editableGroups, newCatGroupId]);

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    store.upsertGroup({ name: newGroupName.trim(), type: 'regular' });
    setNewGroupName('');
  };

  const handleAddCategory = () => {
    if (!newCatName.trim() || !newCatGroupId) return;
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

  const currentMonthLabel = new Date().toLocaleString('ru-RU', { month: 'long', year: 'numeric' });

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <strong className="block text-lg tracking-[-0.02em] text-[#eef4f8]">Laveh</strong>
          <span className="mt-0.5 block text-xs text-[#8795a5]">
            Бюджетирование · {currentMonthLabel}
          </span>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#75b8ff] text-sm font-bold text-[#090d12]">
          B
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Strict To Be Budgeted (Ready to Assign) Hero Card */}
        <section
          className={`rounded-[18px] border-t-2 bg-[#121821] p-4 ${
            vm.toBeBudgeted > 0
              ? 'border-t-[#58d68d]'
              : vm.toBeBudgeted < 0
              ? 'border-t-[#e74c3c]'
              : 'border-t-[#8795a5]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8795a5]">
                Готово к распределению
              </div>
              <div
                className={`text-3xl font-extrabold leading-tight tracking-[-0.04em] ${
                  vm.toBeBudgeted > 0
                    ? 'text-[#58d68d]'
                    : vm.toBeBudgeted < 0
                    ? 'text-[#e74c3c]'
                    : 'text-[#eef4f8]'
                }`}
              >
                {vm.toBeBudgeted.toLocaleString('ru-RU')} ₽
              </div>
            </div>
            {vm.toBeBudgeted > 0 && (
              <button
                type="button"
                onClick={handleDistribute}
                className="rounded-xl bg-[#75b8ff] px-4 py-2 text-xs font-bold text-[#090d12] hover:opacity-90 transition-opacity"
              >
                Распределить
              </button>
            )}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-[#8795a5] border-t border-[rgba(255,255,255,0.04)] pt-2">
            <span>Капитал: <strong className="text-[#eef4f8]">{vm.ownMoney.toLocaleString('ru-RU')} ₽</strong></span>
            {vm.totalDebt > 0 && (
              <span>Долги по картам: <strong className="text-[#e74c3c]">{vm.totalDebt.toLocaleString('ru-RU')} ₽</strong></span>
            )}
          </div>
        </section>

        {/* Budget spreadsheet layout */}
        <section className="rounded-[18px] bg-[#121821] p-4">
          {/* Table Header */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-2 pb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#8795a5] border-b border-[rgba(255,255,255,0.06)]">
            <span>Категория</span>
            <span className="text-right">Назначено</span>
            <span className="text-right">Активность</span>
            <span className="text-right">Доступно</span>
          </div>

          {/* Groups and Categories list */}
          <div className="mt-2 space-y-4">
            {regularGroups.map((group) => (
              <div key={group.id} className="space-y-1">
                {/* Group Header */}
                <div className="flex items-center justify-between bg-[#171f2a]/40 px-2 py-1.5 rounded-lg">
                  <span className="text-xs font-bold text-[#75b8ff]">{group.name}</span>
                  <span className="text-[10px] font-semibold text-[#8795a5] tabular-nums">
                    {group.totalAvailable.toLocaleString('ru-RU')} ₽ доступно
                  </span>
                </div>

                {/* Category Rows */}
                <div className="pl-1">
                  {group.categories.map((cat) => (
                    <CategoryBudgetRow
                      key={cat.id}
                      categoryId={cat.id}
                      name={cat.name}
                      assigned={cat.assigned}
                      activity={cat.activity}
                      available={cat.available}
                      isOverspent={cat.available < 0}
                      onAssignChange={(newAmt) => handleAssignChange(cat.id, newAmt)}
                      onCoverClick={() => setWamTargetId(cat.id)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Credit Card Payments section */}
            {vm.creditCardPayments.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between bg-[#171f2a]/40 px-2 py-1.5 rounded-lg">
                  <span className="text-xs font-bold text-[#f5a623]">Оплата кредитных карт</span>
                  <span className="text-[10px] font-semibold text-[#8795a5] tabular-nums">
                    {vm.creditCardPayments.reduce((s, cc) => s + cc.available, 0).toLocaleString('ru-RU')} ₽ отложено
                  </span>
                </div>

                <div className="pl-1">
                  {vm.creditCardPayments.map((cc) => {
                    const catId = `cc-payment-${cc.accountId}`;
                    return (
                      <CategoryBudgetRow
                        key={cc.accountId}
                        categoryId={catId}
                        name={`Оплата: ${cc.accountName}`}
                        assigned={cc.assigned}
                        activity={cc.activity}
                        available={cc.available}
                        isOverspent={cc.available < 0}
                        onAssignChange={(newAmt) => handleAssignChange(catId, newAmt)}
                        onCoverClick={() => setWamTargetId(catId)}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Quick management section (Add Category / Group) */}
        <section className="rounded-[18px] bg-[#121821] p-4 text-xs">
          <h4 className="mb-3 font-bold text-[#eef4f8]">Управление категориями</h4>
          
          <div className="space-y-3">
            {/* Add Category Form */}
            <div className="border-b border-[rgba(255,255,255,0.04)] pb-3">
              <span className="block text-[10px] uppercase font-bold text-[#8795a5] mb-2">Новая категория</span>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Название"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8] focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="План в месяц"
                  value={newCatPlan || ''}
                  onChange={(e) => setNewCatPlan(Number(e.target.value))}
                  className="rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8] focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={newCatGroupId}
                  onChange={(e) => setNewCatGroupId(e.target.value)}
                  className="flex-1 rounded-xl bg-[#171f2a] px-3 py-2 text-xs text-[#eef4f8] focus:outline-none"
                >
                  {editableGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddCategory}
                  className="rounded-xl bg-[#75b8ff] px-4 py-2 font-bold text-[#090d12]"
                >
                  Добавить
                </button>
              </div>
            </div>

            {/* Add Group Form */}
            <div>
              <span className="block text-[10px] uppercase font-bold text-[#8795a5] mb-2">Новая группа</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Название группы"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="flex-1 rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8] focus:outline-none"
                />
                <button
                  onClick={handleAddGroup}
                  className="rounded-xl border border-[rgba(255,255,255,0.08)] px-4 py-2 font-semibold text-[#8795a5] hover:text-[#eef4f8]"
                >
                  Создать
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Navigation */}
      <div className="mt-4">
        <BottomNavigation activeTab="home" onTabChange={onTabChange} />
      </div>

      {/* Cover Overspending WAM modal */}
      {wamTargetId && wamShortfall > 0 && (
        <CoverOverspendingModal
          targetCategoryId={wamTargetId}
          shortfall={wamShortfall}
          options={wamOptions}
          onConfirm={handleCoverConfirm}
          onClose={() => setWamTargetId(null)}
        />
      )}
    </AppLayout>
  );
}
