import { useState } from 'react';
import HomePage from '../pages/HomePage';
import OperationsPage from '../pages/OperationsPage';
import PlanPage from '../pages/PlanPage';
import ImportPage from '../pages/ImportPage';

// AICODE-NOTE: ROUTING_HUB Tab-based routing (Home/Operations/Plan/Import) via useState, no react-router
export default function App() {
  const [tab, setTab] = useState('home');

  switch (tab) {
    case 'operations':
      return <OperationsPage onTabChange={setTab} />;
    case 'plan':
      return <PlanPage onTabChange={setTab} />;
    case 'import':
      return <ImportPage onTabChange={setTab} />;
    default:
      return <HomePage onTabChange={setTab} />;
  }
}
