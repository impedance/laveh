import type { MockDashboardData } from '../../mock/dashboardData';

interface Props {
  data: MockDashboardData['primaryGoal'];
}

const fmt = (n: number) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'k';
  return n.toLocaleString('ru-RU');
};

export default function PrimaryGoalCard({ data }: Props) {
  return (
    <section className="rounded-[18px] bg-[#121821] p-[18px]">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <strong className="block text-base font-bold text-[#eef4f8]">{data.title}</strong>
          <span className="mt-1 block text-xs text-[#8795a5]">{data.subtitle}</span>
        </div>
        <div className="text-2xl font-extrabold text-[#b794f4]">{data.percent}%</div>
      </div>
      <div className="mb-2 h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
        <div
          className="h-full rounded-full bg-[#b794f4] transition-all"
          style={{ width: `${data.percent}%` }}
        />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <div className="text-xs text-[#8795a5]">Накоплено</div>
          <div className="text-sm font-bold text-[#eef4f8]">{fmt(data.accumulated)}</div>
        </div>
        <div>
          <div className="text-xs text-[#8795a5]">Цель</div>
          <div className="text-sm font-bold text-[#eef4f8]">{fmt(data.target)}</div>
        </div>
        <div>
          <div className="text-xs text-[#8795a5]">До рубежа</div>
          <div className="text-sm font-bold text-[#eef4f8]">{fmt(data.nextMilestone)}</div>
        </div>
      </div>
    </section>
  );
}
