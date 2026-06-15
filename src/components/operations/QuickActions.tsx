import { useState, useRef, useEffect } from 'react';
import AddTransactionModal from './AddTransactionModal';
import AddCategoryModal from './AddCategoryModal';

export default function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<'income' | 'expense' | null>(null);
  const [showCatModal, setShowCatModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="fixed bottom-[96px] right-4 z-40 min-[430px]:right-[calc(50vw-215px+16px)]">
      {/* Expanded Actions Menu */}
      {isOpen && (
        <div className="mb-3 flex flex-col items-end gap-2 transition-all duration-200 ease-out">
          {/* Add Category Button */}
          <button
            onClick={() => {
              setShowCatModal(true);
              setIsOpen(false);
            }}
            className="flex items-center gap-2 rounded-full bg-[#171f2a] border border-[rgba(255,255,255,0.08)] px-4 py-2.5 shadow-lg active:scale-95 transition-transform"
          >
            <span className="text-xs font-semibold text-[#8795a5]">Новая категория</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#75b8ff] text-sm font-bold text-[#090d12]">
              🏷️
            </div>
          </button>

          {/* Add Income Button */}
          <button
            onClick={() => {
              setTxModalType('income');
              setIsOpen(false);
            }}
            className="flex items-center gap-2 rounded-full bg-[#171f2a] border border-[rgba(255,255,255,0.08)] px-4 py-2.5 shadow-lg active:scale-95 transition-transform"
          >
            <span className="text-xs font-semibold text-[#8795a5]">Внести доход</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#58d68d] text-sm font-bold text-[#090d12]">
              +
            </div>
          </button>

          {/* Add Expense Button */}
          <button
            onClick={() => {
              setTxModalType('expense');
              setIsOpen(false);
            }}
            className="flex items-center gap-2 rounded-full bg-[#171f2a] border border-[rgba(255,255,255,0.08)] px-4 py-2.5 shadow-lg active:scale-95 transition-transform"
          >
            <span className="text-xs font-semibold text-[#8795a5]">Добавить расход</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e74c3c] text-sm font-bold text-[#eef4f8]">
              −
            </div>
          </button>
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-[56px] w-[56px] items-center justify-center rounded-full shadow-xl active:scale-95 transition-all duration-300 ${
          isOpen ? 'bg-[#e74c3c] text-[#eef4f8] rotate-45' : 'bg-[#75b8ff] text-[#090d12]'
        }`}
      >
        <span className="text-2xl font-bold leading-none">+</span>
      </button>

      {/* Modals */}
      {txModalType && (
        <AddTransactionModal
          prefilledType={txModalType}
          onClose={() => setTxModalType(null)}
        />
      )}

      {showCatModal && (
        <AddCategoryModal
          onClose={() => setShowCatModal(false)}
        />
      )}
    </div>
  );
}
