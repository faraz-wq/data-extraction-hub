import {
  LogOut,
  Upload,
  FileText,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { NavLink } from '@/components/NavLink';

export function Sidebar() {
  const { logout } = useAuth();

  const navItems = [
    { to: '/extract', icon: Upload, label: 'New Validation' },
    { to: '/extractions', icon: FileText, label: 'Extractions' },
    { to: '/configs', icon: Settings, label: 'Configurations' },
  ];


  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-16 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4">
      {/* Logo */}
      <div className="mb-8">
        <img
          src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzODQiIGhlaWdodD0iMjEuMzMzNCIgZmlsbD0iI0Y5NzMxNiIvPgo8cGF0aCBkPSJNMCAxMjhIMTI4VjI1NkwwIDEyOFoiIGZpbGw9IiNGOTczMTYiLz4KPHBhdGggZD0iTTM4My4wOTcgMC44MTk4OTRDMzg4LjU4NCAtMS4xOTA4OCAzOTQuMzA4IDEuMTk0ODIgMzk5Ljk2NSAwLjgxOTg5NEM0MDguMjk4IDIuMTE1MTcgNDE2LjczMiAzLjUxMjYgNDI0LjY5MiA2LjQ3ODFDNDI2Ljg2IDcuMTkzODYgNDI4LjY5NCA3Ljk0NDE3IDQzMS4wOTQgOC43MjgxQzQzNy44MDEgMTEuNTIzMSA0NDQuMzcyIDE0LjcyNzMgNDUwLjUwMyAxOC42ODEyQzQ2Ny4yMDIgMjguNzcwNyA0ODEuNTY1IDQyLjc0NjUgNDkxLjkzIDU5LjQxNDZDNTEwLjExOSA4Ny44NDI1IDUxNi4yMTYgMTIzLjczNSA1MDguNTI3IDE1Ni42NjNDNDk5LjU4NSAxOTcuNzM2IDQ2OC45MyAyMzIuOTgxIDQyOS44NzUgMjQ3LjcwN0M0MTYuMTkgMjUzLjI2MyA0MDEuNDg5IDI1NS4zNzYgMzg2LjgyNiAyNTYuNTAxQzQwMS41OTEgMjU2LjQzMiA0MTYuMTkgMjU5LjkxIDQyOS45NzcgMjY0LjkyQzQ2Mi4wMiAyNzcuNTY3IDQ4OC45ODMgMzAzLjU0IDUwMS44MiAzMzUuODJDNTA0LjA1NiAzNDAuNjYgNTA1LjIwOCAzNDUuOTA5IDUwNy4xMDQgMzUwLjg4NUM1MDguODY2IDM1OC43OTMgNTExIDM2Ni42NjggNTEwLjcyOSAzNzQuODQ4QzUxMi41MjUgMzgxLjE1NCA1MTIuMzIxIDM4Ny42OTkgNTEwLjcyOSAzOTQuMDA0QzUxMS4wMzQgNDAwLjEwNiA1MDkuNDA4IDQwNS45MDEgNTA4LjczIDQxMS45QzUwNy4xMDUgNDE0LjE4NCA1MDcuODg0IDQxNy4yODYgNTA2LjE1NiA0MTkuNTM2QzUwNi4wNTUgNDIwLjM1NCA1MDUuODUyIDQyMS45NTYgNTA1Ljc1IDQyMi43NzRDNTA0LjgzNiA0MjQuMTcxIDUwNC4yNTkgNDI1LjcwNSA1MDQuMDU2IDQyNy4zNzZDNTAyLjkwNCA0MjkuODY0IDUwMS45OSA0MzIuNDU0IDUwMS4wNzUgNDM1LjA3OUM0OTguOTQxIDQzOS41NzggNDk2Ljk3NiA0NDQuMjE0IDQ5NC4yNjcgNDQ4LjQwN0M0ODUuMDE5IDQ2NC43MzQgNDcyLjE0OCA0NzkuMDUgNDU2LjU2NiA0ODkuNTE0QzQ1NC42NyA0OTAuNzc1IDQ1Mi43NzMgNDkyLjAzNyA0NTAuODc2IDQ5My4yNjRDNDQ2LjQwNSA0OTUuOTkxIDQ0MS43NjQgNDk4LjQxMSA0MzcuMTU3IDUwMC45MzNDNDM0LjYxNyA1MDEuODU0IDQzMi4wNDIgNTAyLjc3NCA0MjkuNjA0IDUwMy45NjdDNDE4LjU5NSA1MDguMTk0IDQwNy4wMSA1MTAuMzc1IDM5NS40MjYgNTExLjk3N0MzNDguOTgzIDUxMS44NDIgMzAyLjUwNiA1MTIuMjA5IDI1Ni4wNjIgNTExLjgxNVYxMjcuNDgyQzI5OC40NCAxMjcuNDE4IDM0MC43ODUgMTI3LjQ4NCAzODMuMTMgMTI3LjQ1MUMzODMuMDk2IDg1LjIxNzkgMzgzLjE5OCA0My4wMTg2IDM4My4wOTcgMC44MTk4OTRaTTEyOC4wNjIgMzg1LjM0N1YzODUuNDE2QzEyOC4wNDIgMzg1LjM5MyAxMjguMDIxIDM4NS4zNyAxMjggMzg1LjM0N1MxMjguMDQyIDM4NS4zNDcgMTI4LjA2MiAzODUuMzQ3Wk0xMjggMzg0VjUxMkgyNTZMMTI4IDM4NFoiIGZpbGw9IiNGOTczMTYiLz4KPC9zdmc+Cg=="
          alt="Logo"
          className="w-8 h-8"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 w-full px-2 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex items-center justify-center w-full h-10 rounded-md transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
            activeClassName="bg-primary/10 text-primary"
            title={item.label}
          >
            <item.icon className="w-5 h-5" />
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="mt-auto pb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="Sign Out"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </aside>
  );
}
