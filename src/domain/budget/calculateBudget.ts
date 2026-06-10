import type { Account, Transaction, Category, CategoryGroup, MonthState } from '../../store/types';
import type { BudgetInput, BudgetViewModel, BudgetGroupView, BudgetCategoryView, CreditCardPaymentView } from './types';

function computeOwnMoney(accounts: Account[]): number {
  return accounts
    .filter((a) => a.onBudget)
    .reduce((sum, a) => {
      if (a.type === 'credit') return sum + Math.max(0, a.currentBalance);
      return sum + a.currentBalance;
    }, 0);
}

function computeTotalDebt(accounts: Account[]): number {
  return accounts
    .filter((a) => a.onBudget && a.type === 'credit')
    .reduce((sum, a) => sum + Math.max(0, -a.currentBalance), 0);
}

function computeCategoryActivity(
  categoryId: string,
  transactions: Transaction[],
  month: string,
): number {
  return transactions
    .filter((t) => t.categoryId === categoryId && t.date.startsWith(month))
    .reduce((sum, t) => sum + t.amount, 0);
}

function computeCreditCardPaymentActivity(
  accountId: string,
  transactions: Transaction[],
  creditCardPaymentCategoryId: string,
  month: string,
): number {
  let activity = 0;
  for (const t of transactions) {
    if (!t.date.startsWith(month)) continue;

    if (t.accountId === accountId && t.categoryId !== creditCardPaymentCategoryId && t.amount < 0) {
      activity += Math.abs(t.amount);
    }

    if (t.accountId === accountId && t.transferAccountId && t.amount > 0) {
      activity -= t.amount;
    }
  }
  return activity;
}

function buildCategoryView(
  cat: Category,
  monthState: MonthState,
  previousMonthState: MonthState | undefined,
  transactions: Transaction[],
  month: string,
): BudgetCategoryView {
  const assigned = monthState.categoryAssignments[cat.id] ?? 0;
  const carryover = previousMonthState?.categoryCarryover?.[cat.id] ?? monthState.categoryCarryover?.[cat.id] ?? 0;
  const isCCPayment = cat.id.startsWith('cc-payment-');
  const activity = isCCPayment
    ? 0
    : computeCategoryActivity(cat.id, transactions, month);
  const available = carryover + assigned + activity;

  return { id: cat.id, name: cat.name, plan: cat.plan, assigned, activity, available };
}

function buildGroupViews(
  categories: Category[],
  categoryGroups: CategoryGroup[],
  monthState: MonthState,
  previousMonthState: MonthState | undefined,
  transactions: Transaction[],
  month: string,
): BudgetGroupView[] {
  const sortedGroups = [...categoryGroups].sort((a, b) => a.sortOrder - b.sortOrder);

  return sortedGroups
    .map((group) => {
      const groupCats = categories
        .filter((c) => c.groupId === group.id)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      const catViews: BudgetCategoryView[] = groupCats.map((cat) =>
        buildCategoryView(cat, monthState, previousMonthState, transactions, month)
      );

      const totalPlan = catViews.reduce((s, c) => s + c.plan, 0);
      const totalAssigned = catViews.reduce((s, c) => s + c.assigned, 0);
      const totalActivity = catViews.reduce((s, c) => s + c.activity, 0);
      const totalAvailable = catViews.reduce((s, c) => s + c.available, 0);
      const planGap = Math.max(0, totalPlan - totalAssigned);

      return {
        id: group.id,
        name: group.name,
        sortOrder: group.sortOrder,
        categories: catViews,
        totalPlan,
        totalAssigned,
        totalActivity,
        totalAvailable,
        planGap,
      };
    })
    .filter((g) => g.categories.length > 0);
}

function buildCreditCardPaymentViews(
  accounts: Account[],
  categories: Category[],
  transactions: Transaction[],
  monthState: MonthState,
  month: string,
): CreditCardPaymentView[] {
  const creditAccounts = accounts.filter((a) => a.type === 'credit' && a.onBudget);

  return creditAccounts.map((acc) => {
    const ccCatId = `cc-payment-${acc.id}`;
    const ccCat = categories.find((c) => c.id === ccCatId);

    if (!ccCat) {
      const debtRemaining = Math.max(0, -acc.currentBalance);
      return {
        accountId: acc.id,
        accountName: acc.name,
        balance: acc.currentBalance,
        creditLimit: acc.creditLimit,
        available: 0,
        activity: 0,
        assigned: 0,
        debtRemaining,
        paymentGap: debtRemaining,
      };
    }

    const ccActivity = computeCreditCardPaymentActivity(acc.id, transactions, ccCatId, month);
    const assigned = monthState.categoryAssignments[ccCatId] ?? 0;
    const carryover = monthState.categoryCarryover[ccCatId] ?? 0;
    const available = carryover + assigned + ccActivity;
    const debtRemaining = Math.max(0, -acc.currentBalance);
    const paymentGap = Math.max(0, debtRemaining - available);

    return {
      accountId: acc.id,
      accountName: acc.name,
      balance: acc.currentBalance,
      creditLimit: acc.creditLimit,
      available,
      activity: ccActivity,
      assigned,
      debtRemaining,
      paymentGap,
    };
  });
}

export function calculateBudget(input: BudgetInput): BudgetViewModel {
  const { accounts, transactions, categories, categoryGroups, monthState, previousMonthState, month } = input;

  const ownMoney = computeOwnMoney(accounts);
  const totalDebt = computeTotalDebt(accounts);

  const groupViews = buildGroupViews(categories, categoryGroups, monthState, previousMonthState, transactions, month);
  const ccPaymentViews = buildCreditCardPaymentViews(accounts, categories, transactions, monthState, month);

  let totalAssigned = 0;
  let totalActivity = 0;

  for (const g of groupViews) {
    totalAssigned += g.totalAssigned;
    totalActivity += g.totalActivity;
  }

  for (const cc of ccPaymentViews) {
    totalAssigned += cc.assigned;
    totalActivity += cc.activity;
  }

  const totalIncome = transactions
    .filter((t) => t.date.startsWith(month) && t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);

  const toBeBudgeted = monthState.toBeBudgeted;

  return {
    month,
    toBeBudgeted,
    totalIncome,
    totalAssigned,
    totalActivity,
    ownMoney,
    totalDebt,
    categoryGroups: groupViews,
    creditCardPayments: ccPaymentViews,
  };
}
