import type { Account, Category, CategoryGroup } from '../../store/types';
import type { DashboardInput, DashboardViewModel, FreeMoneyView, CategoryGroupView, CategoryView } from './types';
import { daysBetween } from '../money/dateUtils';

function computeOwnMoney(accounts: Account[]): number {
  return accounts
    .filter((a) => a.onBudget)
    .reduce((sum, a) => {
      if (a.type === 'credit') {
        return sum + Math.max(0, a.currentBalance);
      }
      return sum + a.currentBalance;
    }, 0);
}

function computeTotalDebt(accounts: Account[]): number {
  return accounts
    .filter((a) => a.onBudget && a.type === 'credit')
    .reduce((sum, a) => sum + Math.max(0, -a.currentBalance), 0);
}

function computeTotalRequiredAllocations(
  categories: Category[],
  nextIncomeDate: string,
  today: string,
): number {
  const daysToIncome = nextIncomeDate ? Math.max(1, daysBetween(today, nextIncomeDate)) : 30;

  const totalPlan = categories.reduce((sum, c) => sum + c.plan, 0);
  const monthFraction = daysToIncome / 30;

  return Math.round(totalPlan * monthFraction);
}

function computeFreeUntilNextIncome(input: DashboardInput, ownMoney: number): number {
  const totalRequired = computeTotalRequiredAllocations(
    input.categories,
    input.nextIncomeDate,
    input.today,
  );
  return ownMoney - totalRequired;
}

function computeSpendingGroupsView(
  categories: Category[],
  categoryGroups: CategoryGroup[],
): CategoryGroupView[] {
  const sortedGroups = [...categoryGroups].sort((a, b) => a.sortOrder - b.sortOrder);
  return sortedGroups.map((group) => {
    const groupCats = categories
      .filter((c) => c.groupId === group.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c): CategoryView => ({ id: c.id, name: c.name, plan: c.plan }));
    const totalPlan = groupCats.reduce((sum, c) => sum + c.plan, 0);
    return { id: group.id, name: group.name, categories: groupCats, totalPlan };
  }).filter((g) => g.categories.length > 0);
}

export function calculateDashboard(input: DashboardInput): DashboardViewModel {
  const ownMoney = computeOwnMoney(input.accounts);
  const totalDebt = computeTotalDebt(input.accounts);

  const freeAmount = computeFreeUntilNextIncome(input, ownMoney);

  const freeMoney: FreeMoneyView = {
    amount: freeAmount,
    ownMoney,
    totalDebt,
    netWorth: ownMoney - totalDebt,
    balanceNow: ownMoney,
  };

  const spendingGroups = computeSpendingGroupsView(input.categories, input.categoryGroups);

  return { freeMoney, spendingGroups };
}
