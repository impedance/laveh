import type { ObligatoryPaymentView } from '../../domain/dashboard/types';

interface Props {
  payments: ObligatoryPaymentView[];
  freeAmount: number;
  onEdit: () => void;
}

function formatDueDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

export default function ObligatoryPaymentsCard({ payments, freeAmount, onEdit }: Props) {
  const duePayments = payments.filter((p) => p.isDue);
  const totalDue = duePayments.reduce((sum, p) => sum + p.amount, 0);
  const afterObligatory = freeAmount - totalDue;

  return (
    <section className="rounded-[18px] border-t-2 border-t-[#e74c3c] bg-[#121821] p-[18px]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-[#eef4f8]">Обязательные платежи</h3>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg px-2 py-1 text-xs font-semibold text-[#75b8ff] transition-colors hover:bg-[#171f2a]"
        >
          Изменить
        </button>
      </div>

      {payments.length === 0 ? (
        <p className="text-sm text-[#8795a5]">Нет обязательных платежей</p>
      ) : (
        <>
          <div className="mb-3 flex flex-col gap-2">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl bg-[#171f2a] px-3 py-2"
              >
                <div>
                  <div className="text-sm font-medium text-[#eef4f8]">{p.name}</div>
                  <div className="text-xs text-[#8795a5]">
                    {formatDueDate(p.dueDate)} · {p.isDue ? 'к оплате' : 'после дохода'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-[#eef4f8]">
                    {p.amount.toLocaleString('ru-RU')} ₽
                  </div>
                  {p.isDue && (
                    <div className="text-xs text-[#e74c3c]">—</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-[#171f2a] p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#e74c3c]">К оплате до дохода</span>
              <span className="text-sm font-bold text-[#e74c3c]">
                {totalDue.toLocaleString('ru-RU')} ₽
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-[#8795a5]">Остаток после платежей</span>
              <span className={`text-sm font-bold ${afterObligatory >= 0 ? 'text-[#58d68d]' : 'text-[#e74c3c]'}`}>
                {afterObligatory.toLocaleString('ru-RU')} ₽
              </span>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
