import { Link, Outlet } from 'react-router';
import Logo from '../common/Logo';

const PublicLayout = () => (
  <div className="min-h-screen bg-canvas">
    <header className="relative z-1000 flex items-center justify-between border-b border-line bg-white px-4 py-3">
      <Link to="/" aria-label="MedaPark, ir al inicio">
        <Logo className="h-9" />
      </Link>
      <Link
        to="/admin/login"
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        Acceso administradores
      </Link>
    </header>
    <Outlet />
  </div>
);

export default PublicLayout;
