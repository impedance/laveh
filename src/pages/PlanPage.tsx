import { useState } from 'react';
import { useStore } from '../store';
import AppLayout from '../components/layout/AppLayout';
import BottomNavigation from '../components/layout/BottomNavigation';

interface Props {
  onTabChange: (tab: string) => void;
}

// AICODE-NOTE: PLAN_PAGE Manual editor for income date/amount, obligations, category plans, reserve, goal progress
export default function PlanPage({ onTabChange }: Props) {
  const store = useStore();
  const [incomeDate, setIncomeDate] = useState(store.nextIncomeDate);
  const [monthlyIncome, setMonthlyIncome] = useState(store.expectedMonthlyIncome);
  const [newOblName, setNewOblName] = useState('');
  const [newOblAmount, setNewOblAmount] = useState(0);
  const [newOblDue, setNewOblDue] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatPlan, setNewCatPlan] = useState(0);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatPlan, setEditCatPlan] = useState(0);
  const [reserveAmount, setReserveAmount] = useState(0);
  const [goalTarget, setGoalTarget] = useState(store.goals[0]?.targetAmount || 0);
  const [goalCurrent, setGoalCurrent] = useState(store.goals[0]?.currentAmount || 0);

  const handleSaveIncome = () => {
    store.setNextIncomeDate(incomeDate);
    store.setExpectedMonthlyIncome(monthlyIncome);
  };

  const handleAddObligation = () => {
    if (!newOblName || !newOblDue || newOblAmount <= 0) return;
    store.upsertObligation({
      title: newOblName,
      amount: newOblAmount,
      dueDate: newOblDue,
      isProtected: true,
    });
    setNewOblName('');
    setNewOblAmount(0);
    setNewOblDue('');
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
      type: 'living',
    });
    setNewCatName('');
    setNewCatPlan(0);
  };

  const handleSaveGoal = () => {
    if (store.goals[0]) {
      store.setGoalProgress(store.goals[0].id, goalCurrent);
      store.updateGoal(store.goals[0].id, { targetAmount: goalTarget });
    }
  };

  return (
    <AppLayout>
      <h2 className="mb-4 text-lg font-bold tracking-[-0.02em] text-[#eef4f8]">План</h2>

      <div className="flex flex-col gap-[14px]">
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
          <h3 className="mb-3 text-base font-bold text-[#eef4f8]">Обязательства</h3>
          <div className="mb-3 space-y-2">
            {store.obligations.map((obl) => (
              <div key={obl.id} className="flex items-center justify-between rounded-xl bg-[#171f2a] p-3">
                <div>
                  <div className="text-sm font-medium text-[#eef4f8]">{obl.title}</div>
                  <div className="text-xs text-[#8795a5]">{obl.amount.toLocaleString('ru-RU')} ₽ до {obl.dueDate}</div>
                </div>
                <button
                  onClick={() => store.deleteObligation(obl.id)}
                  className="text-xs text-[#e74c3c]"
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <input
              placeholder="Название"
              value={newOblName}
              onChange={(e) => setNewOblName(e.target.value)}
              className="w-full rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8]"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Сумма"
                value={newOblAmount || ''}
                onChange={(e) => setNewOblAmount(Number(e.target.value))}
                className="rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8]"
              />
              <input
                type="date"
                value={newOblDue}
                onChange={(e) => setNewOblDue(e.target.value)}
                className="rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8]"
              />
            </div>
            <button
              onClick={handleAddObligation}
              className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] px-4 py-2 text-sm font-semibold text-[#8795a5] hover:text-[#eef4f8]"
            >
              + Добавить обязательство
            </button>
          </div>
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const trimmed = editCatName.trim();
                          if (trimmed.toLowerCase() !== cat.name.toLowerCase() &&
                              store.categories.some((c) => c.id !== cat.id && c.name.toLowerCase() === trimmed.toLowerCase())) {
                            window.alert('Категория с таким именем уже существует');
                            return;
                          }
                          store.upsertCategory({ id: cat.id, name: trimmed, plan: editCatPlan, type: cat.type });
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
                    <span className="text-sm font-medium text-[#eef4f8]">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#8795a5]">{cat.plan.toLocaleString('ru-RU')} ₽/мес</span>
                      <button
                        onClick={() => {
                          setEditingCatId(cat.id);
                          setEditCatName(cat.name);
                          setEditCatPlan(cat.plan);
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
          <button
            onClick={handleAddCategory}
            className="mt-2 w-full rounded-xl border border-[rgba(255,255,255,0.08)] px-4 py-2 text-sm font-semibold text-[#8795a5] hover:text-[#eef4f8]"
          >
            + Добавить категорию
          </button>
        </section>

        <section className="rounded-[18px] bg-[#121821] p-[18px]">
          <h3 className="mb-3 text-base font-bold text-[#eef4f8]">Резерв</h3>
          <input
            type="number"
            placeholder="Сумма защиты"
            value={reserveAmount || ''}
            onChange={(e) => setReserveAmount(Number(e.target.value))}
            className="w-full rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8]"
          />
        </section>

        <section className="rounded-[18px] bg-[#121821] p-[18px]">
          <h3 className="mb-3 text-base font-bold text-[#eef4f8]">Цель</h3>
          {store.goals[0] && (
            <>
              <p className="mb-3 text-sm text-[#eef4f8]">{store.goals[0].title}</p>
              <div className="mb-3 space-y-2">
                <div>
                  <label className="mb-1 block text-xs text-[#8795a5]">Целевая сумма</label>
                  <input
                    type="number"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(Number(e.target.value))}
                    className="w-full rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#8795a5]">Текущая сумма</label>
                  <input
                    type="number"
                    value={goalCurrent}
                    onChange={(e) => setGoalCurrent(Number(e.target.value))}
                    className="w-full rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8]"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveGoal}
                className="w-full rounded-xl bg-[#75b8ff] px-4 py-2.5 text-sm font-bold text-[#090d12]"
              >
                Сохранить
              </button>
            </>
          )}
        </section>
      </div>

      <div className="mt-[14px]">
        <BottomNavigation activeTab="plan" onTabChange={onTabChange} />
      </div>
    </AppLayout>
  );
}
