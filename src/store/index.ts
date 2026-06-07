import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MorganStore, Transaction, Category, Obligation, CategorizationRule, ImportBatch } from './types';
import { seedData } from './seed';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useStore = create<MorganStore>()(
  persist(
    (set, get) => ({
      ...seedData,

      addTransaction: (tx: Omit<Transaction, 'id'>) => {
        const transaction: Transaction = { ...tx, id: generateId() };
        set({ transactions: [...get().transactions, transaction] });
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
      commitImport: (transactions: Omit<Transaction, 'id'>[], batch: ImportBatch) => {
        const id = generateId();
        const txns = transactions.map((t) => ({ ...t, id: generateId(), importBatchId: id }));
        const fullBatch: ImportBatch = { ...batch, id };
        set({
          transactions: [...get().transactions, ...txns],
          importBatches: [...get().importBatches, fullBatch],
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

      upsertObligation: (obligation: Omit<Obligation, 'id'> & { id?: string }) => {
        if (obligation.id) {
          set({
            obligations: get().obligations.map((o) =>
              o.id === obligation.id ? { ...o, ...obligation } : o,
            ),
          });
        } else {
          const newObl: Obligation = { ...obligation, id: generateId() } as Obligation;
          set({ obligations: [...get().obligations, newObl] });
        }
      },

      deleteObligation: (id: string) => {
        set({
          obligations: get().obligations.filter((o) => o.id !== id),
          allocations: get().allocations.filter((a) => a.obligationId !== id),
        });
      },

      upsertCategory: (category: Omit<Category, 'id'> & { id?: string }) => {
        if (category.id) {
          set({
            categories: get().categories.map((c) =>
              c.id === category.id ? { ...c, ...category } : c,
            ),
          });
        } else {
          const newCat: Category = { ...category, id: generateId() } as Category;
          set({ categories: [...get().categories, newCat] });
        }
      },

      setGoalProgress: (id: string, currentAmount: number) => {
        set({
          goals: get().goals.map((g) =>
            g.id === id ? { ...g, currentAmount } : g,
          ),
        });
      },

      restoreFromJSON: (json: string) => {
        const parsed = JSON.parse(json);
        set({
          accounts: parsed.accounts ?? [],
          transactions: parsed.transactions ?? [],
          categories: parsed.categories ?? [],
          obligations: parsed.obligations ?? [],
          allocations: parsed.allocations ?? [],
          goals: parsed.goals ?? [],
          importBatches: parsed.importBatches ?? [],
          rules: parsed.rules ?? [],
          nextIncomeDate: parsed.nextIncomeDate ?? get().nextIncomeDate,
          expectedMonthlyIncome: parsed.expectedMonthlyIncome ?? get().expectedMonthlyIncome,
          todayFlexibleSpent: parsed.todayFlexibleSpent ?? 0,
        });
      },
    }),
    {
      name: 'morgan-finance-store',
      partialize: (state) => ({
        accounts: state.accounts,
        transactions: state.transactions,
        categories: state.categories,
        obligations: state.obligations,
        allocations: state.allocations,
        goals: state.goals,
        importBatches: state.importBatches,
        rules: state.rules,
        nextIncomeDate: state.nextIncomeDate,
        expectedMonthlyIncome: state.expectedMonthlyIncome,
        todayFlexibleSpent: state.todayFlexibleSpent,
      }),
    },
  ),
);
