import { useStore } from '../store';
import { calculateDashboard } from '../domain/dashboard/calculateDashboard';
import type { DashboardInput } from '../domain/dashboard/types';
import AppLayout from '../components/layout/AppLayout';
import BottomNavigation from '../components/layout/BottomNavigation';
import FreeMoneyHeroCard from '../components/cards/FreeMoneyHeroCard';
import UpcomingObligationsCard from '../components/cards/UpcomingObligationsCard';
import SafeDailyPaceCard from '../components/cards/SafeDailyPaceCard';
import MoneyGuardCard from '../components/cards/MoneyGuardCard';
import PrimaryGoalCard from '../components/cards/PrimaryGoalCard';
import RecurringExpensesCard from '../components/cards/RecurringExpensesCard';
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
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs text-[rgba(238,244,248,0.72)]">21:30</div>
        <div className="text-xs text-[rgba(238,244,248,0.72)]">●●● 82%</div>
      </div>
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
        <MoneyGuardCard data={vm.moneyGuard} />
        <PrimaryGoalCard data={vm.primaryGoal} />
        <RecurringExpensesCard data={vm.recurringExpenses} />
      </div>

      <div className="mt-[14px]">
        <BottomNavigation activeTab="home" onTabChange={onTabChange} />
      </div>
    </AppLayout>
  );
}
