import { useStore } from '../../store';

export interface CategoryOption {
  id: string;
  name: string;
  available: number;
}

export interface CoverOverspendingModalProps {
  targetCategoryId: string;
  shortfall: number; 
  options: CategoryOption[];
  onConfirm: (sourceCategoryId: string) => void;
  onClose: () => void;
}

export default function CoverOverspendingModal({
  targetCategoryId,
  shortfall,
  options,
  onConfirm,
  onClose,
}: CoverOverspendingModalProps) {
  const categories = useStore((s) => s.categories);
  const targetCategory = categories.find((c) => c.id === targetCategoryId);
  const targetName = targetCategory ? targetCategory.name : targetCategoryId;

  // Filter options to those that have available > 0 to actually cover the overspending
  const coverOptions = options.filter((opt) => opt.available > 0 && opt.id !== targetCategoryId);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-8">
      <div className="w-full max-w-[430px] rounded-[18px] bg-[#121821] p-[18px]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-[#eef4f8]">Покрыть перерасход</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[#8795a5] hover:text-[#eef4f8]"
          >
            Закрыть
          </button>
        </div>

        <p className="mb-4 text-sm text-[#8795a5]">
          Для покрытия перерасхода по категории <strong className="text-[#eef4f8]">«{targetName}»</strong> на{' '}
          <strong className="text-[#e74c3c]">{shortfall.toLocaleString('ru-RU')} ₽</strong> выберите источник средств:
        </p>

        <div className="max-h-[260px] overflow-y-auto space-y-1 mb-4">
          {coverOptions.length === 0 ? (
            <p className="py-4 text-center text-xs text-[#8795a5]">
              Нет доступных категорий со свободными средствами.
            </p>
          ) : (
            coverOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onConfirm(opt.id)}
                className="w-full flex items-center justify-between rounded-xl bg-[#171f2a] px-4 py-3 text-left text-sm font-medium text-[#eef4f8] hover:bg-[#1e2a3a] transition-colors"
              >
                <span>{opt.name}</span>
                <span className="text-xs font-semibold text-[#58d68d] tabular-nums">
                  {opt.available.toLocaleString('ru-RU')} ₽
                </span>
              </button>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] py-3 text-sm font-semibold text-[#8795a5] hover:text-[#eef4f8]"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
