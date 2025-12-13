import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Sessions', href: '/sessions' },
  { name: 'Extract', href: '/extract' },
  { name: 'Schemas', href: '/schemas' },
  { name: 'API Keys', href: '/api-keys' },
  { name: 'Logs', href: '/logs' },
  { name: 'Metrics', href: '/metrics' },
];

export function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-sidebar-border">
        <span className="text-base font-semibold text-foreground tracking-tight">DocExtract</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'block px-3 py-2 rounded-lg text-[15px] transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-foreground font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-sidebar-border space-y-0.5">
        <NavLink
          to="/settings"
          className={cn(
            'block px-3 py-2 rounded-lg text-[15px] transition-colors',
            location.pathname === '/settings'
              ? 'bg-sidebar-accent text-foreground font-medium'
              : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
          )}
        >
          Settings
        </NavLink>
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 rounded-lg text-[15px] text-destructive hover:bg-destructive/10 transition-colors"
        >
          Sign Out
        </button>

        {user && (
          <div className="px-3 py-2 mt-2">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="text-sm text-foreground truncate">{user.email}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
