import { NavLink } from 'react-router';
import { Building2, Car, LayoutGrid, type LucideIcon } from 'lucide-react';
import { useMyParking } from '../../hooks/useMyParking';
import { adminNavItems } from './adminNav';

const ICONS: Record<string, LucideIcon> = {
  '/admin': Building2,
  '/admin/ocupacion': Car,
  '/admin/parqueadero/celdas': LayoutGrid,
};

const AdminSidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  const my = useMyParking();
  const hasParking = my.state === 'con_parqueadero';
  const items = adminNavItems.filter((item) => !item.requiresParking || hasParking);

  return (
    <nav aria-label="Menú de administración" className="h-full min-h-full w-60 bg-navy-800 p-4">
      <ul className="space-y-1">
        {items.map((item) => {
          const Icon = ICONS[item.to] ?? Building2;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-[10px] px-3.5 py-3 text-base font-semibold transition ${
                    isActive ? 'bg-brand-600 text-white' : 'text-white/75 hover:bg-white/10'
                  }`
                }
              >
                <Icon size={20} aria-hidden="true" />
                {item.label}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default AdminSidebar;
