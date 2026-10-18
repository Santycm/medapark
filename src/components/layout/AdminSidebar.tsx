import { NavLink } from 'react-router';
import { ParkingSquare } from 'lucide-react';
import { adminNavItems } from './adminNav';

const AdminSidebar = ({ onNavigate }: { onNavigate?: () => void }) => (
  <nav aria-label="Menú de administración" className="h-full min-h-full w-60 bg-navy-800 p-4">
    <ul className="space-y-1">
      {adminNavItems.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            end
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-brand-600 text-white' : 'text-white/75 hover:bg-white/10'
              }`
            }
          >
            <ParkingSquare size={18} aria-hidden="true" />
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
);

export default AdminSidebar;
