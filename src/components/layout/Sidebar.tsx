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
    <aside className="fixed inset-y-0 left-0 z-50 w-16 bg-sidebar flex flex-col items-center py-4">
      {/* Tricolor Border Right */}
      <div className="absolute right-0 top-0 bottom-0 w-[1px] flex flex-col">
        <div className="flex-1 bg-primary"></div>
        <div className="flex-1 bg-[#000088]"></div>
        <div className="flex-1 bg-success"></div>
      </div>

      {/* Logo */}
      <div className="mb-8 pl-[1px]"> {/* Adjust for border centering if needed */}
        <img
          src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzODQiIGhlaWdodD0iMjEuMzMzNCIgZmlsbD0iI0Y5NzMxNiIvPgo8cGF0aCBkPSJNMCAxMjhIMTI4VjI1NkwwIDEyOFoiIGZpbGw9IiNGOTczMzE2Ii8+CjxwYXRoIGQ9Ik0zODMuMDk3IDAuODE5ODk0QzM4OC41ODQgLTEuMTkwODggMzk0LjMwOCAxLjE5NDgyIDM5OS45NjUgMC44MTk4OTRDNTA4LjI5OCAyLjExNTE3IDQxNi43MzIgMy41MTI2IDQyNC42OTIgNi40NzgxQzQyNi44NiA3LjE5Mzg2IDQyOC42OTQgNy45NDQxNyA0MzEuMDk0IDguNzI4MUM0MzcuODAxIDExLjUyMzEgNDQ0LjM3MiAxNC43MjczIDQ1MC41MDMgMTguNjgxMkM0NjcuMjAyIDI4Ljc3MDcgNDgxLjU2NSA0Mi43NDY1IDQ5MS45MyA1OS40MTQ2QzUxMC4xMTkgODcuODQyNSA1MTYuMjE2IDEyMy43MzUgNTA4LjUyNyAxNTYuNjYzQzQ5OS41ODUgMTk3LjczNiA0NjguOTMgMjMyLjU4MSA0MjkuODc1IDI0Ny43MDdDNDE2LjE5IDI1My4yNjMgNDAxLjQ4OSAyNTUuMzc2IDM4Ni44MjYgMjU2LjUwMUM0MDEuNTkxIDI1Ni40MzIgNDE2LjE5IDI1OS45MSA0MjkuOTc3IDI2NC45MkM0NjIuMDIgMjc3LjU2NyA0ODguOTgzIDMwMy41NDAgNTAxLjgyIDMzNS44MkM1MDQuMDU2IDM0MC42NiA1MDUuMjA4IDM0NS45MDkgNTA3LjEwNCAzNTAuODg1QzUwOC44NjYgMzU4Ljc5MyA1MTEgMzY2LjY2OCAzMTAuNzI5IDM3NC44NDhDNTExLjUyNSAzODEuMTU0IDUxMi4zMjEgMzg3LjY5OSA1MTAuNzI5IDM5NC4wMDRDNTExLjAzNCA0MDAuMTA2IDUwOS40MDggNDA1LjkwMSA1MDguNzMgNDExLjkwQzUwNy4xMDUgNDE0LjE4NCA1MDcuODg0IDQxNy4yODYgNTA2LjE1NiA0MTkuNTM2QzUwNi4wNTUgNDIwLjM1NCA1MDUuODUyIDQyMS45NTYgNTA1Ljc1IDQyMi43NzRDNTA0LjgzNiA0MjQuMTcxIDUwNC4yNTkgNDI1LjcwNSA1MDQuMDU2IDQyNy4zNzZDNTAyLjkwNCA0MjkuODY0IDUwMS45OSA0MzIuNDU0IDUwMS4wNzUgNDM1LjA3OUM0OTguOTQxIDQzOS41NzggNDk2LjE3NiA0NDQuMjE0IDQ5NC4yNjcgNDQ4LjQwN0M0ODUuMDE5IDQ2NC43MzQgNDcyLjE0OCA0NzkuMDUgNDU2LjU2NiA0ODkuNTE0QzQ1NC42NyA0OTAuNzc1IDQ1Mi43NzMgNDkyLjAzNyA0NTAuODc2IDQ5My4yNjRDNDQ2LjQwNSA0OTUuOTkxIDQ0MS43NjQgNDk4LjQxMSA0MzcuMTU3IDUwMC45MzNDNDM0LjYxNyA1MDEuODU0IDQzMi4wNDIgNTAyLjc3NCA0MjkuNjA0IDUwMy45NjdDNDE4LjU5NSA1MDguMTk0IDQwNy4wMSA1MTAuMzc1IDM5NS40MjYgNTExLjE3N0MzNDguOTgzIDUxMS44NDIgMzAyLjUwNiA1MTIuMjA5IDI1Ni4wNjIgNTExLjgxNVYxMjcuNDgyQzI5OC40NCAxMjcuNDE4IDM0MC43ODUgMTI3LjQ4NCAzODMuMTMgMTI3LjQ1MUMzODMuMDk2IDg1LjIxNzkgMzgzLjE5OCA0My4wMTg2IDM4My4wOTcgMC44MTk4OTRaTTEyOC4wNjIgMzg1LjM0N1YzODUuNDE2QzEyOC4wNDIgMzg1LjM5MyAxMjguMDIxIDM4NS4zNyAxMjggMzg1LjM0N1MxMjguMDQyIDM4NS4zNDcgMTI4LjA2MiAzODUuMzQ3Wk0xMjggMzg0VjUxMkgyNTZMMTI4IDM4NFoiIGZpbGw9IiNGOTczMTYiLz4KPC9zdmc+Cg=="
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
            className="flex items-center justify-center w-full h-10 rounded-md transition-colors text-muted-foreground hover:bg-muted hover:text-foreground group"
            activeClassName="bg-primary/5"
            title={item.label}
          >
            {({ isActive }) => (
              <item.icon
                className="w-5 h-5 transition-all duration-300"
                style={{ stroke: isActive ? "url(#tricolor-gradient)" : "currentColor" }}
              />
            )}
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
