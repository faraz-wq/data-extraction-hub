import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  noPadding?: boolean;
}

export function DashboardLayout({ children, noPadding }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-16">
        <div className={noPadding ? "" : "p-4"}>
          {children}
        </div>
      </main>
    </div>
  );
}
