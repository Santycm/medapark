import { useState } from 'react';
import { Outlet } from 'react-router';
import LogoutDialog from '../auth/LogoutDialog';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <AdminHeader onLogoutClick={() => setLogoutOpen(true)} onMenuClick={() => setMenuOpen((v) => !v)} />

      <div className="relative flex flex-1">
        <div className="hidden md:block">
          <AdminSidebar />
        </div>

        {menuOpen && (
          <div className="absolute inset-y-0 left-0 z-1000 md:hidden">
            <AdminSidebar onNavigate={() => setMenuOpen(false)} />
          </div>
        )}

        <main className="min-w-0 flex-1 p-4 sm:px-8 sm:py-6">
          <Outlet />
        </main>
      </div>

      <LogoutDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </div>
  );
};

export default AdminLayout;
