import React from 'react';
import { useStore } from '../../store';

export interface PlannerMatrixProps {
  categories: { id: string; name: string; groupId: string }[];
  months: string[]; // ['2026-06', '2026-07', ...]
  targets: Record<string, Record<string, number>>; // month -> categoryId -> amount
  onUpdateTarget: (month: string, categoryId: string, amount: number) => void;
}

export default function PlannerMatrix({
  categories,
  months,
  targets,
  onUpdateTarget,
}: PlannerMatrixProps) {
  const categoryGroups = useStore((s) => s.categoryGroups);

  // Group categories by groupId
  const groupedCategories = categories.reduce((acc, cat) => {
    if (!acc[cat.groupId]) {
      acc[cat.groupId] = [];
    }
    acc[cat.groupId].push(cat);
    return acc;
  }, {} as Record<string, typeof categories>);

  // Sort groups by their sortOrder from store
  const sortedGroupIds = Object.keys(groupedCategories).sort((a, b) => {
    const groupA = categoryGroups.find((g) => g.id === a);
    const groupB = categoryGroups.find((g) => g.id === b);
    return (groupA?.sortOrder ?? 0) - (groupB?.sortOrder ?? 0);
  });

  // Helper to format month header (e.g., "2026-06" -> "Июн 26")
  const formatMonthHeader = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' });
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#121821]">
      <table className="w-full min-w-[600px] border-collapse text-xs text-[#eef4f8]">
        <thead>
          <tr className="border-b border-[rgba(255,255,255,0.08)] bg-[#171f2a]">
            <th className="sticky left-0 z-10 bg-[#171f2a] p-2 text-left font-bold text-[#8795a5] border-r border-[rgba(255,255,255,0.06)] min-w-[140px]">
              Категория
            </th>
            {months.map((month) => (
              <th key={month} className="p-2 text-right font-bold text-[#8795a5] min-w-[80px]">
                {formatMonthHeader(month)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedGroupIds.map((groupId) => {
            const group = categoryGroups.find((g) => g.id === groupId);
            const cats = groupedCategories[groupId];
            if (!cats || cats.length === 0) return null;

            return (
              <React.Fragment key={groupId}>
                {/* Group Header Row */}
                <tr className="bg-[#171f2a]/40 font-semibold border-b border-[rgba(255,255,255,0.04)]">
                  <td className="sticky left-0 z-10 bg-[#121821] p-2 text-[#75b8ff] border-r border-[rgba(255,255,255,0.06)]">
                    {group?.name || 'Без группы'}
                  </td>
                  {months.map((month) => (
                    <td key={month} className="p-2 text-right text-[#8795a5]">
                      {/* Empty space for months in group header row */}
                      —
                    </td>
                  ))}
                </tr>

                {/* Category Rows */}
                {cats.map((cat) => (
                  <tr key={cat.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[#171f2a]/20">
                    <td className="sticky left-0 z-10 bg-[#121821] p-2 font-medium text-[#eef4f8] border-r border-[rgba(255,255,255,0.06)]">
                      {cat.name}
                    </td>
                    {months.map((month) => {
                      const value = targets[month]?.[cat.id] ?? 0;
                      return (
                        <td key={month} className="p-1 text-right">
                          <input
                            type="number"
                            value={value || ''}
                            placeholder="0"
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : Number(e.target.value);
                              onUpdateTarget(month, cat.id, val);
                            }}
                            className="w-full rounded bg-transparent px-1 py-0.5 text-right font-mono text-xs tabular-nums text-[#eef4f8] focus:bg-[#1e2a3a] focus:outline-none focus:ring-1 focus:ring-[#75b8ff]/50"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
