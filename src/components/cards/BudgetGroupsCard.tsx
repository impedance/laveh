import type { BudgetGroupView } from '../../domain/budget/types';

interface Props {
  groups: BudgetGroupView[];
}

export default function BudgetGroupsCard({ groups }: Props) {
  if (groups.length === 0) return null;

  return (
    <section className="rounded-[18px] bg-[#121821] p-[18px]">
      <h3 className="mb-4 text-base font-bold text-[#eef4f8]">Группы трат</h3>
      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.id}>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#75b8ff]">{group.name}</span>
                {group.totalPlan > 0 && (
                  <span className="rounded-full bg-[#171f2a] px-2 py-0.5 text-[11px] text-[#8795a5]">
                    план {group.totalPlan.toLocaleString('ru-RU')} ₽
                  </span>
                )}
              </div>
              <span className="text-xs text-[#8795a5]">
                {group.totalAvailable.toLocaleString('ru-RU')} ₽ доступно
              </span>
            </div>

            {group.planGap > 0 && (
              <div className="mb-2 ml-3 rounded-lg bg-[rgba(231,76,60,0.08)] px-3 py-2">
                <span className="text-xs text-[#e74c3c]">
                  Нужно распределить ещё: {group.planGap.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            )}

            <div className="ml-3 flex flex-col gap-1.5">
              {group.categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm text-[#eef4f8]">{cat.name}</span>
                  <span
                    className={`shrink-0 text-right text-sm tabular-nums ${
                      cat.plan > 0 && cat.assigned >= cat.plan
                        ? 'font-semibold text-[#58d68d]'
                        : cat.plan > 0 && cat.assigned > 0
                          ? 'font-medium text-[#f0c060]'
                          : 'text-[#8795a5]'
                    }`}
                  >
                    {cat.assigned.toLocaleString('ru-RU')}
                    {cat.plan > 0 && (
                      <span className="text-[#8795a5]">
                        {' / '}{cat.plan.toLocaleString('ru-RU')} ₽
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
