import { CircleUserRound, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';
import Logo from '../common/Logo';

type Props = { onLogoutClick: () => void; onMenuClick?: () => void };

const AdminHeader = ({ onLogoutClick, onMenuClick }: Props) => {
  const { user } = useAuth();

  return (
    <header className="flex h-[72px] items-center justify-between gap-3 border-b border-line bg-white px-4 sm:px-7">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Abrir menú"
            className="rounded-lg p-2 text-navy-900 hover:bg-canvas focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20 md:hidden"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        )}
        <Logo className="h-11" />
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <span className="hidden min-w-0 items-center gap-2.5 truncate rounded-full bg-canvas px-4 py-2 text-sm font-medium text-navy-900 sm:flex">
          <CircleUserRound size={18} aria-hidden="true" className="shrink-0" />
          {user?.email}
        </span>
        <Button variant="secondary" onClick={onLogoutClick}>
          <LogOut size={16} aria-hidden="true" />
          Cerrar sesión
        </Button>
      </div>
    </header>
  );
};

export default AdminHeader;
