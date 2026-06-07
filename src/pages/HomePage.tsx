import { useStore } from '../store';
import { calculateDashboard } from '../domain/dashboard/calculateDashboard';
import type { DashboardInput } from '../domain/dashboard/types';
import AppLayout from '../components/layout/AppLayout';
import BottomNavigation from '../components/layout/BottomNavigation';
import FreeMoneyHeroCard from '../components/cards/FreeMoneyHeroCard';
import UpcomingObligationsCard from '../components/cards/UpcomingObligationsCard';
import SafeDailyPaceCard from '../components/cards/SafeDailyPaceCard';
import PrimaryGoalCard from '../components/cards/PrimaryGoalCard';
import SpendingGroupsCard from '../components/cards/SpendingGroupsCard';
import ReviewQueue from '../components/operations/ReviewQueue';

interface Props {
  onTabChange: (tab: string) => void;
}

export default function HomePage({ onTabChange }: Props) {
  const store = useStore();

  const input: DashboardInput = {
    accounts: store.accounts,
    transactions: store.transactions,
    categories: store.categories,
    obligations: store.obligations,
    allocations: store.allocations,
    goals: store.goals,
    importBatches: store.importBatches,
    rules: store.rules,
    nextIncomeDate: store.nextIncomeDate,
    expectedMonthlyIncome: store.expectedMonthlyIncome,
    todayFlexibleSpent: store.todayFlexibleSpent,
    today: new Date().toISOString().slice(0, 10),
  };

  const vm = calculateDashboard(input);

  return (
    <AppLayout>
      <div className="mb-[14px] flex items-center justify-between">
        <div>
          <strong className="block text-lg tracking-[-0.02em] text-[#eef4f8]">Денежка</strong>
          <span className="mt-0.5 block text-xs text-[#8795a5]">Финансовая навигация · июнь</span>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#75b8ff] text-sm font-bold text-[#090d12]">
          M
        </div>
      </div>

      <div className="flex flex-col gap-[14px]">
        <ReviewQueue />
        <FreeMoneyHeroCard data={vm.freeMoney} />
        <UpcomingObligationsCard data={vm.obligations} />
        <SafeDailyPaceCard data={vm.safeDailyPace} />
        <SpendingGroupsCard categories={store.categories} />
        <PrimaryGoalCard data={vm.primaryGoal} />
      </div>

      <div className="mt-[14px]">
        <BottomNavigation activeTab="home" onTabChange={onTabChange} />
      </div>
    </AppLayout>
  );
}
