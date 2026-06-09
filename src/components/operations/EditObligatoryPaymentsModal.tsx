import { useState } from 'react';
import { useStore } from '../../store';

interface Props {
  onClose: () => void;
}

export default function EditObligatoryPaymentsModal({ onClose }: Props) {
  const payments = useStore((s) => s.obligatoryPayments);
  const addObligatoryPayment = useStore((s) => s.addObligatoryPayment);
  const updateObligatoryPayment = useStore((s) => s.updateObligatoryPayment);
  const deleteObligatoryPayment = useStore((s) => s.deleteObligatoryPayment);

  const [edits, setEdits] = useState<Record<string, { name: string; amount: number; dayOfMonth: number }>>({});
  const [newPayment, setNewPayment] = useState({ name: '', amount: 0, dayOfMonth: 1 });

  const getEdit = (id: string) => {
    const p = payments.find((x) => x.id === id);
    if (!p) return { name: '', amount: 0, dayOfMonth: 1 };
    return edits[id] ?? { name: p.name, amount: p.amount, dayOfMonth: p.dayOfMonth };
  };

  const handleSave = () => {
    for (const [id, edit] of Object.entries(edits)) {
      updateObligatoryPayment(id, edit);
    }
    onClose();
  };

  const handleAdd = () => {
    if (!newPayment.name || newPayment.amount <= 0) return;
    addObligatoryPayment(newPayment);
    setNewPayment({ name: '', amount: 0, dayOfMonth: 1 });
  };

  const handleDelete = (id: string) => {
    deleteObligatoryPayment(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-8">
      <div className="w-full max-w-[430px] rounded-[18px] bg-[#121821] p-[18px]">
        <h3 className="mb-2 text-base font-bold text-[#eef4f8]">Обязательные платежи</h3>
        <p className="mb-4 text-xs text-[#8795a5]">
          Ипотека, кредиты и другие регулярные обязательные платежи с фиксированной датой.
        </p>

        <div className="mb-4 space-y-3">
          {payments.map((p) => {
            const edit = getEdit(p.id);
            return (
              <div key={p.id} className="rounded-xl bg-[#171f2a] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-medium text-[#eef4f8]">{p.name}</div>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="text-xs text-[#e74c3c]"
                  >
                    Удалить
                  </button>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-[#8795a5] mb-0.5">Название</label>
                    <input
                      type="text"
                      value={edit.name}
                      onChange={(e) =>
                        setEdits((prev) => ({
                          ...prev,
                          [p.id]: { ...getEdit(p.id), name: e.target.value },
                        }))
                      }
                      className="w-full rounded-xl bg-[#121821] px-3 py-2 text-sm text-[#eef4f8] outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-[#8795a5] mb-0.5">Сумма</label>
                    <input
                      type="number"
                      value={edit.amount}
                      onChange={(e) =>
                        setEdits((prev) => ({
                          ...prev,
                          [p.id]: { ...getEdit(p.id), amount: Number(e.target.value) },
                        }))
                      }
                      className="w-full rounded-xl bg-[#121821] px-3 py-2 text-sm text-[#eef4f8] outline-none"
                    />
                  </div>
                  <div className="w-20">
                    <label className="block text-xs text-[#8795a5] mb-0.5">Число</label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={edit.dayOfMonth}
                      onChange={(e) => {
                        const v = Math.min(31, Math.max(1, Number(e.target.value) || 1));
                        setEdits((prev) => ({
                          ...prev,
                          [p.id]: { ...getEdit(p.id), dayOfMonth: v },
                        }));
                      }}
                      className="w-full rounded-xl bg-[#121821] px-3 py-2 text-sm text-[#eef4f8] outline-none"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <div className="rounded-xl border border-dashed border-[rgba(255,255,255,0.08)] p-3">
            <div className="mb-2 text-xs font-semibold text-[#75b8ff]">Новый платёж</div>
            <div className="flex gap-2 mb-2">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Название"
                  value={newPayment.name}
                  onChange={(e) => setNewPayment((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8] outline-none"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Сумма"
                  value={newPayment.amount || ''}
                  onChange={(e) => setNewPayment((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                  className="w-full rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8] outline-none"
                />
              </div>
              <div className="w-20">
                <input
                  type="number"
                  min={1}
                  max={31}
                  placeholder="1"
                  value={newPayment.dayOfMonth}
                  onChange={(e) => {
                    const v = Math.min(31, Math.max(1, Number(e.target.value) || 1));
                    setNewPayment((prev) => ({ ...prev, dayOfMonth: v }));
                  }}
                  className="w-full rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8] outline-none"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              className="w-full rounded-xl bg-[#75b8ff] px-4 py-2 text-sm font-bold text-[#090d12]"
            >
              Добавить
            </button>
          </div>
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
