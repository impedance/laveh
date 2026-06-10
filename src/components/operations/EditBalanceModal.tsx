import { useState } from 'react';
import { useStore } from '../../store';

interface Props {
  onClose: () => void;
}

export default function EditBalanceModal({ onClose }: Props) {
  const storeAccounts = useStore((s) => s.accounts);
  const updateAccount = useStore((s) => s.updateAccount);
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [creditLimitEdits, setCreditLimitEdits] = useState<Record<string, number>>({});

  const handleSave = () => {
    for (const [id, change] of Object.entries(edits)) {
      const acc = storeAccounts.find((a) => a.id === id);
      if (acc) {
        updateAccount(id, { currentBalance: acc.currentBalance + change });
      }
    }
    for (const [id, limit] of Object.entries(creditLimitEdits)) {
      const acc = storeAccounts.find((a) => a.id === id);
      if (acc) {
        updateAccount(id, { creditLimit: limit });
      }
    }
    onClose();
  };

  const debitAccounts = storeAccounts.filter(
    (a) => a.type === 'debit' && a.onBudget,
  );
  const creditAccounts = storeAccounts.filter(
    (a) => a.type === 'credit' && a.onBudget,
  );
  const excludedAccounts = storeAccounts.filter(
    (a) => !a.onBudget,
  );

  const currentTotal =
    debitAccounts.reduce((sum, a) => sum + a.currentBalance + (edits[a.id] ?? 0), 0) +
    creditAccounts.reduce((sum, a) => sum + Math.max(0, a.currentBalance + (edits[a.id] ?? 0)), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-8">
      <div className="w-full max-w-[430px] rounded-[18px] bg-[#121821] p-[18px]">
        <h3 className="mb-2 text-base font-bold text-[#eef4f8]">Свои деньги</h3>
        <p className="mb-4 text-xs text-[#8795a5]">
          Свои реальные деньги: дебетовые остатки и переплаты по кредиткам.
        </p>

        <div className="mb-4 space-y-3">
          {debitAccounts.length > 0 && (
            <>
              <div className="text-xs font-semibold text-[#8795a5]">Дебетовые счета</div>
              {debitAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center gap-3 rounded-xl bg-[#171f2a] p-3"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#eef4f8]">{acc.name}</div>
                    <div className="text-xs text-[#8795a5]">
                      {acc.currentBalance.toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                  <input
                    type="number"
                    placeholder="±0"
                    value={edits[acc.id] ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEdits((prev) => ({
                        ...prev,
                        [acc.id]: v === '' || v === '-' ? 0 : Number(v),
                      }));
                    }}
                    className="w-32 rounded-xl bg-[#121821] px-3 py-2 text-right text-sm text-[#eef4f8] outline-none"
                  />
                </div>
              ))}
            </>
          )}

          {creditAccounts.length > 0 && (
            <>
              <div className="text-xs font-semibold text-[#8795a5]">Кредитные счета</div>
              {creditAccounts.map((acc) => {
                const editedBalance = acc.currentBalance + (edits[acc.id] ?? 0);
                return (
                  <div
                    key={acc.id}
                    className="rounded-xl bg-[#171f2a] p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-sm font-medium text-[#eef4f8]">{acc.name}</div>
                      {editedBalance < 0 ? (
                        <div className="text-xs text-[#e74c3c]">
                          Долг: {Math.abs(editedBalance).toLocaleString('ru-RU')} ₽
                        </div>
                      ) : (
                        <div className="text-xs text-[#58d68d]">
                          Переплата: {editedBalance.toLocaleString('ru-RU')} ₽
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1">
                        <label className="block text-xs text-[#8795a5] mb-0.5">Баланс</label>
                        <input
                          type="number"
                          placeholder="±0"
                          value={edits[acc.id] ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            setEdits((prev) => ({
                              ...prev,
                              [acc.id]: v === '' || v === '-' ? 0 : Number(v),
                            }));
                          }}
                          className="w-full rounded-xl bg-[#121821] px-3 py-2 text-right text-sm text-[#eef4f8] outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-[#8795a5] mb-0.5">Лимит</label>
                        <input
                          type="number"
                          placeholder={String(acc.creditLimit ?? 0)}
                          value={creditLimitEdits[acc.id] ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCreditLimitEdits((prev) => ({
                              ...prev,
                              [acc.id]: v === '' || v === '-' ? 0 : Number(v),
                            }));
                          }}
                          className="w-full rounded-xl bg-[#121821] px-3 py-2 text-right text-sm text-[#eef4f8] outline-none"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-[#8795a5]">
                      Текущий баланс: {acc.currentBalance.toLocaleString('ru-RU')} ₽ · Лимит: {(creditLimitEdits[acc.id] ?? acc.creditLimit ?? 0).toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {excludedAccounts.length > 0 && (
            <>
              <div className="text-xs font-semibold text-[#8795a5]">
                Не участвуют в балансе
              </div>
              {excludedAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center gap-3 rounded-xl bg-[#171f2a] p-3 opacity-50"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#8795a5]">{acc.name}</div>
                    <div className="text-xs text-[#8795a5]">
                      {acc.type === 'credit' ? 'Кредитный' : 'Дебетовый'}
                    </div>
                  </div>
                  <div className="text-sm text-[#8795a5]">
                    {acc.currentBalance.toLocaleString('ru-RU')} ₽
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="mb-4 flex items-center justify-between rounded-xl bg-[#171f2a] p-3">
          <span className="text-sm font-semibold text-[#eef4f8]">Свои деньги</span>
          <span className="text-lg font-bold text-[#58d68d]">
            {currentTotal.toLocaleString('ru-RU')} ₽
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-[rgba(255,255,255,0.08)] px-4 py-3 text-sm font-semibold text-[#8795a5]"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-xl bg-[#75b8ff] px-4 py-3 text-sm font-bold text-[#090d12]"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
