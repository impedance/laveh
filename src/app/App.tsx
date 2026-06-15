import { useState, useEffect, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import HomePage from '../pages/HomePage';
import OperationsPage from '../pages/OperationsPage';
import BudgetPage from '../pages/BudgetPage';
import ImportPage from '../pages/ImportPage';
import GoalsPage from '../pages/GoalsPage';

export default function App() {
  const [tab, setTab] = useState('home');
  const [showUpdate, setShowUpdate] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (needRefresh) setShowUpdate(true);
  }, [needRefresh]);

  const handleUpdate = useCallback(() => {
    updateServiceWorker(true);
  }, [updateServiceWorker]);

  let page;
  switch (tab) {
    case 'operations': page = <OperationsPage onTabChange={setTab} />; break;
    case 'plan': page = <BudgetPage onTabChange={setTab} />; break;
    case 'goals': page = <GoalsPage onTabChange={setTab} />; break;
    case 'import': page = <ImportPage onTabChange={setTab} />; break;
    default: page = <HomePage onTabChange={setTab} />; break;
  }

  return (
    <>
      {page}
      {showUpdate && (
        <div className="fixed bottom-24 left-4 right-4 z-50 mx-auto flex max-w-[430px] items-center justify-between rounded-[18px] bg-[#75b8ff] px-4 py-3 shadow-lg">
          <span className="text-sm font-bold text-[#090d12]">Новая версия доступна</span>
          <button
            onClick={handleUpdate}
            className="rounded-xl bg-[#090d12] px-4 py-1.5 text-sm font-bold text-[#75b8ff]"
          >
            Обновить
          </button>
        </div>
      )}
    </>
  );
}
