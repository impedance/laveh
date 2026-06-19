import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DenezhkaStore, Transaction, Category, CategoryGroup, Account, CategorizationRule, ImportBatch, BankMapping } from './types';
import { seedData } from './seed';
import { normalizeDateField } from '../domain/import/excelDate';
import { applyRules } from '../domain/categorization/applyRules';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateStoreState(state: unknown, version: number): any {
  const s = state as Record<string, unknown>;
  if (version < 1 && Array.isArray(s.transactions)) {
    s.transactions = (s.transactions as Array<Record<string, unknown>>).map(
      (txn) => ({
        ...txn,
        date: normalizeDateField(String(txn.date ?? '')).slice(0, 10),
        operationDate: txn.operationDate != null
          ? normalizeDateField(String(txn.operationDate))
          : undefined,
        paymentDate: txn.paymentDate != null
          ? normalizeDateField(String(txn.paymentDate))
          : undefined,
      }),
    );
  }
  if (version < 2) {
    if (!Array.isArray(s.transactions)) {
      s.bankMappings = [];
      return s as unknown as typeof seedData;
    }
    const catCount = new Map<string, Map<string, number>>();
    for (const txn of (s.transactions as Array<Record<string, unknown>>)) {
      const bc = String(txn.bankCategory ?? '');
      const cid = String(txn.categoryId ?? '');
      if (!bc || !cid) continue;
      if (!catCount.has(bc)) catCount.set(bc, new Map());
      const inner = catCount.get(bc)!;
      inner.set(cid, (inner.get(cid) ?? 0) + 1);
    }
    const mappings: Array<Record<string, unknown>> = [];
    let idx = 0;
    for (const [bc, inner] of catCount) {
      let bestCid = '';
      let bestN = 0;
      for (const [cid, n] of inner) {
        if (n > bestN) { bestN = n; bestCid = cid; }
      }
      if (bestCid) {
        mappings.push({ id: `migrated-${idx++}`, bankCategory: bc, categoryId: bestCid, hitCount: bestN });
      }
    }
    s.bankMappings = mappings;
  }
  if (version < 3) {
    s.categoryGroups = [
      { id: 'group-obligatory', name: 'Обязательные', sortOrder: 0 },
      { id: 'group-regular', name: 'Регулярные', sortOrder: 1 },
      { id: 'group-fun', name: 'Отдых', sortOrder: 2 },
      { id: 'group-reserves', name: 'Резервы', sortOrder: 3 },
      { id: 'group-debts', name: 'Долги', sortOrder: 4 },
    ];
    if (Array.isArray(s.categories)) {
      const typeToGroup: Record<string, string> = {
        living: 'group-regular',
        savings: 'group-reserves',
        obligation: 'group-debts',
      };
      s.categories = (s.categories as Array<Record<string, unknown>>).map((cat, idx) => {
        const { type, ...rest } = cat;
        return {
          ...rest,
          groupId: typeToGroup[String(type ?? '')] ?? 'group-regular',
          sortOrder: idx,
        };
      });
    }
  }
  if (version < 4) {
    s.obligatoryPayments = [
      { id: 'obl-1', name: 'Ипотека', amount: 82000, dayOfMonth: 12 },
      { id: 'obl-2', name: 'Автокредит', amount: 34000, dayOfMonth: 25 },
    ];
  }
  // AICODE-NOTE: MIGRATION_V5 converts ObligatoryPayment→Category, renames includeInCashBalance→onBudget, creates MonthState
  if (version < 5) {
    const oblPayments = (s.obligatoryPayments as Array<Record<string,unknown>>) ?? [];
    const existingCats = (s.categories as Array<Record<string,unknown>>) ?? [];

    let groups = (s.categoryGroups as Array<Record<string,unknown>>) ?? [];
    let oblGroup = groups.find((g: Record<string,unknown>) => g.id === 'group-obligatory');
    if (!oblGroup) {
      oblGroup = { id: 'group-obligatory', name: 'Обязательные', sortOrder: 0 };
      groups = [oblGroup, ...groups];
    }

    let oblSortOrder = 0;
    for (const p of oblPayments) {
      const catName = String(p.name ?? '');
      const exists = existingCats.some((c: Record<string,unknown>) =>
        String(c.name ?? '').toLowerCase() === catName.toLowerCase()
      );
      if (!exists) {
        existingCats.push({
          id: `migrated-obl-${oblSortOrder}`,
          name: catName,
          plan: Number(p.amount ?? 0),
          groupId: 'group-obligatory',
          sortOrder: oblSortOrder++,
        });
      }
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    s.monthStates = [{
      month: currentMonth,
      categoryAssignments: {},
      categoryCarryover: {},
      toBeBudgeted: 0,
    }];

    delete s.obligatoryPayments;
    s.categoryGroups = groups;
    s.categories = existingCats;

    if (Array.isArray(s.accounts)) {
      s.accounts = (s.accounts as Array<Record<string,unknown>>).map((acc) => {
        const { includeInCashBalance, ...rest } = acc;
        return { ...rest, onBudget: includeInCashBalance ?? true };
      });
    }
  }
  // AICODE-NOTE: MIGRATION_V6 ensures group-cc-payments and auto-creates CC payment categories for existing credit accounts
  if (version < 6) {
    let groups = (s.categoryGroups as Array<Record<string, unknown>>) ?? [];
    const hasCCGroup = groups.some((g) => g.id === 'group-cc-payments');
    if (!hasCCGroup) {
      groups = [...groups, { id: 'group-cc-payments', name: 'Оплата карт', sortOrder: 99 }];
    }

    const accounts = (s.accounts as Array<Record<string, unknown>>) ?? [];
    const categories = (s.categories as Array<Record<string, unknown>>) ?? [];

    for (const acc of accounts) {
      if (acc.type === 'credit' && acc.onBudget) {
        const ccCatId = `cc-payment-${acc.id}`;
        const exists = categories.some((c) => String(c.id ?? '') === ccCatId);
        if (!exists) {
          categories.push({
            id: ccCatId,
            name: `Оплата: ${acc.name}`,
            plan: 0,
            groupId: 'group-cc-payments',
            sortOrder: 0,
          });
        }
      }
    }

    s.categoryGroups = groups;
    s.categories = categories;
  }
  // AICODE-NOTE: MIGRATION_V7 sets CategoryGroup types (group-reserves to sinking_fund, others to regular)
  if (version < 7) {
    const groups = (s.categoryGroups as Array<Record<string, unknown>>) ?? [];
    s.categoryGroups = groups.map((g) => ({
      ...g,
      type: g.id === 'group-reserves' ? 'sinking_fund' : 'regular',
    }));
  }
  return s as unknown as typeof seedData;
}

export const useStore = create<DenezhkaStore>()(
  persist(
    (set, get) => ({
      ...seedData,

      addTransaction: (tx: Omit<Transaction, 'id'>) => {
        const transaction: Transaction = { ...tx, id: generateId() };
        const month = transaction.date.slice(0, 7);

        set((state) => {
          // 1. Update account balance
          const updatedAccounts = state.accounts.map((acc) =>
            acc.id === transaction.accountId
              ? { ...acc, currentBalance: acc.currentBalance + transaction.amount }
              : acc
          );

          // 2. Update toBeBudgeted if positive and no category (income)
          let updatedMonthStates = state.monthStates;
          if (transaction.amount > 0 && !transaction.categoryId) {
            const hasMonthState = state.monthStates.some((ms) => ms.month === month);
            if (hasMonthState) {
              updatedMonthStates = state.monthStates.map((ms) =>
                ms.month === month
                  ? { ...ms, toBeBudgeted: ms.toBeBudgeted + transaction.amount }
                  : ms
              );
            } else {
              updatedMonthStates = [
                ...state.monthStates,
                {
                  month,
                  categoryAssignments: {},
                  categoryCarryover: {},
                  toBeBudgeted: transaction.amount,
                },
              ];
            }
          }

          return {
            transactions: [...state.transactions, transaction],
            accounts: updatedAccounts,
            monthStates: updatedMonthStates,
          };
        });
      },

      addTransactions: (txns: Omit<Transaction, 'id'>[]) => {
        const transactions = txns.map((t) => ({ ...t, id: generateId() }));
        set({ transactions: [...get().transactions, ...transactions] });
      },

      updateCategory: (id: string, updates: Partial<Category>) => {
        set({
          categories: get().categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c,
          ),
        });
      },

      setNextIncomeDate: (date: string) => set({ nextIncomeDate: date }),

      setExpectedMonthlyIncome: (amount: number) =>
        set({ expectedMonthlyIncome: amount }),

      setTodayFlexibleSpent: (amount: number) =>
        set({ todayFlexibleSpent: amount }),

      // AICODE-NOTE: IMPORT_BATCH generates batchId, assigns importBatchId to each txn, appends batch record
      // Auto‑categorises: bankMappings (hitCount ≥ 2) → rules (description)
      commitImport: (transactions: Omit<Transaction, 'id'>[], batch: Omit<ImportBatch, 'id'>) => {
        const id = generateId();
        const mappings = get().bankMappings;
        const rules = get().rules;
        const txns = transactions.map((t) => {
          const mapping = t.bankCategory
            ? mappings.find((m) => m.bankCategory === t.bankCategory && m.hitCount >= 2)
            : undefined;
          if (mapping) {
            return { ...t, id: generateId(), importBatchId: id, categoryId: mapping.categoryId, isReviewed: true as const };
          }
          const byRule = applyRules([t], rules)[0];
          if (byRule.categoryId && byRule.isReviewed) {
            return { ...byRule, id: generateId(), importBatchId: id };
          }
          return { ...t, id: generateId(), importBatchId: id };
        });
        const fullBatch: ImportBatch = { ...batch, id };

        const currentMonth = new Date().toISOString().slice(0, 7);
        const positiveTxns = transactions.filter((t) => t.amount > 0);
        const totalIncome = positiveTxns.reduce((s, t) => s + t.amount, 0);

        set((state) => {
          const updatedMonthStates = totalIncome > 0
            ? state.monthStates.map((ms) =>
                ms.month === currentMonth
                  ? { ...ms, toBeBudgeted: ms.toBeBudgeted + totalIncome }
                  : ms
              )
            : state.monthStates;

          return {
            transactions: [...state.transactions, ...txns],
            importBatches: [...state.importBatches, fullBatch],
            monthStates: updatedMonthStates,
          };
        });
      },

      undoImport: (batchId: string) => {
        set({
          transactions: get().transactions.filter((t) => t.importBatchId !== batchId),
          importBatches: get().importBatches.filter((b) => b.id !== batchId),
        });
      },

      updateTransactionCategory: (id: string, categoryId: string) => {
        set({
          transactions: get().transactions.map((t) =>
            t.id === id ? { ...t, categoryId, isReviewed: true } : t,
          ),
        });
      },
      
      markTransactionReviewed: (id: string) => {
        set({
          transactions: get().transactions.map((t) =>
            t.id === id ? { ...t, isReviewed: true } : t,
          ),
        });
      },

      learnBankMapping: (bankCategory: string, categoryId: string) => {
        const existing = get().bankMappings.find((m) => m.bankCategory === bankCategory);
        if (existing) {
          if (existing.categoryId === categoryId) {
            set({
              bankMappings: get().bankMappings.map((m) =>
                m.id === existing.id ? { ...m, hitCount: m.hitCount + 1 } : m,
              ),
            });
          } else {
            set({
              bankMappings: get().bankMappings.map((m) =>
                m.id === existing.id
                  ? { ...m, categoryId, hitCount: 1 }
                  : m,
              ),
            });
          }
        } else {
          const newMapping: BankMapping = {
            id: generateId(),
            bankCategory,
            categoryId,
            hitCount: 1,
          };
          set({ bankMappings: [...get().bankMappings, newMapping] });
        }
      },

      addRule: (rule: Omit<CategorizationRule, 'id'>) => {
        const newRule: CategorizationRule = { ...rule, id: generateId() };
        set({ rules: [...get().rules, newRule] });
      },

      toggleRuleActive: (id: string, active: boolean) => {
        set({
          rules: get().rules.map((r) =>
            r.id === id ? { ...r, active } : r,
          ),
        });
      },

      deleteCategory: (id: string) => {
        set({
          categories: get().categories.filter((c) => c.id !== id),
          transactions: get().transactions.map((t) =>
            t.categoryId === id ? { ...t, categoryId: undefined } : t,
          ),
          bankMappings: get().bankMappings.filter((m) => m.categoryId !== id),
          rules: get().rules
            .filter((r) => r.categoryId !== id)
            .map((r, i) => ({ ...r, priority: i })),
        });
      },

      upsertCategory: (category: Omit<Category, 'id' | 'sortOrder'> & { id?: string }) => {
        if (category.id) {
          const { id, ...updates } = category as { id: string } & Partial<Category>;
          set({
            categories: get().categories.map((c) =>
              c.id === id ? { ...c, ...updates } : c,
            ),
          });
        } else {
          const catsInGroup = get().categories.filter((c) => c.groupId === category.groupId);
          const maxSort = catsInGroup.reduce((max, c) => Math.max(max, c.sortOrder), -1);
          const newCat: Category = { ...category, id: generateId(), sortOrder: maxSort + 1 } as Category;
          set({ categories: [...get().categories, newCat] });
        }
      },

      addAccount: (account: Omit<Account, 'id'>) => {
        const newAccount: Account = { ...account, id: generateId() };
        if (account.type === 'credit' && account.onBudget) {
          const ccCatId = `cc-payment-${newAccount.id}`;
          const ccCat: Category = {
            id: ccCatId,
            name: `Оплата: ${account.name}`,
            plan: 0,
            groupId: 'group-cc-payments',
            sortOrder: get().categories.filter((c) => c.groupId === 'group-cc-payments').length,
          };
          set({ accounts: [...get().accounts, newAccount], categories: [...get().categories, ccCat] });
        } else {
          set({ accounts: [...get().accounts, newAccount] });
        }
      },

      updateAccount: (id: string, updates: Partial<Account>) => {
        set({
          accounts: get().accounts.map((a) =>
            a.id === id ? { ...a, ...updates } : a,
          ),
        });
      },

      deleteAccount: (id: string) => {
        const ccPaymentCatId = `cc-payment-${id}`;
        set({
          accounts: get().accounts.filter((a) => a.id !== id),
          transactions: get().transactions.filter((t) => t.accountId !== id),
          categories: get().categories.filter((c) => c.id !== ccPaymentCatId),
        });
      },

      upsertGroup: (group: Omit<CategoryGroup, 'id' | 'sortOrder'> & { id?: string }) => {
        if (group.id) {
          const { id, ...updates } = group as { id: string } & Partial<CategoryGroup>;
          set({
            categoryGroups: get().categoryGroups.map((g) =>
              g.id === id ? { ...g, ...updates } : g,
            ),
          });
        } else {
          const maxSort = get().categoryGroups.reduce((max, g) => Math.max(max, g.sortOrder), -1);
          const newGroup: CategoryGroup = {
            type: 'regular',
            ...group,
            id: generateId(),
            sortOrder: maxSort + 1,
          } as CategoryGroup;
          set({ categoryGroups: [...get().categoryGroups, newGroup] });
        }
      },

      deleteGroup: (id: string) => {
        const catIds = get().categories.filter((c) => c.groupId === id).map((c) => c.id);
        set({
          categoryGroups: get().categoryGroups.filter((g) => g.id !== id),
          categories: get().categories.filter((c) => c.groupId !== id),
          transactions: get().transactions.map((t) =>
            catIds.includes(t.categoryId ?? '') ? { ...t, categoryId: undefined } : t,
          ),
          bankMappings: get().bankMappings.filter((m) => !catIds.includes(m.categoryId)),
          rules: get().rules
            .filter((r) => !catIds.includes(r.categoryId))
            .map((r, i) => ({ ...r, priority: i })),
        });
      },

      reorderGroups: (ids: string[]) => {
        set({
          categoryGroups: get().categoryGroups.map((g) => ({
            ...g,
            sortOrder: ids.indexOf(g.id),
          })),
        });
      },

      moveCategoryToGroup: (categoryId: string, groupId: string) => {
        set({
          categories: get().categories.map((c) =>
            c.id === categoryId ? { ...c, groupId } : c,
          ),
        });
      },

      setCategoryAssigned: (month: string, categoryId: string, amount: number) => {
        set({
          monthStates: get().monthStates.map((ms) =>
            ms.month === month
              ? { ...ms, categoryAssignments: { ...ms.categoryAssignments, [categoryId]: amount } }
              : ms
          ),
        });
      },

      setToBeBudgeted: (month: string, amount: number) => {
        set({
          monthStates: get().monthStates.map((ms) =>
            ms.month === month ? { ...ms, toBeBudgeted: amount } : ms
          ),
        });
      },

      addIncomeToTBB: (amount: number, month: string) => {
        set({
          monthStates: get().monthStates.map((ms) =>
            ms.month === month ? { ...ms, toBeBudgeted: ms.toBeBudgeted + amount } : ms
          ),
        });
      },

      ensureCurrentMonthState: () => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const { monthStates } = get();
        if (!monthStates.some((ms) => ms.month === currentMonth)) {
          set({
            monthStates: [...monthStates, {
              month: currentMonth,
              categoryAssignments: {},
              categoryCarryover: {},
              toBeBudgeted: 0,
            }],
          });
        }
      },

      coverOverspending: (month: string, sourceCategoryId: string, targetCategoryId: string, amount: number) => {
        set({
          monthStates: get().monthStates.map((ms) => {
            if (ms.month !== month) return ms;
            const currentSource = ms.categoryAssignments[sourceCategoryId] ?? 0;
            const currentTarget = ms.categoryAssignments[targetCategoryId] ?? 0;
            return {
              ...ms,
              categoryAssignments: {
                ...ms.categoryAssignments,
                [sourceCategoryId]: currentSource - amount,
                [targetCategoryId]: currentTarget + amount,
              },
            };
          }),
        });
      },

      reconcileAccount: (accountId: string, actualBalance: number) => {
        const account = get().accounts.find((a) => a.id === accountId);
        if (!account) return;
        const delta = actualBalance - account.currentBalance;
        if (delta !== 0) {
          const transaction: Transaction = {
            id: generateId(),
            date: new Date().toISOString().slice(0, 10),
            description: 'Reconciliation Adjustment',
            amount: delta,
            accountId,
            isReviewed: true,
          };
          set({
            accounts: get().accounts.map((a) =>
              a.id === accountId ? { ...a, currentBalance: actualBalance } : a
            ),
            transactions: [...get().transactions, transaction],
          });
        }
      },

      setCategoryTarget: (month: string, categoryId: string, amount: number) => {
        const monthStates = get().monthStates;
        const hasMonthState = monthStates.some((ms) => ms.month === month);
        if (hasMonthState) {
          set({
            monthStates: monthStates.map((ms) =>
              ms.month === month
                ? {
                    ...ms,
                    categoryTargets: {
                      ...(ms.categoryTargets ?? {}),
                      [categoryId]: amount,
                    },
                  }
                : ms
            ),
          });
        } else {
          set({
            monthStates: [
              ...monthStates,
              {
                month,
                categoryAssignments: {},
                categoryCarryover: {},
                toBeBudgeted: 0,
                categoryTargets: {
                  [categoryId]: amount,
                },
              },
            ],
          });
        }
      },

      restoreFromJSON: (json: string) => {
        const parsed = JSON.parse(json);
        set({
          accounts: parsed.accounts ?? [],
          transactions: parsed.transactions ?? [],
          categories: parsed.categories ?? [],
          categoryGroups: parsed.categoryGroups ?? seedData.categoryGroups,
          importBatches: parsed.importBatches ?? [],
          rules: parsed.rules ?? [],
          bankMappings: parsed.bankMappings ?? [],
          nextIncomeDate: parsed.nextIncomeDate ?? get().nextIncomeDate,
          expectedMonthlyIncome: parsed.expectedMonthlyIncome ?? get().expectedMonthlyIncome,
          todayFlexibleSpent: parsed.todayFlexibleSpent ?? 0,
          monthStates: parsed.monthStates ?? [],
        });
      },
    }),
    {
      name: 'laveh-store',
      version: 7,
      migrate: migrateStoreState,
      partialize: (state) => ({
        accounts: state.accounts,
        transactions: state.transactions,
        categories: state.categories,
        categoryGroups: state.categoryGroups,
        importBatches: state.importBatches,
        rules: state.rules,
        bankMappings: state.bankMappings,
        nextIncomeDate: state.nextIncomeDate,
        expectedMonthlyIncome: state.expectedMonthlyIncome,
        todayFlexibleSpent: state.todayFlexibleSpent,
        monthStates: state.monthStates,
      }),
    },
  ),
);
