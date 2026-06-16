import { LayoutDashboard, Terminal, type LucideIcon } from 'lucide-react';
import { ROOST_BASE, ROOST_FORAGE } from './roostPaths';

type AdminNavItem = {
  to: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  end: boolean;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    to: ROOST_BASE,
    label: 'Control Plane',
    shortLabel: 'Control',
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: ROOST_FORAGE,
    label: 'Job Monitor',
    shortLabel: 'Forage',
    icon: Terminal,
    end: false,
  },
];
