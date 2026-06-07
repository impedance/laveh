import type { FreeMoneyView } from '../../domain/dashboard/types';

interface Props {
  data: FreeMoneyView;
}

export default function FreeMoneyHeroCard({ data }: Props) {
  return (
    <section className="rounded-[18px] border-t-2 border-t-[#58d68d] bg-[#121821] p-[18px]">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#75b8ff]">
            Свободно до следующего дохода
          </div>
          <div className="text-[34px] font-extrabold leading-[0.98] tracking-[-0.05em] text-[#eef4f8]">
            {data.amount.toLocaleString('ru-RU')} ₽
          </div>
        </div>
        <span className="whitespace-nowrap rounded-full bg-[rgba(88,214,141,0.12)] px-3 py-1 text-xs font-semibold text-[#58d68d]">
          Режим: {data.mode}
        </span>
      </div>
      <div className="mb-4 flex items-center gap-2 text-sm">
        <span className="text-[#8795a5]">Нужно отложить</span>
        <strong className="text-[#eef4f8]">
          {data.needToSave.toLocaleString('ru-RU')} ₽ до {data.needToSaveUntil}
        </strong>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div>
          <div className="text-xs text-[#8795a5]">Баланс сейчас</div>
          <div className="text-sm font-bold text-[#eef4f8]">{data.balanceNow.toLocaleString('ru-RU')} ₽</div>
        </div>
        <div>
          <div className="text-xs text-[#8795a5]">Распределено</div>
          <div className="text-sm font-bold text-[#eef4f8]">{data.distributed.toLocaleString('ru-RU')} ₽</div>
        </div>
        <div>
          <div className="text-xs text-[#8795a5]">Следующий доход</div>
          <div className="text-sm font-bold text-[#eef4f8]">{data.nextIncome}</div>
        </div>
        <div>
          <div className="text-xs text-[#8795a5]">Импорт Excel</div>
          <div className="text-sm font-bold text-[#eef4f8]">{data.lastImport}</div>
        </div>
      </div>
    </section>
  );
}
