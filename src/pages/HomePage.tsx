import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { calculateBudget } from '../domain/budget/calculateBudget';
import type { BudgetInput } from '../domain/budget/types';
import AppLayout from '../components/layout/AppLayout';
import BottomNavigation from '../components/layout/BottomNavigation';
import ReadyToAssignHeroCard from '../components/cards/ReadyToAssignHeroCard';
import BudgetGroupsCard from '../components/cards/BudgetGroupsCard';
import CreditCardPaymentsCard from '../components/cards/CreditCardPaymentsCard';
import ReviewQueue from '../components/operations/ReviewQueue';
import EditBalanceModal from '../components/operations/EditBalanceModal';

interface Props {
  onTabChange: (tab: string) => void;
}

export default function HomePage({ onTabChange }: Props) {
  const store = useStore();
  const [showEditBalance, setShowEditBalance] = useState(false);

  const vm = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7);
    const monthState = store.monthStates.find((ms) => ms.month === month) ?? {
      month,
      categoryAssignments: {},
      categoryCarryover: {},
      toBeBudgeted: 0,
    };

    const input: BudgetInput = {
      accounts: store.accounts,
      transactions: store.transactions,
      categories: store.categories,
      categoryGroups: store.categoryGroups,
      monthState,
      month,
    };

    return calculateBudget(input);
  }, [store.accounts, store.transactions, store.categories, store.categoryGroups, store.monthStates]);

  return (
    <AppLayout>
      <div className="mb-[14px] flex items-center justify-between">
        <div>
          <strong className="block text-lg tracking-[-0.02em] text-[#eef4f8]">Laveh</strong>
          <span className="mt-0.5 block text-xs text-[#8795a5]">Финансовая навигация · июнь</span>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#75b8ff] text-sm font-bold text-[#090d12]">
          M
        </div>
      </div>

      <div className="flex flex-col gap-[14px]">
        <ReviewQueue />
        <ReadyToAssignHeroCard
          toBeBudgeted={vm.toBeBudgeted}
          ownMoney={vm.ownMoney}
          totalDebt={vm.totalDebt}
          onAssign={() => onTabChange('plan')}
          onEditBalance={() => setShowEditBalance(true)}
        />
        <BudgetGroupsCard groups={vm.categoryGroups} />
        <CreditCardPaymentsCard payments={vm.creditCardPayments} />
      </div>

      <div className="mt-[14px]">
        <BottomNavigation activeTab="home" onTabChange={onTabChange} />
      </div>

      {showEditBalance && (
        <EditBalanceModal
          onClose={() => setShowEditBalance(false)}
        />
      )}
    </AppLayout>
  );
}
