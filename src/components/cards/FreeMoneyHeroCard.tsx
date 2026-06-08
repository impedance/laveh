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
      <div>
        <button
          type="button"
          onClick={onEditBalance}
          className="cursor-pointer text-left"
        >
          <div className="text-xs text-[#8795a5]">Баланс сейчас</div>
          <div className="text-sm font-bold text-[#eef4f8]">{data.balanceNow.toLocaleString('ru-RU')} ₽</div>
          {data.creditAvailable > 0 && (
            <div className="text-xs text-[#75b8ff] mt-0.5">
              включая {data.creditAvailable.toLocaleString('ru-RU')} ₽ кредитных
            </div>
          )}
        </button>
      </div>
    </section>
  );
}
