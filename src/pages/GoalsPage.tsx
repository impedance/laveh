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

export default function GoalsPage({ onTabChange }: Props) {
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

  // Filter category groups that are designated as sinking funds
  const sinkingFundGroups = useMemo(() => {
    return store.categoryGroups.filter((g) => g.type === 'sinking_fund');
  }, [store.categoryGroups]);

  const visibleCategoryGroups = useMemo(() => {
    return vm.categoryGroups.filter((g) => {
      const dbGroup = store.categoryGroups.find((cg) => cg.id === g.id);
      return dbGroup?.type === 'sinking_fund';
    });
  }, [vm.categoryGroups, store.categoryGroups]);

  const handleAssignChange = (categoryId: string, newAssigned: number) => {
    if (!monthState) return;
    const oldAssigned = monthState.categoryAssignments[categoryId] ?? 0;
    const delta = newAssigned - oldAssigned;
    store.setCategoryAssigned(currentMonth, categoryId, newAssigned);
    store.setToBeBudgeted(currentMonth, monthState.toBeBudgeted - delta);
  };

  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');

  const [newCatName, setNewCatName] = useState('');
  const [newCatPlan, setNewCatPlan] = useState(0);
  const [newCatGroupId, setNewCatGroupId] = useState(sinkingFundGroups[0]?.id ?? '');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatPlan, setEditCatPlan] = useState(0);
  const [editCatGroupId, setEditCatGroupId] = useState('');

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    store.upsertGroup({ name: newGroupName.trim(), type: 'sinking_fund' });
    setNewGroupName('');
  };

  const handleRenameGroup = (id: string) => {
    if (!editGroupName.trim()) return;
    store.upsertGroup({ id, name: editGroupName.trim(), type: 'sinking_fund' });
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
    const groupIdToUse = newCatGroupId || sinkingFundGroups[0]?.id;
    if (!groupIdToUse) {
      window.alert('Сначала создайте хотя бы одну группу целей');
      return;
    }
    if (store.categories.some((c) => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      window.alert('Категория с таким именем уже существует');
      return;
    }
    store.upsertCategory({
      name: newCatName.trim(),
      plan: newCatPlan,
      groupId: groupIdToUse,
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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-[-0.02em] text-[#eef4f8]">Цели и накопления</h2>
        <span className="text-xs text-[#8795a5]">
          Свободно для раздачи: {vm.toBeBudgeted.toLocaleString('ru-RU')} ₽
        </span>
      </div>

      <div className="flex flex-col gap-[14px]">
        {/* Category Groups List */}
        <section className="rounded-[18px] bg-[#121821] p-[18px]">
          <h3 className="mb-3 text-base font-bold text-[#eef4f8]">Целевые группы</h3>

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
                          placeholder="Цель на месяц"
                        />
                        <select
                          value={editCatGroupId}
                          onChange={(e) => setEditCatGroupId(e.target.value)}
                          className="w-full rounded-xl bg-[#121821] px-3 py-2 text-sm text-[#eef4f8]"
                        >
                          {sinkingFundGroups.map((g) => (
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
                              цель {cat.plan.toLocaleString('ru-RU')} ₽
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
                                if (window.confirm(`Удалить категорию «${cat.name}»?`)) {
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
                            <label className="mb-0.5 block text-[10px] text-[#8795a5]">Отложено</label>
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
                            <label className="mb-0.5 block text-[10px] text-[#8795a5]">Расход</label>
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
              </div>
            </div>
          ))}

          {/* Add Category Section */}
          <div className="mt-3 border-t border-[rgba(255,255,255,0.06)] pt-3">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                placeholder="Новая цель"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8]"
              />
              <input
                type="number"
                placeholder="Сумма цели"
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
              {sinkingFundGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <button
              onClick={handleAddCategory}
              className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] px-4 py-2 text-sm font-semibold text-[#8795a5] hover:text-[#eef4f8]"
            >
              + Добавить цель
            </button>
          </div>
        </section>

        {/* Group Management */}
        <section className="rounded-[18px] bg-[#121821] p-[18px]">
          <h3 className="mb-3 text-base font-bold text-[#eef4f8]">Группы целей</h3>
          <div className="mb-3 space-y-2">
            {sinkingFundGroups.map((group) => (
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
                        {store.categories.filter((c) => c.groupId === group.id).length} целей
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
              placeholder="Новая группа целей"
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
        <BottomNavigation activeTab="goals" onTabChange={onTabChange} />
      </div>
    </AppLayout>
  );
}
