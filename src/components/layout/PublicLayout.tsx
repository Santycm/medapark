import { Link, Outlet } from 'react-router';
import { LogIn } from 'lucide-react';
import Logo from '../common/Logo';

const PublicLayout = () => (
  <div className="min-h-screen bg-canvas">
    <header className="relative z-1000 flex h-[72px] items-center justify-between border-b border-line bg-white px-4 sm:px-7">
      <Link to="/" aria-label="MedaPark, ir al inicio">
        <Logo className="h-11" />
      </Link>
      <Link
        to="/admin/login"
        className="inline-flex items-center gap-2 rounded-[10px] border-[1.5px] border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 transition hover:bg-canvas focus:outline-none focus-visible:ring-4 focus-visible:ring-navy-900/15"
      >
        <LogIn size={18} aria-hidden="true" />
        Acceso administradores
      </Link>
    </header>
    <Outlet />
  </div>
);

export default PublicLayout;
