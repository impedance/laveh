import type { Account, Obligation, Allocation, Goal, Category, ImportBatch } from '../../store/types';
import type { DashboardInput, DashboardViewModel, Mode, FreeMoneyView, ObligationsView, SafeDailyPaceView, MoneyGuardView, PrimaryGoalView, RecurringExpensesView } from './types';
import { daysBetween, formatDate } from '../money/dateUtils';
import { formatMoney } from '../money/formatMoney';

function computeCurrentCashBalance(accounts: Account[]): number {
  return accounts
    .filter((a) => a.includeInCashBalance && a.type !== 'credit')
    .reduce((sum, a) => sum + a.currentBalance, 0);
}

function computeObligationGaps(
  obligations: Obligation[],
  allocations: Allocation[],
  nextIncomeDate: string,
): ObligationsView {
  const dueObligations = obligations.filter(
    (o) => !nextIncomeDate || o.dueDate <= nextIncomeDate,
  );

  const items: ObligationsView['items'] = [];
  let totalNeeded = 0;
  let alreadyAllocated = 0;

  for (const obl of dueObligations) {
    const allocated = allocations
      .filter((a) => a.obligationId === obl.id)
      .reduce((sum, a) => sum + a.amount, 0);
    const gap = Math.max(0, obl.amount - allocated);

    totalNeeded += obl.amount;
    alreadyAllocated += allocated;

    items.push({
      title: obl.title,
      date: formatDate(obl.dueDate),
      status: obl.isProtected ? 'платёж защищён' : `не хватает ${formatMoney(gap)}`,
      amount: obl.amount,
      type: gap > 0 && !obl.isProtected ? 'warn' : 'ok',
    });
  }

  const remainingToAllocate = totalNeeded - alreadyAllocated;
  const period = nextIncomeDate ? `до ${formatDate(nextIncomeDate)}` : '';

  return { period, items, totalNeeded, alreadyAllocated, remainingToAllocate };
}

function computeTotalRequiredAllocations(
  obligations: Obligation[],
  allocations: Allocation[],
  categories: Category[],
  goals: Goal[],
  nextIncomeDate: string,
  today: string,
): number {
  const { remainingToAllocate } = computeObligationGaps(obligations, allocations, nextIncomeDate);

  const daysToIncome = nextIncomeDate ? Math.max(1, daysBetween(today, nextIncomeDate)) : 30;
  const daysInMonth = 30;
  const monthFraction = daysToIncome / daysInMonth;

  const livingPlan = categories
    .filter((c) => c.type === 'living')
    .reduce((sum, c) => sum + c.plan, 0);

  const proportionalLiving = Math.round(livingPlan * monthFraction);

  const primaryGoal = goals.find((g) => g.isPrimary);
  const goalContribution = primaryGoal && primaryGoal.type === 'debt_payoff'
    ? Math.round(primaryGoal.targetAmount * 0.02)
    : 0;

  return remainingToAllocate + proportionalLiving + goalContribution;
}

function computeFreeUntilNextIncome(
  input: DashboardInput,
): { amount: number; totalRequired: number } {
  const cashBalance = computeCurrentCashBalance(input.accounts);
  const totalRequired = computeTotalRequiredAllocations(
    input.obligations,
    input.allocations,
    input.categories,
    input.goals,
    input.nextIncomeDate,
    input.today,
  );
  return { amount: cashBalance - totalRequired, totalRequired };
}

function computeMode(freeUntilNextIncome: number, expectedMonthlyIncome: number): { mode: Mode; label: string } {
  if (freeUntilNextIncome < 0) return { mode: 'stop', label: 'стоп' };

  const incomeRatio = expectedMonthlyIncome > 0 ? freeUntilNextIncome / expectedMonthlyIncome : 0;

  if (incomeRatio > 0.2) return { mode: 'calm', label: 'спокойно' };
  return { mode: 'caution', label: 'внимание' };
}

function computeSafeDailyPace(
  freeUntilNextIncome: number,
  daysUntilNextIncome: number,
  todayFlexibleSpent: number,
): SafeDailyPaceView {
  const perDay = daysUntilNextIncome > 0 ? Math.round(freeUntilNextIncome / daysUntilNextIncome) : 0;
  const remainingToday = Math.max(0, perDay - todayFlexibleSpent);
  const percentUsed = perDay > 0 ? Math.round((todayFlexibleSpent / perDay) * 100) : 0;

  return {
    perDay,
    spentToday: todayFlexibleSpent,
    remainingToday,
    percentUsed,
  };
}

