import { useState, useMemo } from 'react';
import { useStore } from '../store';
import type { Account } from '../store/types';
import AppLayout from '../components/layout/AppLayout';
import BottomNavigation from '../components/layout/BottomNavigation';
import AccountsSummaryCard from '../components/cards/AccountsSummaryCard';
import EditBalanceModal from '../components/operations/EditBalanceModal';

interface Props {
  onTabChange: (tab: string) => void;
}

function getAccountGroup(acc: Account): 'cash' | 'card' | 'savings' | 'debt' {
  const nameLower = acc.name.toLowerCase();
  if (acc.type === 'credit') {
    if (nameLower.includes('долг') || nameLower.includes('кредит') || nameLower.includes('заем') || nameLower.includes('loan')) {
      return 'debt';
    }
    return 'card'; // Credit cards
  }
  // Debit accounts
  if (nameLower.includes('налич') || nameLower.includes('cash') || nameLower.includes('кошел') || nameLower.includes('карман')) {
    return 'cash';
  }
  if (nameLower.includes('накоп') || nameLower.includes('вклад') || nameLower.includes('депоз') || nameLower.includes('копил') || nameLower.includes('сейф') || nameLower.includes('saving')) {
    return 'savings';
  }
  return 'card';
}

const GROUP_LABELS: Record<'cash' | 'card' | 'savings' | 'debt', string> = {
  cash: 'Наличные',
  card: 'Карты',
  savings: 'Накопления',
  debt: 'Долги',
};

