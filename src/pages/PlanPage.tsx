import AppLayout from '../components/layout/AppLayout';
import BottomNavigation from '../components/layout/BottomNavigation';

interface Props {
  onTabChange: (tab: string) => void;
}

export default function PlanPage({ onTabChange }: Props) {
  return (
    <AppLayout>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-[-0.02em] text-[#eef4f8]">Стратегия и План</h2>
      </div>

      <div className="flex flex-col gap-[14px]">
        <section className="rounded-[18px] bg-[#121821] p-[18px]">
          <p className="text-sm text-[#8795a5]">
            Здесь будет матрица планирования будущих расходов и целей.
          </p>
        </section>
      </div>

      <div className="mt-[14px]">
        <BottomNavigation activeTab="plan" onTabChange={onTabChange} />
      </div>
    </AppLayout>
  );
}
