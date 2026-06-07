import type { SafeDailyPaceView } from '../../domain/dashboard/types';

interface Props {
  data: SafeDailyPaceView;
}

export default function SafeDailyPaceCard({ data }: Props) {
  return (
    <section className="rounded-[18px] bg-[#121821] p-[18px]">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#75b8ff]">
            Безопасный темп трат
          </div>
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-[#eef4f8]">
            {data.perDay.toLocaleString('ru-RU')} ₽ / день
          </div>
          <div className="mt-1 text-xs text-[#8795a5]">
            Сегодня потрачено {data.spentToday.toLocaleString('ru-RU')} ₽ · осталось{' '}
            {data.remainingToday.toLocaleString('ru-RU')} ₽
          </div>
        </div>
        <div className="relative flex h-20 w-20 items-center justify-center">
          <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="#58d68d"
              strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - data.percentUsed / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <span className="relative text-lg font-bold text-[#58d68d]">{data.percentUsed}%</span>
        </div>
      </div>
    </section>
  );
}
