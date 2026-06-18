import type { ReactNode } from 'react';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminMobileHeader from '../components/admin/AdminMobileHeader';
import { useAdminNoIndex } from '../hooks/useAdminNoIndex';

interface AdminLayoutProps {
  children: ReactNode;
  username: string;
  onLogout: () => void;
}

const AdminLayout = ({ children, username, onLogout }: AdminLayoutProps) => {
  useAdminNoIndex();

  return (
    <div className="min-h-screen flex bg-[#050505] text-neutral-300">
      <AdminSidebar username={username} onLogout={onLogout} />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminMobileHeader onLogout={onLogout} />

        <main className="flex-1 relative overflow-x-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.06),transparent_50%)] pointer-events-none" />
          <div className="relative z-10">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
