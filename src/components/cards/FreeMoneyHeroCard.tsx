interface Props {
  freeMoney: number;
  ownMoney: number;
  onEditBalance?: () => void;
}

export default function FreeMoneyHeroCard({ freeMoney, ownMoney, onEditBalance }: Props) {
  const isPositive = freeMoney >= 0;

  return (
    <section className="rounded-[18px] border-t-2 border-t-[#58d68d] bg-[#121821] p-[18px]">
      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#75b8ff]">
        Свободно сейчас
      </div>

      <div
        className={`mb-1 text-[40px] font-extrabold leading-[0.95] tracking-[-0.05em] ${
          isPositive ? 'text-[#58d68d]' : 'text-[#e74c3c]'
        }`}
      >
        {freeMoney.toLocaleString('ru-RU')} ₽
      </div>

      <div className="mb-4 text-xs text-[#8795a5]">
        после всех обязательств · баланс:{' '}
        <span className="text-[#eef4f8]">{ownMoney.toLocaleString('ru-RU')} ₽</span>
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
