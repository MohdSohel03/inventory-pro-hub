import { useState, useEffect } from "react";
import { AlertTriangle, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const StockAlerts = () => {
  const { user } = useAuth();
  const [lowStock, setLowStock] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("products").select("*").then(({ data }) => {
      if (data) setLowStock(data.filter(p => p.stock <= p.min_stock));
    });
  }, [user]);

  return (
    <div className="p-3 sm:p-6 max-w-[1400px] mx-auto">
      {lowStock.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">All products are well stocked! No alerts.</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {lowStock.map((p, idx) => (
          <div key={p.id} className={`bg-card border rounded-xl p-4 sm:p-5 opacity-0 animate-fade-in-scale hover:-translate-y-0.5 transition-all duration-300 ${p.stock === 0 ? "border-destructive/40" : "border-warning/40"}`} style={{ animationDelay: `${idx * 80}ms` }}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${p.stock === 0 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                {p.stock === 0 ? <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" /> : <Package className="w-4 h-4 sm:w-5 sm:h-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{p.name}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-mono">{p.sku}</p>
                <div className="mt-3 flex flex-wrap gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Current</p>
                    <p className="font-bold text-foreground">{p.stock}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Minimum</p>
                    <p className="font-bold text-foreground">{p.min_stock}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-xs sm:text-sm text-foreground">{p.location}</p>
                  </div>
                </div>
                <span className={`inline-block mt-3 ${p.stock === 0 ? "status-out-of-stock" : "status-low-stock"}`}>
                  {p.stock === 0 ? "Out of Stock" : "Low Stock"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockAlerts;
