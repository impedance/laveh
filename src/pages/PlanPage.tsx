import { useMemo } from 'react';
import { useStore } from '../store';
import AppLayout from '../components/layout/AppLayout';
import BottomNavigation from '../components/layout/BottomNavigation';
import PlannerMatrix from '../components/plan/PlannerMatrix';

interface Props {
  onTabChange: (tab: string) => void;
}

export default function PlanPage({ onTabChange }: Props) {
  const store = useStore();

  // Generate 6 months starting from the current month
  const months = useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      list.push(d.toISOString().slice(0, 7));
    }
    return list;
  }, []);

  const categories = useMemo(() => {
    return store.categories
      .filter((c) => c.groupId !== 'group-cc-payments')
      .map((c) => ({
        id: c.id,
        name: c.name,
        groupId: c.groupId,
      }));
  }, [store.categories]);

  const targets = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const ms of store.monthStates) {
      if (ms.categoryTargets) {
        map[ms.month] = ms.categoryTargets;
      }
    }
    return map;
  }, [store.monthStates]);

  const handleUpdateTarget = (month: string, categoryId: string, amount: number) => {
    store.setCategoryTarget(month, categoryId, amount);
  };

  return (
    <AppLayout>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-[-0.02em] text-[#eef4f8]">Стратегия и План</h2>
      </div>

      <div className="flex flex-col gap-[14px]">
        {/* Info card */}
        <section className="rounded-[18px] bg-[#121821] p-[18px] text-xs text-[#8795a5]">
          <p>
            Матрица целей планирования: введите суммы (цели), которые вы планируете отложить в категории в ближайшие 6 месяцев. 
            Эти цели не влияют на текущий бюджет напрямую, но помогают планировать долгосрочные накопления.
          </p>
        </section>

        {/* Matrix Table */}
        <PlannerMatrix
          categories={categories}
          months={months}
          targets={targets}
          onUpdateTarget={handleUpdateTarget}
        />
      </div>

      <div className="mt-[14px]">
        <BottomNavigation activeTab="plan" onTabChange={onTabChange} />
      </div>
    </AppLayout>
  );
}
