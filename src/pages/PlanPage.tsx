import { useMemo } from 'react';
import { useStore } from '../store';
import AppLayout from '../components/layout/AppLayout';
import BottomNavigation from '../components/layout/BottomNavigation';

interface Props {
  onTabChange: (tab: string) => void;
}

export default function PlanPage({ onTabChange }: Props) {
  const store = useStore();

  // Generate 6 months starting from the current month
  const months = useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      list.push(d.toISOString().slice(0, 7));
    }
    return list;
  }, []);

  const sortedGroups = useMemo(() => {
    return [...store.categoryGroups].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [store.categoryGroups]);

  const regularGroups = useMemo(() => {
    return sortedGroups.filter((g) => g.id !== 'group-cc-payments');
  }, [sortedGroups]);

  const handleMatrixAssignChange = (month: string, categoryId: string, newAssigned: number) => {
    const ms = store.monthStates.find((m) => m.month === month);
    const oldAssigned = ms?.categoryAssignments[categoryId] ?? 0;
    const currentTBB = ms?.toBeBudgeted ?? 0;
    const delta = newAssigned - oldAssigned;

    if (!ms) {
      store.setCategoryAssigned(month, categoryId, newAssigned);
      store.setToBeBudgeted(month, -newAssigned);
    } else {
      store.setCategoryAssigned(month, categoryId, newAssigned);
      store.setToBeBudgeted(month, currentTBB - delta);
    }
  };

  const getAssignValue = (month: string, categoryId: string): string => {
    const ms = store.monthStates.find((m) => m.month === month);
    const val = ms?.categoryAssignments[categoryId];
    return val === undefined || val === 0 ? '' : String(val);
  };

  const formatMonthHeader = (mStr: string) => {
    const [year, month] = mStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleString('ru-RU', { month: 'short' });
  };

  return (
    <AppLayout>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-[-0.02em] text-[#eef4f8]">Стратегия и План</h2>
      </div>

      <div className="flex flex-col gap-[14px]">
        {/* Info card */}
        <section className="rounded-[18px] bg-[#121821] p-[18px] text-xs text-[#8795a5]">
          <p>
            Матрица планирования: введите суммы, которые планируете отложить в категории в ближайшие 6 месяцев.
          </p>
        </section>

        {/* Matrix Table with horizontal scroll support */}
        <section className="rounded-[18px] bg-[#121821] p-3 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              {/* Table Header */}
              <div className="grid grid-cols-[1.5fr_repeat(6,1fr)] gap-1 pb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#8795a5] border-b border-[rgba(255,255,255,0.06)] text-center">
                <span className="text-left">Категория</span>
                {months.map((m) => (
                  <span key={m}>{formatMonthHeader(m)}</span>
                ))}
              </div>

              {/* Group & Categories Matrix */}
              <div className="mt-2 space-y-4">
                {regularGroups.map((group) => {
                  const groupCats = store.categories
                    .filter((c) => c.groupId === group.id)
                    .sort((a, b) => a.sortOrder - b.sortOrder);

                  if (groupCats.length === 0) return null;

                  return (
                    <div key={group.id} className="space-y-1">
                      {/* Group Header */}
                      <div className="grid grid-cols-[1.5fr_repeat(6,1fr)] gap-1 bg-[#171f2a]/40 px-2 py-1 rounded-lg items-center">
                        <span className="text-xs font-bold text-[#75b8ff] text-left">{group.name}</span>
                        {/* Empty spacing for month columns */}
                        {months.map((m) => {
                          const ms = store.monthStates.find((ms) => ms.month === m);
                          const tbb = ms?.toBeBudgeted ?? 0;
                          return (
                            <span
                              key={m}
                              className={`text-[8px] font-bold tabular-nums text-center ${
                                tbb > 0 ? 'text-[#58d68d]' : tbb < 0 ? 'text-[#e74c3c]' : 'text-[#8795a5]'
                              }`}
                              title={`TBB: ${tbb} ₽`}
                            >
                              {tbb !== 0 ? `${tbb > 0 ? '+' : ''}${tbb}` : ''}
                            </span>
                          );
                        })}
                      </div>

                      {/* Category Rows */}
                      <div className="space-y-1 pl-1">
                        {groupCats.map((cat) => (
                          <div
                            key={cat.id}
                            className="grid grid-cols-[1.5fr_repeat(6,1fr)] gap-1 items-center py-1 border-b border-[rgba(255,255,255,0.02)] last:border-b-0"
                          >
                            {/* Category Name */}
                            <span className="truncate text-xs text-[#eef4f8] text-left font-medium" title={cat.name}>
                              {cat.name}
                            </span>

                            {/* Month Columns (Inputs) */}
                            {months.map((m) => (
                              <div key={m} className="px-0.5">
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={getAssignValue(m, cat.id)}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    const num = raw === '' ? 0 : Number(raw);
                                    if (!isNaN(num)) {
                                      handleMatrixAssignChange(m, cat.id, num);
                                    }
                                  }}
                                  className="w-full rounded bg-[#171f2a] px-1 py-1 text-center text-xs tabular-nums text-[#eef4f8] focus:outline-none focus:ring-1 focus:ring-[#75b8ff]"
                                />
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-[14px]">
        <BottomNavigation activeTab="plan" onTabChange={onTabChange} />
      </div>
    </AppLayout>
  );
}
