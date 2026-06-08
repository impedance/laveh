import type { CategoryGroupView } from '../../domain/dashboard/types';

interface Props {
  groups: CategoryGroupView[];
}

export default function SpendingGroupsCard({ groups }: Props) {
  return (
    <section className="rounded-[18px] bg-[#121821] p-[18px]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-[#eef4f8]">Группы трат</h3>
        <span className="text-xs text-[#8795a5]">бюджет</span>
      </div>
      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.id}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-[#75b8ff]">{group.name}</span>
              <span className="text-sm font-semibold text-[#eef4f8]">
                {group.totalPlan.toLocaleString('ru-RU')} ₽/мес
              </span>
            </div>
            <div className="ml-3 flex flex-col gap-1.5">
              {group.categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between">
                  <span className="text-sm text-[#eef4f8]">{cat.name}</span>
                  <span className="text-sm text-[#8795a5]">
                    {cat.plan.toLocaleString('ru-RU')} ₽/мес
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
