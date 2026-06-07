import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DenezhkaStore, Transaction, Category, Obligation, Goal, Account, Allocation, CategorizationRule, ImportBatch, BankMapping } from './types';
import { seedData } from './seed';
import { normalizeDateField } from '../domain/import/excelDate';
import { applyRules } from '../domain/categorization/applyRules';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useStore = create<DenezhkaStore>()(
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

      addGoal: (goal: Omit<Goal, 'id'>) => {
        const newGoal: Goal = { ...goal, id: generateId() };
        set({ goals: [...get().goals, newGoal] });
      },

      updateGoal: (id: string, updates: Partial<Goal>) => {
        set({
          goals: get().goals.map((g) =>
            g.id === id ? { ...g, ...updates } : g,
          ),
        });
      },

      deleteGoal: (id: string) => {
        set({ goals: get().goals.filter((g) => g.id !== id) });
      },

      addAccount: (account: Omit<Account, 'id'>) => {
        const newAccount: Account = { ...account, id: generateId() };
        set({ accounts: [...get().accounts, newAccount] });
      },

      updateAccount: (id: string, updates: Partial<Account>) => {
        set({
          accounts: get().accounts.map((a) =>
            a.id === id ? { ...a, ...updates } : a,
          ),
        });
      },

      deleteAccount: (id: string) => {
        set({
          accounts: get().accounts.filter((a) => a.id !== id),
          transactions: get().transactions.filter((t) => t.accountId !== id),
        });
      },

      addAllocation: (allocation: Omit<Allocation, 'id'>) => {
        const newAlloc: Allocation = { ...allocation, id: generateId() };
        set({ allocations: [...get().allocations, newAlloc] });
      },

      deleteAllocation: (id: string) => {
        set({ allocations: get().allocations.filter((a) => a.id !== id) });
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
          bankMappings: parsed.bankMappings ?? [],
          nextIncomeDate: parsed.nextIncomeDate ?? get().nextIncomeDate,
          expectedMonthlyIncome: parsed.expectedMonthlyIncome ?? get().expectedMonthlyIncome,
          todayFlexibleSpent: parsed.todayFlexibleSpent ?? 0,
        });
      },
    }),
    {
      name: 'denezhka-store',
      version: 2,
      migrate: (state: unknown, version: number) => {
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
        return s as unknown as typeof seedData;
      },
      partialize: (state) => ({
        accounts: state.accounts,
        transactions: state.transactions,
        categories: state.categories,
        obligations: state.obligations,
        allocations: state.allocations,
        goals: state.goals,
        importBatches: state.importBatches,
        rules: state.rules,
        bankMappings: state.bankMappings,
        nextIncomeDate: state.nextIncomeDate,
        expectedMonthlyIncome: state.expectedMonthlyIncome,
        todayFlexibleSpent: state.todayFlexibleSpent,
      }),
    },
  ),
);
