import { useState, useEffect } from 'react';

export interface CategoryBudgetRowProps {
  categoryId: string;
  name: string;
  assigned: number;
  activity: number;
  available: number;
  isOverspent: boolean; // strict boolean check: available < 0
  onAssignChange: (newAmount: number) => void;
  onCoverClick: () => void; // Opens WAM modal
}

export default function CategoryBudgetRow({
  categoryId: _categoryId,
  name,
  assigned,
  activity,
  available,
  isOverspent,
  onAssignChange,
  onCoverClick,
}: CategoryBudgetRowProps) {
  const [localAssigned, setLocalAssigned] = useState(assigned === 0 ? '' : String(assigned));

  useEffect(() => {
    setLocalAssigned(assigned === 0 ? '' : String(assigned));
  }, [assigned]);

  const handleChange = (val: string) => {
    setLocalAssigned(val);
    const num = val === '' ? 0 : Number(val);
    if (!isNaN(num)) {
      onAssignChange(num);
    }
  };

  // Available color pill
  const availableBg = isOverspent
    ? 'bg-[#e74c3c] text-[#ffffff] font-bold cursor-pointer hover:opacity-90'
    : available > 0
    ? 'bg-[#58d68d] text-[#090d12] font-semibold'
    : 'bg-[#171f2a] text-[#8795a5]';

  return (
    <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] items-center gap-2 border-b border-[rgba(255,255,255,0.03)] py-1.5 last:border-b-0 text-sm">
      {/* Category Name */}
      <span className="truncate text-[#eef4f8] font-medium pr-1" title={name}>
        {name}
      </span>

      {/* Assigned Column (Input) */}
      <div className="px-0.5">
        <input
          type="number"
          value={localAssigned}
          placeholder="0"
          onChange={(e) => handleChange(e.target.value)}
          className="w-full rounded-lg bg-[#121821] border border-[rgba(255,255,255,0.08)] px-2 py-1 text-right text-xs tabular-nums text-[#eef4f8] focus:border-[#75b8ff] focus:outline-none"
        />
      </div>

      {/* Activity Column */}
      <span
        className={`text-right tabular-nums text-xs font-medium ${
          activity > 0 ? 'text-[#58d68d]' : activity < 0 ? 'text-[#e74c3c]' : 'text-[#8795a5]'
        }`}
      >
        {activity === 0 ? '0' : `${activity > 0 ? '+' : ''}${activity.toLocaleString('ru-RU')} ₽`}
      </span>

      {/* Available Column */}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!isOverspent}
          onClick={onCoverClick}
          className={`rounded-[10px] px-2.5 py-1 text-right tabular-nums text-xs ${availableBg} transition-all`}
        >
          {available.toLocaleString('ru-RU')} ₽
        </button>
      </div>
    </div>
  );
}
