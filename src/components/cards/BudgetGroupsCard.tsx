import { useState } from 'react';
import type { BudgetGroupView } from '../../domain/budget/types';

interface Props {
  groups: BudgetGroupView[];
}

function CategoryRow({ cat, groupType }: { cat: BudgetGroupView['categories'][number]; groupType?: string }) {
  // AICODE-NOTE: YNAB semantics — available = assigned + carryover + activity
  // paid: plan>0 and spending happened covering the plan (available <= 0, activity < 0)
  // pending: plan>0 and available > 0 (money in envelope, not yet spent)
  // overspent: available < 0 without spending (shouldn't happen in normal flow)
  const hasPlan = cat.plan > 0;
  const isPaid = hasPlan && cat.activity < 0 && cat.available <= 0;
  const isOverspent = cat.available < 0 && !isPaid;
  const spentAbs = Math.abs(cat.activity);

  return (
    <div className="border-b border-[rgba(255,255,255,0.04)] last:border-0 py-2.5">
      <div className="flex items-center justify-between gap-2">
        {/* Status icon + name */}
        <div className="flex items-center gap-2 min-w-0">
          {hasPlan && (
            <span className="shrink-0 text-sm">
              {isPaid ? '✅' : isOverspent ? '⚠️' : '⏳'}
            </span>
          )}
          <span className={`truncate text-sm ${isPaid ? 'text-[#8795a5]' : 'text-[#eef4f8]'}`}>
            {cat.name}
          </span>
        </div>

        {/* Right: amount */}
        <div className="shrink-0 text-right">
          {hasPlan ? (
            <>
              <div
                className={`text-sm font-semibold tabular-nums ${
                  isPaid ? 'text-[#58d68d]' : isOverspent ? 'text-[#e74c3c]' : 'text-[#eef4f8]'
                }`}
              >
                {isPaid
                  ? `−${spentAbs.toLocaleString('ru-RU')} ₽`
                  : `${cat.available.toLocaleString('ru-RU')} ₽`}
              </div>
              <div className="text-[10px] tabular-nums text-[#8795a5]">
                {isPaid
                  ? `план ${cat.plan.toLocaleString('ru-RU')} ₽`
                  : `из ${cat.plan.toLocaleString('ru-RU')} ₽`}
              </div>
            </>
          ) : (
            <span className={`text-sm tabular-nums ${cat.available !== 0 ? 'text-[#eef4f8]' : 'text-[#8795a5]'}`}>
              {cat.available !== 0 ? `${cat.available.toLocaleString('ru-RU')} ₽` : '—'}
            </span>
          )}
        </div>
      </div>

      {/* Micro progress bar for pending payments */}
      {hasPlan && !isPaid && cat.assigned > 0 && (
        <div className="mt-1.5 h-0.5 rounded-full bg-[#1e2a38] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, (spentAbs / cat.plan) * 100)}%`,
              backgroundColor: groupType === 'obligatory' ? '#e74c3c' : '#f0c060',
            }}
          />
        </div>
      )}
    </div>
  );
}

function GroupRow({ group }: { group: BudgetGroupView }) {
  const isCore = group.type === 'obligatory' || group.type === 'regular';
  const [open, setOpen] = useState(isCore);

  // Count paid categories for header badge
  const planCount = group.categories.filter((c) => c.plan > 0).length;
  const paidCount = group.categories.filter(
    (c) => c.plan > 0 && c.activity < 0 && c.available <= 0
  ).length;

  const barColor =
    group.type === 'obligatory' ? '#e74c3c'
    : group.type === 'regular'  ? '#f0c060'
    : '#75b8ff';

  return (
    <div className="border-b border-[rgba(255,255,255,0.05)] last:border-0 pb-1 last:pb-0">
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
          {planCount > 0 && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              paidCount === planCount
                ? 'bg-[rgba(88,214,141,0.12)] text-[#58d68d]'
                : 'bg-[#171f2a] text-[#8795a5]'
            }`}>
              {paidCount}/{planCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {group.planGap > 0 && (
            <span className="text-[10px] text-[#e74c3c]">
              −{group.planGap.toLocaleString('ru-RU')} ₽
            </span>
          )}
          <span className={`text-xs text-[#8795a5] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </div>
      </button>

      {/* Category rows */}
      {open && (
        <div className="ml-3 flex flex-col">
          {group.categories.map((cat) => (
            <CategoryRow key={cat.id} cat={cat} groupType={group.type} />
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
