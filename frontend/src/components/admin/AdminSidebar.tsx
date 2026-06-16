import { NavLink } from 'react-router-dom';
import {
  Activity,
  LogOut,
  Radio,
} from 'lucide-react';
import canaryPng from '../../assets/code_canary.png';
import Button from '../common/Button';
import { ADMIN_NAV_ITEMS } from '../../constants/adminNav';
import { ROOST_BASE } from '../../constants/roostPaths';

interface AdminSidebarProps {
  username: string;
  onLogout: () => void;
}

const AdminSidebar = ({ username, onLogout }: AdminSidebarProps) => (
  <aside className="hidden lg:flex w-[260px] shrink-0 flex-col h-screen sticky top-0 border-r cc-admin-divider bg-neutral-950/80 backdrop-blur-xl">
    <div className="shrink-0 p-6 border-b cc-admin-divider">
      <NavLink to={ROOST_BASE} className="group flex items-center gap-3 no-underline">
        <div className="w-10 h-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[18deg] origin-[75%_75%]">
          <img src={canaryPng} alt="" className="w-full h-full object-contain" />
        </div>
        <div>
          <p className="text-sm font-black text-white uppercase tracking-tight leading-none">
            Code <span className="text-neutral-500">Canary</span>
          </p>
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-amber-400/90 mt-1.5">
            Operator Console
          </p>
        </div>
      </NavLink>
    </div>

    <nav className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1 custom-scrollbar">
      {ADMIN_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all no-underline ${
                isActive
                  ? 'bg-amber-500/10 border border-amber-500/40 text-amber-100 shadow-[0_0_24px_rgba(245,158,11,0.08)]'
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.03] cc-admin-border-soft border-transparent hover:border-white/25'
              }`
            }
          >
            <Icon size={18} strokeWidth={2} />
            <span className="text-[11px] font-black uppercase tracking-[0.12em]">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>

    <div className="shrink-0 p-4 border-t cc-admin-divider space-y-3 bg-neutral-950/80">
      <div className="px-4 py-3 rounded-2xl bg-white/[0.02] cc-admin-border-soft">
        <div className="flex items-center gap-2 mb-2">
          <Radio size={12} className="text-emerald-400" />
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-400/90">Live Session</span>
        </div>
        <p className="text-sm font-bold text-white truncate">{username}</p>
      </div>

      <NavLink to="/" className="block no-underline">
        <Button
          variant="outline"
          className="w-full justify-center gap-2 py-2.5 text-[10px] font-black uppercase tracking-wider border-neutral-800"
        >
          <Activity size={14} />
          Public Site
        </Button>
      </NavLink>

      <Button
        variant="secondary"
        className="w-full justify-center gap-2 py-2.5 text-[10px] font-black uppercase tracking-wider"
        onClick={onLogout}
      >
        <LogOut size={14} />
        Sign Out
      </Button>
    </div>
  </aside>
);

export default AdminSidebar;
