import { useState } from 'react';
import { useStore } from '../store';
import AppLayout from '../components/layout/AppLayout';
import BottomNavigation from '../components/layout/BottomNavigation';
import AccountsSummaryCard from '../components/cards/AccountsSummaryCard';
import EditBalanceModal from '../components/operations/EditBalanceModal';

interface Props {
  onTabChange: (tab: string) => void;
}

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

  return (
    <AppLayout>
      <div className="mb-[14px] flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-[-0.02em] text-[#eef4f8]">Счета и Капитал</h2>
        <button
          onClick={() => setShowEditBalance(true)}
          className="rounded-xl bg-[#171f2a] px-3 py-1.5 text-sm font-semibold text-[#75b8ff]"
        >
          Сверить баланс
        </button>
      </div>

      <div className="mb-[14px]">
        <AccountsSummaryCard accounts={store.accounts} />
      </div>

      <section className="rounded-[18px] bg-[#121821] p-[18px]">
        <h3 className="mb-3 text-base font-bold text-[#eef4f8]">Управление счетами</h3>

        {store.accounts.map((acc) => (
          <div key={acc.id} className="mb-3 rounded-xl bg-[#171f2a] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-[#eef4f8]">{acc.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs rounded-full bg-[#121821] px-2 py-0.5 text-[#8795a5]">
                  {acc.type === 'credit' ? 'Кредитный' : 'Дебетовый'}
                  {acc.onBudget ? '' : ' · исключён'}
                </span>
                <button
                  onClick={() => {
                    if (window.confirm(`Удалить счёт «${acc.name}»? Транзакции будут удалены.`)) {
                      store.deleteAccount(acc.id);
                    }
                  }}
                  className="text-xs text-[#e74c3c]"
                >
                  ✕
                </button>
              </div>
            </div>
            <input
              type="number"
              value={acc.currentBalance}
              onChange={(e) =>
                store.updateAccount(acc.id, {
                  currentBalance: Number(e.target.value),
                })
              }
              className="w-full rounded-xl bg-[#121821] px-3 py-2 text-sm text-[#eef4f8]"
            />
            {acc.type === 'credit' && (
              <div className="mt-2">
                <input
                  type="number"
                  placeholder="Кредитный лимит"
                  value={acc.creditLimit ?? ''}
                  onChange={(e) =>
                    store.updateAccount(acc.id, {
                      creditLimit: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl bg-[#121821] px-3 py-2 text-sm text-[#eef4f8]"
                />
                <div className="mt-1 text-xs text-[#e74c3c]">
                  Долг: {Math.max(0, -acc.currentBalance).toLocaleString('ru-RU')} ₽
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="mt-4 border-t border-[rgba(255,255,255,0.06)] pt-4 space-y-2">
          <input
            placeholder="Название нового счёта"
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
            className="w-full rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8]"
          />
          <div className="flex gap-2">
            <select
              value={newAccountType}
              onChange={(e) => setNewAccountType(e.target.value as 'debit' | 'credit')}
              className="flex-1 rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8]"
            >
              <option value="debit">Дебетовый</option>
              <option value="credit">Кредитный</option>
            </select>
            <input
              type="number"
              placeholder="Баланс"
              value={newAccountBalance || ''}
              onChange={(e) => setNewAccountBalance(Number(e.target.value))}
              className="flex-1 rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8]"
            />
          </div>
          {newAccountType === 'credit' && (
            <input
              type="number"
              placeholder="Кредитный лимит"
              value={newAccountCreditLimit || ''}
              onChange={(e) => setNewAccountCreditLimit(Number(e.target.value))}
              className="w-full rounded-xl bg-[#171f2a] px-3 py-2 text-sm text-[#eef4f8]"
            />
          )}
          <button
            onClick={handleAddAccount}
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] px-4 py-2 text-sm font-semibold text-[#8795a5] hover:text-[#eef4f8]"
          >
            + Добавить счёт
          </button>
        </div>
      </section>

      <div className="mt-[14px]">
        <BottomNavigation activeTab="accounts" onTabChange={onTabChange} />
      </div>

      {showEditBalance && (
        <EditBalanceModal
          onClose={() => setShowEditBalance(false)}
        />
      )}
    </AppLayout>
  );
}
