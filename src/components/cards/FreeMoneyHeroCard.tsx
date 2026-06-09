import type { FreeMoneyView } from '../../domain/dashboard/types';

interface Props {
  data: FreeMoneyView;
  onEditBalance?: () => void;
}

export default function FreeMoneyHeroCard({ data, onEditBalance }: Props) {
  return (
    <section className="rounded-[18px] border-t-2 border-t-[#58d68d] bg-[#121821] p-[18px]">
      <div className="mb-4">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#75b8ff]">
            Свободно до следующего дохода
          </div>
          <div className="text-[34px] font-extrabold leading-[0.98] tracking-[-0.05em] text-[#eef4f8]">
            {data.amount.toLocaleString('ru-RU')} ₽
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onEditBalance}
        className="cursor-pointer text-left"
      >
        <div className="mb-1">
          <div className="text-xs text-[#8795a5]">Свои деньги</div>
          <div className="text-sm font-bold text-[#eef4f8]">{data.ownMoney.toLocaleString('ru-RU')} ₽</div>
        </div>
        {data.totalDebt > 0 && (
          <div>
            <div className="text-xs text-[#e74c3c]">Долги</div>
            <div className="text-sm font-bold text-[#e74c3c]">−{data.totalDebt.toLocaleString('ru-RU')} ₽</div>
          </div>
        )}
      </button>
    </section>
  );
}
