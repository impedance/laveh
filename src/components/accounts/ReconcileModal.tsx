import { useState } from 'react';

export interface ReconcileModalProps {
  accountId: string;
  accountName: string;
  calculatedBalance: number;
  onConfirm: (actualBalance: number) => void;
  onClose: () => void;
}

export default function ReconcileModal({
  accountName,
  calculatedBalance,
  onConfirm,
  onClose,
}: ReconcileModalProps) {
  const [inputValue, setInputValue] = useState<string>('');

  const actualBalance = inputValue === '' ? calculatedBalance : Number(inputValue);
  const discrepancy = actualBalance - calculatedBalance;

  const handleConfirm = () => {
    onConfirm(actualBalance);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-8">
      <div className="w-full max-w-[430px] rounded-[18px] bg-[#121821] p-[18px]">
        <h3 className="mb-2 text-base font-bold text-[#eef4f8]">Сверка баланса</h3>
        <p className="mb-4 text-xs text-[#8795a5]">
          Введите фактический баланс для счета <strong className="text-[#eef4f8]">{accountName}</strong>. 
          Если он отличается, будет создана корректирующая транзакция.
        </p>

        <div className="mb-4 space-y-4">
          <div className="flex justify-between items-center rounded-xl bg-[#171f2a] p-3">
            <span className="text-sm text-[#8795a5]">Расчетный баланс</span>
            <span className="text-sm font-semibold text-[#eef4f8]">
              {calculatedBalance.toLocaleString('ru-RU')} ₽
            </span>
          </div>

          <div className="rounded-xl bg-[#171f2a] p-3">
            <label className="block text-xs text-[#8795a5] mb-1.5">Фактический баланс</label>
            <input
              type="number"
              placeholder={String(calculatedBalance)}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full rounded-xl bg-[#121821] px-3 py-2 text-right text-sm text-[#eef4f8] outline-none"
              autoFocus
            />
          </div>

          {discrepancy !== 0 && (
            <div className="flex justify-between items-center rounded-xl bg-[#171f2a]/50 p-3 border border-[rgba(231,76,60,0.2)]">
              <span className="text-sm text-[#8795a5]">Расхождение</span>
              <span className={`text-sm font-bold ${discrepancy > 0 ? 'text-[#58d68d]' : 'text-[#e74c3c]'}`}>
                {discrepancy > 0 ? '+' : ''}{discrepancy.toLocaleString('ru-RU')} ₽
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-[rgba(255,255,255,0.08)] px-4 py-3 text-sm font-semibold text-[#8795a5]"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 rounded-xl bg-[#75b8ff] px-4 py-3 text-sm font-bold text-[#090d12]"
          >
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
}
