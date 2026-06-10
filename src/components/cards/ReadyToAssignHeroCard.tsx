import { useState } from 'react';

interface Props {
  toBeBudgeted: number;
  ownMoney: number;
  totalDebt: number;
  onAssign?: () => void;
  onEditBalance?: () => void;
}

export default function ReadyToAssignHeroCard({
  toBeBudgeted,
  ownMoney,
  totalDebt,
  onAssign,
  onEditBalance,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="rounded-[18px] border-t-2 border-t-[#58d68d] bg-[#121821] p-[18px]">
      <div className="mb-4">
        <div className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#75b8ff]">
          Готово к раздаче
        </div>
        <div
          className={`text-[34px] font-extrabold leading-[0.98] tracking-[-0.05em] ${
            toBeBudgeted > 0 ? 'text-[#58d68d]' : toBeBudgeted < 0 ? 'text-[#e74c3c]' : 'text-[#eef4f8]'
          }`}
        >
          {toBeBudgeted.toLocaleString('ru-RU')} ₽
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="mb-3 w-full cursor-pointer rounded-xl bg-[#171f2a] px-3 py-2 text-left"
      >
        <div className="flex items-center justify-between">
          <div className="text-xs text-[#8795a5]">Свои средства</div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#eef4f8]">
              {ownMoney.toLocaleString('ru-RU')} ₽
            </span>
            <span className={`text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}>
              ▾
            </span>
          </div>
        </div>
        {expanded && (
          <div className="mt-2 space-y-1">
            {totalDebt > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#e74c3c]">Долги</span>
                <span className="text-xs text-[#e74c3c]">
                  −{totalDebt.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#8795a5]">Чистый капитал</span>
              <span
                className={`text-xs font-semibold ${
                  ownMoney - totalDebt >= 0 ? 'text-[#58d68d]' : 'text-[#e74c3c]'
                }`}
              >
                {(ownMoney - totalDebt).toLocaleString('ru-RU')} ₽
              </span>
            </div>
          </div>
        )}
      </button>

      <div className="flex gap-2">
        {onAssign && (
          <button
            type="button"
            onClick={onAssign}
            className="flex-1 rounded-xl bg-[#58d68d] px-4 py-2.5 text-sm font-bold text-[#090d12]"
          >
            Распределить
          </button>
        )}
        {onEditBalance && (
          <button
            type="button"
            onClick={onEditBalance}
            className="flex-1 rounded-xl border border-[rgba(255,255,255,0.08)] px-4 py-2.5 text-sm font-semibold text-[#8795a5] hover:text-[#eef4f8]"
          >
            Изменить баланс
          </button>
        )}
      </div>
    </section>
  );
}
