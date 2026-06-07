import type { MoneyGuardView } from '../../domain/dashboard/types';

interface Props {
  data: MoneyGuardView;
}

export default function MoneyGuardCard({ data }: Props) {
  return (
    <section className="rounded-[18px] bg-[#121821] p-[18px]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-[#eef4f8]">Money Guard</h3>
        <span className="text-xs text-[#8795a5]">{data.actionCount} действие</span>
      </div>
      <div className="mb-4 rounded-xl bg-[#171f2a] p-3">
        <div className="flex items-start justify-between">
          <div className="mr-3">
            <strong className="block text-sm font-semibold text-[#eef4f8]">{data.action.title}</strong>
            <span className="mt-1 block text-xs text-[#8795a5]">{data.action.description}</span>
          </div>
          <button className="whitespace-nowrap rounded-full border border-[rgba(255,255,255,0.08)] px-4 py-2 text-xs font-semibold text-[#8795a5] transition-colors hover:text-[#eef4f8]">
            Сделать
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.08)] pt-3">
        <div>
          <div className="text-sm font-medium text-[#eef4f8]">
            {data.uncategorized.count} {data.uncategorized.label}
          </div>
          <div className="mt-0.5 text-xs text-[#8795a5]">после последней Excel-выгрузки</div>
        </div>
        <span className="text-sm font-bold text-[#75b8ff]">Проверить</span>
      </div>
    </section>
  );
}
