import type { MockDashboardData } from '../../mock/dashboardData';

interface Props {
  data: MockDashboardData['obligations'];
}

export default function UpcomingObligationsCard({ data }: Props) {
  return (
    <section className="rounded-[18px] bg-[#121821] p-[18px]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-[#eef4f8]">Ближайшие обязательства</h3>
        <span className="text-xs text-[#8795a5]">{data.period}</span>
      </div>
      <div className="mb-4 flex items-start justify-between rounded-xl bg-[#171f2a] p-3">
        <div>
          <div className="text-sm font-bold text-[#f6c85f]">
            Ещё распределить: {data.remainingToAllocate.toLocaleString('ru-RU')} ₽
          </div>
          <div className="mt-1 text-xs text-[#8795a5]">
            Нужно {data.totalNeeded.toLocaleString('ru-RU')} ₽ · уже отложено {data.alreadyAllocated.toLocaleString('ru-RU')} ₽
          </div>
        </div>
        <button className="whitespace-nowrap rounded-full border border-[rgba(255,255,255,0.08)] px-4 py-2 text-xs font-semibold text-[#8795a5] transition-colors hover:text-[#eef4f8]">
          Закрыть gap
        </button>
      </div>
      {data.items.map((item) => (
        <div key={item.title} className="flex items-center justify-between border-t border-[rgba(255,255,255,0.08)] py-3">
          <div>
            <div className="text-sm font-medium text-[#eef4f8]">{item.title}</div>
            <div className="mt-0.5 text-xs text-[#8795a5]">{item.date} · {item.status}</div>
          </div>
          <div className={`text-sm font-bold ${item.type === 'ok' ? 'text-[#58d68d]' : 'text-[#f6c85f]'}`}>
            {item.amount.toLocaleString('ru-RU')} ₽
          </div>
        </div>
      ))}
    </section>
  );
}
