import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Reports = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-03-01");
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("sales").select("*").eq("user_id", user.id),
      supabase.from("purchases").select("*").eq("user_id", user.id),
      supabase.from("products").select("*").eq("user_id", user.id),
    ]).then(([s, p, pr]) => {
      if (s.data) setSales(s.data);
      if (p.data) setPurchases(p.data);
      if (pr.data) setProducts(pr.data);
    });
  }, [user]);

  const totalSales = sales.reduce((s, d) => s + Number(d.total), 0);
  const totalPurchases = purchases.reduce((s, d) => s + Number(d.total), 0);
  const profit = totalSales - totalPurchases;

  // Sales trend by month
  const salesByMonth: Record<string, number> = {};
  sales.forEach(s => {
    const m = s.date?.slice(0, 7);
    if (m) salesByMonth[m] = (salesByMonth[m] || 0) + Number(s.total);
  });
  const salesTrend = Object.entries(salesByMonth).sort().map(([month, sales]) => ({ month, sales }));

  const topSelling = products.slice(0, 5).map(p => ({ name: p.name, stock: p.stock }));
  const lowStockProducts = products.filter(p => p.stock <= p.min_stock);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex bg-card border border-border rounded-lg overflow-hidden">
          {["daily", "weekly", "monthly"].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{p}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">From</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-40" />
          <Label className="text-sm">To</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-40" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Total Sales</p>
          <p className="text-2xl font-bold text-foreground">₹{totalSales.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Total Purchases</p>
          <p className="text-2xl font-bold text-foreground">₹{totalPurchases.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Profit</p>
          <p className={`text-2xl font-bold ${profit >= 0 ? "text-success" : "text-destructive"}`}>₹{profit.toLocaleString("en-IN")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Sales Trend</h3>
          {salesTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => `₹${v/1000}k`} />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="hsl(210 100% 50%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">No sales data yet</div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Product Stock Levels</h3>
          {topSelling.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topSelling} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={120} />
                <Tooltip />
                <Bar dataKey="stock" fill="hsl(210 100% 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">No products yet</div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-4">Low Stock Products</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Product", "SKU", "Current Stock", "Min Stock", "Status"].map(h => (
                <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lowStockProducts.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">All products are well stocked!</td></tr>
            )}
            {lowStockProducts.map(p => (
              <tr key={p.id} className="border-b border-border/50">
                <td className="py-3 px-4 font-medium text-foreground">{p.name}</td>
                <td className="py-3 px-4 font-mono text-muted-foreground">{p.sku}</td>
                <td className="py-3 px-4">{p.stock}</td>
                <td className="py-3 px-4">{p.min_stock}</td>
                <td className="py-3 px-4"><span className={p.stock === 0 ? "status-out-of-stock" : "status-low-stock"}>{p.stock === 0 ? "Out of Stock" : "Low Stock"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
