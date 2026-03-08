import { Bell, Menu, User, LogOut, Settings, AlertTriangle, PackageCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  "/": { title: "Dashboard", subtitle: "Manage your inventory in real-time" },
  "/products": { title: "Products", subtitle: "Manage your product catalog" },
  "/suppliers": { title: "Suppliers", subtitle: "Manage your suppliers" },
  "/purchases": { title: "Purchases", subtitle: "Track purchase orders" },
  "/sales": { title: "Sales", subtitle: "Track sales transactions" },
  "/reports": { title: "Reports", subtitle: "Analytics and insights" },
  "/stock-alerts": { title: "Stock Alerts" },
  "/settings": { title: "Settings", subtitle: "Manage your preferences" },
  "/profile": { title: "Profile", subtitle: "Your account details" },
  "/staff": { title: "Staff Management", subtitle: "Manage your team" },
};

interface TopHeaderProps {
  onMenuClick: () => void;
}

export function TopHeader({ onMenuClick }: TopHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { role } = useRole();
  const pageInfo = pageTitles[location.pathname] || { title: "InventPro" };

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: lowStockProducts = [] } = useQuery({
    queryKey: ["low-stock-alerts", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name, stock, min_stock, sku");
      if (!data) return [];
      return data.filter(p => p.stock <= p.min_stock);
    },
    enabled: !!user,
    staleTime: 30000, // consider data fresh for 30s
    gcTime: 5 * 60 * 1000, // keep in cache 5 min
    refetchInterval: 60000,
  });

  const alertCount = lowStockProducts.length;

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "SP";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground leading-tight">{pageInfo.title}</h1>
          {pageInfo.subtitle && <p className="text-xs text-muted-foreground hidden sm:block">{pageInfo.subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Bell className="w-5 h-5" />
              {alertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1">
                  {alertCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h4 className="font-semibold text-foreground text-sm">Stock Alerts</h4>
              {alertCount > 0 && (
                <button
                  onClick={() => navigate("/stock-alerts")}
                  className="text-xs text-primary hover:underline"
                >
                  View all
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {lowStockProducts.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <PackageCheck className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">All products are well stocked!</p>
                </div>
              ) : (
                lowStockProducts.map(p => (
                  <div
                    key={p.id}
                    className="px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate("/stock-alerts")}
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${p.stock === 0 ? "text-destructive" : "text-orange-500"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.stock === 0 ? "Out of stock" : `${p.stock} left`} · Min: {p.min_stock}
                        </p>
                      </div>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                        p.stock === 0 ? "bg-destructive/10 text-destructive" : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                      }`}>
                        {p.stock === 0 ? "OUT" : "LOW"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-foreground">{profile?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <span className={`inline-block mt-1 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${role === "admin" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                {role || "user"}
              </span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="w-4 h-4 mr-2" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="w-4 h-4 mr-2" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
