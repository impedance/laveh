import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './app/App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Gist sync: fetch remote state on startup, then debounced push on changes
import('./store').then(async ({ useStore }) => {
  const { fetchStateFromGist, saveStateToGist } = await import('./domain/sync/gistSync');

  let gistSynced = false;

  // Hydrate from gist (source of truth)
  fetchStateFromGist().then((remoteState) => {
    if (remoteState) {
      useStore.setState(remoteState);
    }
    gistSynced = true;
  });

  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  const debouncedPushToGist = () => {
    if (!gistSynced) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const state = useStore.getState();
      saveStateToGist({
        accounts: state.accounts,
        transactions: state.transactions,
        categories: state.categories,
        categoryGroups: state.categoryGroups,
        importBatches: state.importBatches,
        bankMappings: state.bankMappings,
        rules: state.rules,
        nextIncomeDate: state.nextIncomeDate,
        expectedMonthlyIncome: state.expectedMonthlyIncome,
        todayFlexibleSpent: state.todayFlexibleSpent,
        monthStates: state.monthStates,
      });
    }, 2000);
  };

  useStore.subscribe(debouncedPushToGist);
});

// Development only: sync state to data/state.json for CLI db tool
if (import.meta.env.DEV) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const debouncedSync = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        const { useStore } = await import('./store');
        const state = useStore.getState();
        await fetch('/__laveh_state', {
          method: 'POST',
          body: JSON.stringify({
            accounts: state.accounts,
            transactions: state.transactions,
            categories: state.categories,
            importBatches: state.importBatches,
            rules: state.rules,
            bankMappings: state.bankMappings,
            nextIncomeDate: state.nextIncomeDate,
            expectedMonthlyIncome: state.expectedMonthlyIncome,
            todayFlexibleSpent: state.todayFlexibleSpent,
            monthStates: state.monthStates,
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
