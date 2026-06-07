export interface MockDashboardData {
  freeMoney: {
    amount: number;
    mode: string;
    needToSave: number;
    needToSaveUntil: string;
    balanceNow: number;
    distributed: number;
    nextIncome: string;
    lastImport: string;
  };
  obligations: {
    period: string;
    remainingToAllocate: number;
    totalNeeded: number;
    alreadyAllocated: number;
    items: Array<{
      title: string;
      date: string;
      status: string;
      amount: number;
      type: 'ok' | 'warn';
    }>;
  };
  safeDailyPace: {
    perDay: number;
    spentToday: number;
    remainingToday: number;
    percentUsed: number;
  };
  moneyGuard: {
    actionCount: number;
    action: { title: string; description: string };
    uncategorized: { count: number; label: string };
  };
  primaryGoal: {
    title: string;
    subtitle: string;
    percent: number;
    accumulated: number;
    target: number;
    nextMilestone: number;
  };
  recurringExpenses: {
    items: Array<{
      name: string;
      percent: number;
      amount: number;
      type?: 'warn' | 'green';
    }>;
  };
}

export const mockData: MockDashboardData = {
  freeMoney: {
    amount: 47300,
    mode: 'спокойно',
    needToSave: 12000,
    needToSaveUntil: '25 июня',
    balanceNow: 212000,
    distributed: 164700,
    nextIncome: '25 июня',
    lastImport: '2 дня назад',
  },
  obligations: {
    period: 'до 25 июня',
    remainingToAllocate: 12000,
    totalNeeded: 158000,
    alreadyAllocated: 146000,
    items: [
      { title: 'Ипотека', date: '10 июня', status: 'платёж защищён', amount: 84000, type: 'ok' },
      { title: 'Автокредит', date: '15 июня', status: 'платёж защищён', amount: 34000, type: 'ok' },
      { title: 'Кредитка · платёж месяца', date: '20 июня', status: 'не хватает 12 000 ₽', amount: 30000, type: 'warn' },
    ],
  },
  safeDailyPace: {
    perDay: 2490,
    spentToday: 1240,
    remainingToday: 1250,
    percentUsed: 50,
  },
  moneyGuard: {
    actionCount: 1,
    action: {
      title: 'Защитить платёж по кредитке',
      description: 'Распредели 12 000 ₽, чтобы все обязательства были закрыты.',
    },
    uncategorized: {
      count: 4,
      label: 'операции без категории',
    },
  },
  primaryGoal: {
    title: 'Цель №1: закрыть кредитку',
    subtitle: 'спокойная миссия вместо давления долгом',
    percent: 57,
    accumulated: 400000,
    target: 700000,
    nextMilestone: 50000,
  },
  recurringExpenses: {
    items: [
      { name: 'Продукты', percent: 31, amount: 41600, type: 'warn' },
      { name: 'Подписки', percent: 64, amount: 1800 },
      { name: 'Транспорт', percent: 35, amount: 13000, type: 'green' },
    ],
  },
};
