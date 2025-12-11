import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Upload,
  Database,
  Key,
  ScrollText,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Sessions', href: '/sessions', icon: FileText },
  { name: 'Extract', href: '/extract', icon: Upload },
  { name: 'Schemas', href: '/schemas', icon: Database },
  { name: 'API Keys', href: '/api-keys', icon: Key },
  { name: 'Logs', href: '/logs', icon: ScrollText },
  { name: 'Metrics', href: '/metrics', icon: BarChart3 },
];

export function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-foreground">DocExtract</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-primary' : 'text-sidebar-foreground'
                )}
              />
              {item.name}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <NavLink
          to="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
            location.pathname === '/settings'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
          )}
        >
          <Settings className="w-5 h-5" />
          Settings
        </NavLink>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>

        {user && (
          <div className="px-3 py-3 mt-2 rounded-lg bg-sidebar-accent/30">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
