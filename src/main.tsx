import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './app/App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Development only: sync state to data/state.json for CLI db tool
if (import.meta.env.DEV) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const debouncedSync = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        const { useStore } = await import('./store');
        const state = useStore.getState();
        await fetch('/__denezhka_state', {
          method: 'POST',
          body: JSON.stringify({
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
        }).catch(() => undefined);
      } catch { /* noop */ }
    }, 2000);
  };

  import('./store').then(({ useStore }) => {
    useStore.subscribe(debouncedSync);
    debouncedSync();
  });
}
