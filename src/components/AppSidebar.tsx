import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, Package, Users, ShoppingCart, DollarSign, 
  BarChart3, AlertTriangle, Settings, Bell, ChevronLeft, ChevronRight
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Products", icon: Package, path: "/products" },
  { label: "Suppliers", icon: Users, path: "/suppliers" },
  { label: "Purchases", icon: ShoppingCart, path: "/purchases" },
  { label: "Sales", icon: DollarSign, path: "/sales" },
  { label: "Reports", icon: BarChart3, path: "/reports" },
  { label: "Stock Alerts", icon: AlertTriangle, path: "/stock-alerts" },
];

const bottomItems = [
  { label: "Notifications", icon: Bell, path: "/notifications" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${collapsed ? "w-16" : "w-60"} transition-all duration-300 bg-sidebar border-r border-sidebar-border flex flex-col min-h-screen`}>
      {/* Logo */}
      <div className="h-14 flex items-center gap-2 px-4 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Package className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && <span className="font-bold text-foreground text-lg tracking-tight">StockPilot</span>}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-4 px-2">
        {!collapsed && <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">Main</p>}
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === "/"}
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

      {/* Bottom */}
      <div className="py-4 px-2 border-t border-sidebar-border">
        <ul className="space-y-0.5">
          {bottomItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
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
          className="mt-2 w-full flex items-center justify-center py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
