import type { Account } from '../../store/types';

interface Props {
  accounts: Account[];
}

function fmt(amount: number, showSign = false): string {
  const sign = showSign && amount > 0 ? '+' : '';
  return `${sign}${amount.toLocaleString('ru-RU')} ₽`;
}

export default function AccountsSummaryCard({ accounts }: Props) {
  const debitAccounts = accounts.filter((a) => a.type === 'debit' && a.onBudget);
  const creditAccounts = accounts.filter((a) => a.type === 'credit');

  if (debitAccounts.length === 0 && creditAccounts.length === 0) return null;

  const debitTotal = debitAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const totalDebt = creditAccounts
    .filter((a) => a.onBudget)
    .reduce((sum, a) => sum + Math.max(0, -a.currentBalance), 0);

  return (
    <section className="rounded-[18px] bg-[#121821] p-[18px]">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-base">🏦</span>
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8795a5]">
          Счета
        </span>
      </div>

      {/* Debit accounts */}
      {debitAccounts.length > 0 && (
        <div className="flex flex-col gap-2">
          {debitAccounts.map((acc) => (
            <div key={acc.id} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#8795a5]">🏦</span>
                <span className="text-sm text-[#c8d6e0]">{acc.name}</span>
              </div>
              <span
                className={`text-sm font-semibold tabular-nums ${
                  acc.currentBalance >= 0 ? 'text-[#58d68d]' : 'text-[#e74c3c]'
                }`}
              >
                {fmt(acc.currentBalance, true)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Credit cards */}
      {creditAccounts.length > 0 && (
        <>
          {debitAccounts.length > 0 && (
            <div className="my-3 border-t border-[rgba(255,255,255,0.06)]" />
          )}
          <div className="flex flex-col gap-2">
            {creditAccounts.map((acc) => {
              const debt = Math.max(0, -acc.currentBalance);
              const limit = acc.creditLimit ?? 0;
              const used = limit > 0 ? Math.min(1, debt / limit) : 0;
              return (
                <div key={acc.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[#8795a5]">💳</span>
                      <span className="text-sm text-[#c8d6e0]">{acc.name}</span>
                      {!acc.onBudget && (
                        <span className="rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#8795a5] bg-[#171f2a]">
                          вне бюджета
                        </span>
                      )}
                    </div>
                    <span className={`text-sm font-semibold tabular-nums ${debt > 0 ? 'text-[#e74c3c]' : 'text-[#58d68d]'}`}>
                      {debt > 0 ? `−${debt.toLocaleString('ru-RU')} ₽` : '0 ₽'}
                    </span>
                  </div>
                  {limit > 0 && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#171f2a]">
                        <div
                          className="h-full rounded-full bg-[#e74c3c] transition-all"
                          style={{ width: `${used * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] tabular-nums text-[#8795a5]">
                        {debt.toLocaleString('ru-RU')} / {limit.toLocaleString('ru-RU')}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Net total (onBudget only) */}
      <div className="mt-3 flex items-center justify-between border-t border-[rgba(255,255,255,0.06)] pt-3">
        <div>
          <span className="text-xs text-[#8795a5]">Итого</span>
          {totalDebt > 0 && (
            <span className="ml-2 text-[10px] text-[#e74c3c]">
              долг {totalDebt.toLocaleString('ru-RU')} ₽
            </span>
          )}
        </div>
        <span
          className={`text-sm font-bold tabular-nums ${
            debitTotal >= 0 ? 'text-[#eef4f8]' : 'text-[#e74c3c]'
          }`}
        >
          {fmt(debitTotal)}
        </span>
      </div>
    </section>
  );
}
