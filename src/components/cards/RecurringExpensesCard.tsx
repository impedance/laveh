import type { MockDashboardData } from '../../mock/dashboardData';

interface Props {
  data: MockDashboardData['recurringExpenses'];
}

export default function RecurringExpensesCard({ data }: Props) {
  return (
    <section className="rounded-[18px] bg-[#121821] p-[18px]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-[#eef4f8]">Постоянные расходы</h3>
        <span className="text-xs text-[#8795a5]">план / факт</span>
      </div>
      <div className="flex flex-col gap-4">
        {data.items.map((item) => (
          <div key={item.name}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-[#eef4f8]">{item.name}</span>
              <span className="text-sm text-[#8795a5]">
                {item.amount.toLocaleString('ru-RU')} ₽
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
              <div
                className={`h-full rounded-full transition-all ${
                  item.type === 'warn'
                    ? 'bg-[#f6c85f]'
                    : item.type === 'green'
                      ? 'bg-[#58d68d]'
                      : 'bg-[#75b8ff]'
                }`}
                style={{ width: `${item.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
