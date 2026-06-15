import { useState } from 'react';
import { useStore } from '../../store';

interface Props {
  onClose: () => void;
}

export default function AddCategoryModal({ onClose }: Props) {
  const store = useStore();
  const groups = store.categoryGroups.filter((g) => g.id !== 'group-cc-payments');

  const [name, setName] = useState('');
  const [plan, setPlan] = useState<number | ''>('');
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '');

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      window.alert('Пожалуйста, введите название категории');
      return;
    }
    if (plan === '' || plan < 0) {
      window.alert('Пожалуйста, введите корректную сумму лимита/плана');
      return;
    }
    if (!groupId) {
      window.alert('Пожалуйста, выберите группу');
      return;
    }

    if (store.categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      window.alert('Категория с таким названием уже существует');
      return;
    }

    store.upsertCategory({
      name: trimmed,
      plan: Number(plan),
      groupId,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-8">
      <div className="w-full max-w-[430px] rounded-[18px] bg-[#121821] p-[18px]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-[#eef4f8]">Добавить категорию</h3>
          <button onClick={onClose} className="text-xs text-[#8795a5]">
            ✕ Закрыть
          </button>
        </div>

        <div className="mb-4 space-y-3">
          {/* Name */}
          <div>
            <label className="mb-1 block text-xs text-[#8795a5]">Название категории</label>
            <input
              type="text"
              placeholder="например, Продукты"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8] outline-none"
              autoFocus
            />
          </div>

          {/* Plan (Target) */}
          <div>
            <label className="mb-1 block text-xs text-[#8795a5]">План на месяц (₽)</label>
            <input
              type="number"
              placeholder="0"
              value={plan}
              onChange={(e) => setPlan(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8] outline-none"
            />
          </div>

          {/* Group */}
          <div>
            <label className="mb-1 block text-xs text-[#8795a5]">Группа категорий</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8] outline-none"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
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
            Создать
          </button>
        </div>
      </div>
    </div>
  );
}