function computeMoneyGuardView(
  obligations: ObligationsView['items'],
  importBatches: ImportBatch[],
  freeAmount: number,
  mode: Mode,
): MoneyGuardView {
  const warnItem = obligations.find((o) => o.type === 'warn');

  let action: { title: string; description: string } | null = null;

  if (warnItem) {
    action = {
      title: `Защитить платёж по ${warnItem.title}`,
      description: `Распредели средства, чтобы все обязательства были закрыты.`,
    };
  } else if (importBatches.length === 0) {
    action = {
      title: 'Импортировать выписку',
      description: 'Добавь Excel-выписку из Т-Банка, чтобы актуализировать данные.',
    };
  } else if (mode === 'stop') {
    action = {
      title: 'Сократить расходы',
      description: 'Свободных средств недостаточно. Пересмотри план трат.',
    };
  }

  const uncategorizedCount = 0;

  return {
    actionCount: action ? 1 : 0,
    action: action ?? { title: 'Всё в порядке', description: 'Все обязательства защищены.' },
    uncategorized: {
      count: uncategorizedCount,
      label: 'операции без категории',
    },
  };
}

function computePrimaryGoalView(goal: Goal | undefined): PrimaryGoalView | null {
  if (!goal) return null;

  const percent = goal.targetAmount > 0
    ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
    : 0;

  const remaining = goal.targetAmount - goal.currentAmount;
  const nextMilestone = Math.min(remaining, Math.round(goal.targetAmount * 0.1));

  return {
    title: `Цель №1: ${goal.title}`,
    subtitle: 'спокойная миссия вместо давления долгом',
    percent,
    accumulated: goal.currentAmount,
    target: goal.targetAmount,
    nextMilestone,
  };
}

function computeRecurringExpenses(
  categories: Category[],
  today: string,
  nextIncomeDate: string,
): RecurringExpensesView {
  const daysToIncome = nextIncomeDate ? Math.max(1, daysBetween(today, nextIncomeDate)) : 30;
  const daysInMonth = 30;
  const monthFraction = daysToIncome / daysInMonth;

  const items = categories
    .filter((c) => c.type === 'living')
    .map((c) => {
      const expectedByNow = Math.round(c.plan * (1 - monthFraction));
      const spent = 0;
      const percent = c.plan > 0 ? Math.round((spent / c.plan) * 100) : 0;
      const abovePace = spent > expectedByNow * 1.15;

      return {
        name: c.name,
        percent,
        amount: spent !== 0 ? spent : c.plan,
        type: abovePace ? 'warn' as const : spent === 0 ? undefined : 'green' as const,
      };
    });

  return { items };
}

export function calculateDashboard(input: DashboardInput): DashboardViewModel {
  const cashBalance = computeCurrentCashBalance(input.accounts);

  const obligationsView = computeObligationGaps(
    input.obligations,
    input.allocations,
    input.nextIncomeDate,
  );

  const { amount: freeAmount, totalRequired } = computeFreeUntilNextIncome(input);

  const { mode, label: modeLabel } = computeMode(freeAmount, input.expectedMonthlyIncome);

  const daysUntilNextIncome = input.nextIncomeDate
    ? Math.max(0, daysBetween(input.today, input.nextIncomeDate))
    : 0;

  const safeDailyPace = computeSafeDailyPace(
    freeAmount,
    daysUntilNextIncome,
    input.todayFlexibleSpent,
  );

  const needToSave = obligationsView.remainingToAllocate;
  const needToSaveUntil = input.nextIncomeDate ? formatDate(input.nextIncomeDate) : '';

  const lastImportBatch = input.importBatches.length > 0
    ? input.importBatches[input.importBatches.length - 1]
    : null;
  const lastImportLabel = lastImportBatch
    ? `${daysBetween(lastImportBatch.date, input.today)} дня назад`
    : 'Импорт не проводился';

  const moneyGuard = computeMoneyGuardView(
    obligationsView.items,
    input.importBatches,
    freeAmount,
    mode,
  );

  const primaryGoal = computePrimaryGoalView(input.goals.find((g) => g.isPrimary));

  const recurringExpenses = computeRecurringExpenses(
    input.categories,
    input.today,
    input.nextIncomeDate,
  );

  const freeMoney: FreeMoneyView = {
    amount: freeAmount,
    mode: modeLabel,
    needToSave,
    needToSaveUntil,
    balanceNow: cashBalance,
    distributed: totalRequired,
    nextIncome: needToSaveUntil,
    lastImport: lastImportLabel,
  };

  return {
    freeMoney,
    obligations: obligationsView,
    safeDailyPace,
    moneyGuard,
    primaryGoal: primaryGoal ?? {
      title: 'Нет цели',
      subtitle: 'Добавьте финансовую цель',
      percent: 0,
      accumulated: 0,
      target: 0,
      nextMilestone: 0,
    },
    recurringExpenses,
  };
}
