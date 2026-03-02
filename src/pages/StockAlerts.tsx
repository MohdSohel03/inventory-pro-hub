import { PageHeader } from "@/components/PageHeader";
import { mockProducts } from "@/lib/mock-data";
import { AlertTriangle, Package } from "lucide-react";

const StockAlerts = () => {
  const lowStock = mockProducts.filter(p => p.stock <= p.min_stock);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader title="Stock Alerts" subtitle={`${lowStock.length} products need attention`} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lowStock.map(p => (
          <div key={p.id} className={`bg-card border rounded-xl p-5 ${p.stock === 0 ? "border-destructive/40" : "border-warning/40"}`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${p.stock === 0 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                {p.stock === 0 ? <AlertTriangle className="w-5 h-5" /> : <Package className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{p.name}</h3>
                <p className="text-sm text-muted-foreground font-mono">{p.sku}</p>
                <div className="mt-3 flex gap-4">
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
                    <p className="text-sm text-foreground">{p.location}</p>
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
