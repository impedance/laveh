import type { Category } from '../../store/types';

interface Props {
  categories: Category[];
}

export default function SpendingGroupsCard({ categories }: Props) {
  return (
    <section className="rounded-[18px] bg-[#121821] p-[18px]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-[#eef4f8]">Группы трат</h3>
        <span className="text-xs text-[#8795a5]">бюджет</span>
      </div>
      <div className="flex flex-col gap-4">
        {categories.map((cat) => (
          <div key={cat.id}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-[#eef4f8]">{cat.name}</span>
              <span className="text-sm text-[#8795a5]">
                {cat.plan.toLocaleString('ru-RU')} ₽/мес
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
