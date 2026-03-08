import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, Package, Users, ShoppingCart, DollarSign, 
  BarChart3, AlertTriangle, Settings, ChevronLeft, ChevronRight, X, UserPlus
} from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import inventProLogo from "@/assets/inventpro-logo.png";

const commonNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Products", icon: Package, path: "/products" },
  { label: "Sales", icon: DollarSign, path: "/sales" },
  { label: "Reports", icon: BarChart3, path: "/reports" },
  { label: "Stock Alerts", icon: AlertTriangle, path: "/stock-alerts" },
];

const adminOnlyNavItems = [
  { label: "Suppliers", icon: Users, path: "/suppliers" },
  { label: "Purchases", icon: ShoppingCart, path: "/purchases" },
];

const bottomItems = [
  { label: "Settings", icon: Settings, path: "/settings" },
];

interface AppSidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export function AppSidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: AppSidebarProps) {
  const { isAdmin } = useRole();

  const allNavItems = isAdmin
    ? [...commonNavItems, ...adminOnlyNavItems, { label: "Staff", icon: UserPlus, path: "/staff" }]
    : commonNavItems;

  const sidebarContent = (
    <>
      <div className="h-14 flex items-center gap-2 px-4 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Package className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && <span className="font-bold text-sidebar-primary-foreground text-lg tracking-tight">InventPro</span>}
        <button onClick={() => setMobileOpen(false)} className="lg:hidden ml-auto p-1 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        {!collapsed && <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">Main</p>}
        <ul className="space-y-0.5">
          {allNavItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === "/"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-sidebar-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="py-4 px-2 border-t border-sidebar-border">
        <ul className="space-y-0.5">
          {bottomItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-sidebar-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex mt-2 w-full items-center justify-center py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </>
  );

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-sidebar border-r border-sidebar-border flex flex-col lg:hidden transform transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {sidebarContent}
      </aside>
      <aside className={`${collapsed ? "w-16" : "w-60"} transition-all duration-300 bg-sidebar border-r border-sidebar-border hidden lg:flex flex-col sticky top-0 h-screen`}>
        {sidebarContent}
      </aside>
    </>
  );
}
