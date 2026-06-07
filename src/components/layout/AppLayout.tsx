import type { ReactNode } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#090d12]">
      <div className="mx-auto min-h-screen max-w-[430px] px-4 py-[18px]">
        {children}
      </div>
    </div>
  );
}