export default function AccountsPage({ onTabChange }: Props) {
  const store = useStore();
  const [showEditBalance, setShowEditBalance] = useState(false);

  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<'debit' | 'credit'>('debit');
  const [newAccountBalance, setNewAccountBalance] = useState(0);
  const [newAccountCreditLimit, setNewAccountCreditLimit] = useState(0);

  const handleAddAccount = () => {
    if (!newAccountName.trim()) return;
    store.addAccount({
      name: newAccountName.trim(),
      type: newAccountType,
      onBudget: true,
      currentBalance: newAccountBalance,
      creditLimit: newAccountType === 'credit' ? newAccountCreditLimit || undefined : undefined,
    });
    setNewAccountName('');
    setNewAccountType('debit');
    setNewAccountBalance(0);
    setNewAccountCreditLimit(0);
  };

  // Grouped accounts
  const grouped = useMemo(() => {
    const groups: Record<'cash' | 'card' | 'savings' | 'debt', Account[]> = {
      cash: [],
      card: [],
      savings: [],
      debt: [],
    };
    for (const acc of store.accounts) {
      const grp = getAccountGroup(acc);
      groups[grp].push(acc);
    }
    return groups;
  }, [store.accounts]);

  // Group totals
  const groupTotals = useMemo(() => {
    const totals: Record<'cash' | 'card' | 'savings' | 'debt', number> = {
      cash: 0,
      card: 0,
      savings: 0,
      debt: 0,
    };
    for (const acc of store.accounts) {
      const grp = getAccountGroup(acc);
      totals[grp] += acc.currentBalance;
    }
    return totals;
  }, [store.accounts]);

  const activeGroupKeys = useMemo(() => {
    return (Object.keys(grouped) as Array<'cash' | 'card' | 'savings' | 'debt'>).filter(
      (k) => grouped[k].length > 0
    );
  }, [grouped]);

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-[14px] flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-[-0.02em] text-[#eef4f8]">Счета и Капитал</h2>
        <button
          onClick={() => setShowEditBalance(true)}
          className="rounded-xl bg-[#171f2a] px-3 py-1.5 text-sm font-semibold text-[#75b8ff] hover:bg-[#1e2a3a] transition-colors"
        >
          Сверить баланс
        </button>
      </div>

      {/* Summary Card */}
      <div className="mb-[14px]">
        <AccountsSummaryCard accounts={store.accounts} />
      </div>

      {/* Grouped accounts list */}
      <div className="flex flex-col gap-4 mb-4">
        {activeGroupKeys.map((key) => {
          const accList = grouped[key];
          const total = groupTotals[key];
          return (
            <section key={key} className="rounded-[18px] bg-[#121821] p-[18px]">
              {/* Group Header */}
              <div className="mb-3 flex items-center justify-between border-b border-[rgba(255,255,255,0.04)] pb-2">
                <h3 className="text-sm font-bold text-[#75b8ff]">{GROUP_LABELS[key]}</h3>
                <span className={`text-sm font-bold tabular-nums ${total >= 0 ? 'text-[#58d68d]' : 'text-[#e74c3c]'}`}>
                  {total.toLocaleString('ru-RU')} ₽
                </span>
              </div>

              {/* Account items */}
              <div className="space-y-3">
                {accList.map((acc) => (
                  <div key={acc.id} className="rounded-xl bg-[#171f2a] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-[#eef4f8]">{acc.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] rounded-full bg-[#121821] px-2 py-0.5 text-[#8795a5]">
                          {acc.type === 'credit' ? 'Кредит' : 'Дебет'}
                        </span>
                        <button
                          onClick={() => {
                            if (window.confirm(`Удалить счёт «${acc.name}»? Транзакции будут удалены.`)) {
                              store.deleteAccount(acc.id);
                            }
                          }}
                          className="text-xs text-[#e74c3c] hover:opacity-85"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-0.5 block text-[10px] text-[#8795a5]">Баланс</label>
                        <input
                          type="number"
                          value={acc.currentBalance}
                          onChange={(e) =>
                            store.updateAccount(acc.id, {
                              currentBalance: Number(e.target.value),
                            })
                          }
                          className="w-full rounded-lg bg-[#121821] border border-[rgba(255,255,255,0.06)] px-2 py-1 text-xs tabular-nums text-[#eef4f8] focus:border-[#75b8ff] focus:outline-none"
                        />
                      </div>
                      {acc.type === 'credit' ? (
                        <div>
                          <label className="mb-0.5 block text-[10px] text-[#8795a5]">Лимит</label>
                          <input
                            type="number"
                            placeholder="Кредитный лимит"
                            value={acc.creditLimit ?? ''}
                            onChange={(e) =>
                              store.updateAccount(acc.id, {
                                creditLimit: e.target.value === '' ? undefined : Number(e.target.value),
                              })
                            }
                            className="w-full rounded-lg bg-[#121821] border border-[rgba(255,255,255,0.06)] px-2 py-1 text-xs tabular-nums text-[#eef4f8] focus:border-[#75b8ff] focus:outline-none"
                          />
                        </div>
                      ) : (
                        <div className="flex items-end justify-end pb-1 text-[10px] text-[#8795a5]">
                          Собственные средства
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {/* Add Account section */}
        <section className="rounded-[18px] bg-[#121821] p-[18px]">
          <h3 className="mb-3 text-sm font-bold text-[#eef4f8]">+ Добавить новый счёт</h3>
          <div className="space-y-3">
            <input
              placeholder="Название нового счёта"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              className="w-full rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8] focus:outline-none"
            />
            <div className="flex gap-2">
              <select
                value={newAccountType}
                onChange={(e) => setNewAccountType(e.target.value as 'debit' | 'credit')}
                className="flex-1 rounded-xl bg-[#171f2a] px-3 py-2 text-xs text-[#eef4f8] focus:outline-none"
              >
                <option value="debit">Дебетовый</option>
                <option value="credit">Кредитный</option>
              </select>
              <input
                type="number"
                placeholder="Баланс"
                value={newAccountBalance || ''}
                onChange={(e) => setNewAccountBalance(Number(e.target.value))}
                className="flex-1 rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8] focus:outline-none"
              />
            </div>
            {newAccountType === 'credit' && (
              <input
                type="number"
                placeholder="Кредитный лимит"
                value={newAccountCreditLimit || ''}
                onChange={(e) => setNewAccountCreditLimit(Number(e.target.value))}
                className="w-full rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8] focus:outline-none"
              />
            )}
            <button
              onClick={handleAddAccount}
              className="w-full rounded-xl bg-[#75b8ff] py-2.5 text-sm font-bold text-[#090d12] hover:opacity-90 transition-opacity"
            >
              Создать счёт
            </button>
          </div>
        </section>
      </div>

      {/* Navigation */}
      <div className="mt-[14px]">
        <BottomNavigation activeTab="accounts" onTabChange={onTabChange} />
      </div>

      {/* Reconcile modal overlay */}
      {showEditBalance && (
        <EditBalanceModal
          onClose={() => setShowEditBalance(false)}
        />
      )}
    </AppLayout>
  );
}
