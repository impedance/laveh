const tabs = [
  { label: 'Главная', active: true },
  { label: 'Операции', active: false },
  { label: 'План', active: false },
  { label: 'Импорт', active: false },
];

export default function BottomNavigation() {
  return (
    <nav className="flex gap-1 rounded-[18px] bg-[#121821] p-1">
      {tabs.map((tab) => (
        <button
          key={tab.label}
          className={`flex-1 rounded-[14px] px-3 py-3 text-center text-sm font-semibold transition-colors ${
            tab.active
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
