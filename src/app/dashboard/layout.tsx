'use client';

import DashboardNavbar from '@/components/DashboardNavbar';
import DashboardSidebar from '@/components/DashboardSidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardNavbar />
        <main className="p-8 pt-24">
          {children}
        </main>
      </div>
    </div>
  );
} 