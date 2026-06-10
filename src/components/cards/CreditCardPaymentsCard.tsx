import type { CreditCardPaymentView } from '../../domain/budget/types';

interface Props {
  payments: CreditCardPaymentView[];
}

export default function CreditCardPaymentsCard({ payments }: Props) {
  if (payments.length === 0) return null;

  return (
    <section className="rounded-[18px] bg-[#121821] p-[18px]">
      <h3 className="mb-4 text-base font-bold text-[#eef4f8]">Кредитные карты</h3>
      <div className="flex flex-col gap-3">
        {payments.map((cc) => {
          const isOverpayment = cc.balance > 0;

          return (
            <div key={cc.accountId} className="rounded-xl bg-[#171f2a] p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-[#eef4f8]">{cc.accountName}</span>
                <div className="flex items-center gap-2">
                  {cc.creditLimit && (
                    <span className="text-xs text-[#8795a5]">
                      Лимит: {cc.creditLimit.toLocaleString('ru-RU')} ₽
                    </span>
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      cc.balance >= 0 ? 'text-[#58d68d]' : 'text-[#e74c3c]'
                    }`}
                  >
                    {cc.balance >= 0 ? '+' : ''}
                    {cc.balance.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>

              {isOverpayment ? (
                <div className="rounded-lg bg-[rgba(88,214,141,0.08)] px-2 py-1.5 text-xs text-[#58d68d]">
                  Переплата: {cc.balance.toLocaleString('ru-RU')} ₽ — можно тратить как дебетовый
                </div>
              ) : (
                <div className="space-y-1.5">
                  {cc.debtRemaining > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8795a5]">Долг</span>
                      <span className="text-sm font-semibold text-[#e74c3c]">
                        {cc.debtRemaining.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8795a5]">Зарезервировано для оплаты</span>
                    <span className="text-sm font-semibold text-[#75b8ff]">
                      {cc.available.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  {cc.activity > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8795a5]">Траты в этом месяце</span>
                      <span className="text-sm text-[#e74c3c]">
                        {cc.activity.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  )}
                  {cc.assigned > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8795a5]">Доп. погашение долга</span>
                      <span className="text-sm text-[#eef4f8]">
                        +{cc.assigned.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  )}
                  {cc.paymentGap > 0 && (
                    <div className="mt-1.5 rounded-lg bg-[rgba(231,76,60,0.1)] px-2 py-1.5 text-xs text-[#e74c3c]">
                      Не хватает для полного погашения: {cc.paymentGap.toLocaleString('ru-RU')} ₽
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
