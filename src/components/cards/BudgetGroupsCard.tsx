import { useState } from 'react';
import type { BudgetGroupView } from '../../domain/budget/types';

interface Props {
  groups: BudgetGroupView[];
}

function GroupRow({ group }: { group: BudgetGroupView }) {
  const isCore = group.type === 'obligatory' || group.type === 'regular';
  const [open, setOpen] = useState(isCore);

  const pct = group.totalPlan > 0
    ? Math.min(100, Math.round((group.totalAssigned / group.totalPlan) * 100))
    : 0;

  const barColor =
    group.type === 'obligatory' ? '#e74c3c'
    : group.type === 'regular'  ? '#f0c060'
    : '#75b8ff';

  return (
    <div className="border-b border-[rgba(255,255,255,0.05)] last:border-0 pb-3 last:pb-0">
      {/* Group header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: barColor }}
          />
          <span className="text-sm font-bold text-[#eef4f8]">{group.name}</span>
          {group.totalPlan > 0 && (
            <span className="rounded-full bg-[#171f2a] px-2 py-0.5 text-[11px] text-[#8795a5]">
              {group.totalPlan.toLocaleString('ru-RU')} ₽
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-[#8795a5]">
            {group.totalAssigned.toLocaleString('ru-RU')} ₽
          </span>
          <span className={`text-xs text-[#8795a5] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </div>
      </button>

      {/* Progress bar */}
      {group.totalPlan > 0 && (
        <div className="mb-2 h-1 rounded-full bg-[#1e2a38] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, backgroundColor: barColor, opacity: 0.7 }}
          />
        </div>
      )}

      {/* Gap warning */}
      {open && group.planGap > 0 && (
        <div className="mb-2 ml-3 rounded-lg bg-[rgba(231,76,60,0.08)] px-3 py-2">
          <span className="text-xs text-[#e74c3c]">
            Нужно распределить ещё: {group.planGap.toLocaleString('ru-RU')} ₽
          </span>
        </div>
      )}

      {/* Category rows */}
      {open && (
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
      )}
    </div>
  );
}

export default function BudgetGroupsCard({ groups }: Props) {
  if (groups.length === 0) return null;

  const coreGroups = groups.filter(
    (g) => g.type === 'obligatory' || g.type === 'regular',
  );
  const sinkingGroups = groups.filter((g) => g.type === 'sinking_fund');
  const otherGroups = groups.filter(
    (g) => g.type !== 'obligatory' && g.type !== 'regular' && g.type !== 'sinking_fund',
  );

  return (
    <div className="flex flex-col gap-[14px]">
      {/* Обязательные + Регулярные */}
      {coreGroups.length > 0 && (
        <section className="rounded-[18px] bg-[#121821] p-[18px]">
          <h3 className="mb-3 text-base font-bold text-[#eef4f8]">Обязательства</h3>
          <div className="flex flex-col gap-0">
            {coreGroups.map((g) => (
              <GroupRow key={g.id} group={g} />
            ))}
          </div>
        </section>
      )}

      {/* Копилки / Цели */}
      {sinkingGroups.length > 0 && (
        <section className="rounded-[18px] bg-[#121821] p-[18px]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#eef4f8]">Копилки</h3>
            <span className="text-xs text-[#8795a5]">откладываю</span>
          </div>
          <div className="flex flex-col gap-0">
            {sinkingGroups.map((g) => (
              <GroupRow key={g.id} group={g} />
            ))}
          </div>
        </section>
      )}

      {/* Прочие группы */}
      {otherGroups.length > 0 && (
        <section className="rounded-[18px] bg-[#121821] p-[18px]">
          <h3 className="mb-3 text-base font-bold text-[#eef4f8]">Прочее</h3>
          <div className="flex flex-col gap-0">
            {otherGroups.map((g) => (
              <GroupRow key={g.id} group={g} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
