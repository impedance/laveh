interface Props {
  freeMoney: number;       // = toBeBudgeted
  totalAssigned: number;   // how much has been assigned this month
  totalIncome: number;     // income received this month
  onEditBalance?: () => void;
}

export default function FreeMoneyHeroCard({
  freeMoney,
  totalAssigned,
  totalIncome,
  onEditBalance,
}: Props) {
  const isPositive = freeMoney >= 0;

  return (
    <section className="rounded-[18px] border-t-2 border-t-[#58d68d] bg-[#121821] p-[18px]">
      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#75b8ff]">
        Свободно
      </div>

      <div
        className={`mb-1 text-[40px] font-extrabold leading-[0.95] tracking-[-0.05em] ${
          isPositive ? 'text-[#58d68d]' : 'text-[#e74c3c]'
        }`}
      >
        {freeMoney.toLocaleString('ru-RU')} ₽
      </div>

      <div className="mb-4 text-xs text-[#8795a5]">
        Распределено{' '}
        <span className="text-[#eef4f8]">{totalAssigned.toLocaleString('ru-RU')}</span>
        {' '}из{' '}
        <span className="text-[#eef4f8]">{totalIncome.toLocaleString('ru-RU')} ₽</span>
      </div>

      {onEditBalance && (
        <button
          type="button"
          onClick={onEditBalance}
          className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] px-4 py-2.5 text-sm font-semibold text-[#8795a5] hover:text-[#eef4f8] transition-colors"
        >
          Изменить баланс
        </button>
      )}
    </section>
  );
}
