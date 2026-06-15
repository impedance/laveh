import type { Account } from '../../store/types';

interface Props {
  accounts: Account[];
}

function formatBalance(amount: number): string {
  const sign = amount > 0 ? '+' : '';
  return `${sign}${amount.toLocaleString('ru-RU')} ₽`;
}

export default function AccountsSummaryCard({ accounts }: Props) {
  const onBudgetAccounts = accounts.filter((a) => a.onBudget);
  const netTotal = onBudgetAccounts.reduce((sum, a) => sum + a.currentBalance, 0);

  if (onBudgetAccounts.length === 0) return null;

  return (
    <section className="rounded-[18px] bg-[#121821] p-[18px]">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-base">💳</span>
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8795a5]">
          Счета
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {onBudgetAccounts.map((account) => {
          const isPositive = account.currentBalance >= 0;
          return (
            <div key={account.id} className="flex items-center justify-between">
              <span className="text-sm text-[#c8d6e0]">{account.name}</span>
              <span
                className={`text-sm font-semibold tabular-nums ${
                  isPositive ? 'text-[#58d68d]' : 'text-[#e74c3c]'
                }`}
              >
                {formatBalance(account.currentBalance)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[rgba(255,255,255,0.06)] pt-3">
        <span className="text-xs text-[#8795a5]">Итого</span>
        <span
          className={`text-sm font-bold tabular-nums ${
            netTotal >= 0 ? 'text-[#eef4f8]' : 'text-[#e74c3c]'
          }`}
        >
          {netTotal.toLocaleString('ru-RU')} ₽
        </span>
      </div>
    </section>
  );
}
