import { Link, NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import canaryPng from '../../assets/code_canary.png';
import { ADMIN_NAV_ITEMS } from '../../constants/adminNav';
import { ROOST_BASE } from '../../constants/roostPaths';

interface AdminMobileHeaderProps {
  onLogout: () => void;
}

const AdminMobileHeader = ({ onLogout }: AdminMobileHeaderProps) => (
  <header className="lg:hidden sticky top-0 z-20 bg-neutral-950/95 backdrop-blur-xl border-b cc-admin-divider shrink-0">
    <div className="flex items-center justify-between px-4 h-14">
      <Link to={ROOST_BASE} className="flex items-center gap-2 no-underline min-w-0">
        <img src={canaryPng} alt="" className="w-7 h-7 object-contain shrink-0" />
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400/90 truncate">
          Operator
        </span>
      </Link>
      <button
        type="button"
        onClick={onLogout}
        className="p-2 rounded-xl cc-admin-border-soft text-neutral-400 hover:text-white hover:border-white/30 shrink-0"
        aria-label="Sign out"
      >
        <LogOut size={16} />
      </button>
    </div>

    <nav
      className="flex gap-2 px-4 pb-3"
      aria-label="Admin navigation"
    >
      {ADMIN_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider no-underline transition-all ${
                isActive
                  ? 'bg-amber-500/10 border border-amber-500/40 text-amber-100'
                  : 'cc-admin-border-soft text-neutral-400 hover:text-white hover:border-white/25'
              }`
            }
          >
            <Icon size={14} strokeWidth={2} />
            <span className="hidden sm:inline">{item.label}</span>
            <span className="sm:hidden">{item.shortLabel}</span>
          </NavLink>
        );
      })}
    </nav>
  </header>
);

export default AdminMobileHeader;
