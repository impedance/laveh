interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { key: 'home', label: 'Бюджет' },
  { key: 'operations', label: 'Операции' },
  { key: 'accounts', label: 'Счета' },
  { key: 'plan', label: 'План' },
  { key: 'import', label: 'Импорт' },
];

export default function BottomNavigation({ activeTab, onTabChange }: Props) {
  return (
    <nav className="flex gap-1 rounded-[18px] bg-[#121821] p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex-1 rounded-[14px] px-3 py-3 text-center text-sm font-semibold transition-colors ${
            activeTab === tab.key
              ? 'bg-[#75b8ff] text-[#090d12]'
              : 'text-[#8795a5] hover:text-[#eef4f8]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
