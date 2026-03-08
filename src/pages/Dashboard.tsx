import { useState, useEffect } from "react";
import { Package, AlertTriangle, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const COLORS = ["hsl(210 100% 50%)", "hsl(142 71% 45%)", "hsl(38 92% 50%)", "hsl(280 65% 60%)", "hsl(0 72% 51%)"];

const Dashboard = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("products").select("*"),
      supabase.from("sales").select("*").order("date", { ascending: false }),
      supabase.from("purchases").select("*").order("date", { ascending: false }),
    ]).then(([p, s, pu]) => {
      if (p.data) setProducts(p.data);
      if (s.data) setSales(s.data);
      if (pu.data) setPurchases(pu.data);
    });
  }, [user]);

  const lowStockCount = products.filter(p => p.stock <= p.min_stock).length;
  const totalValue = products.reduce((s, p) => s + p.stock * Number(p.selling_price), 0);
  const totalSalesAmount = sales.reduce((s, sale) => s + Number(sale.total), 0);
  const totalPurchasesAmount = purchases.reduce((s, p) => s + Number(p.total), 0);
  const profitMargin = totalSalesAmount > 0 ? (((totalSalesAmount - totalPurchasesAmount) / totalSalesAmount) * 100).toFixed(1) : "0";

  // Category distribution from products
  const catMap: Record<string, number> = {};
  products.forEach(p => { catMap[p.category] = (catMap[p.category] || 0) + 1; });
  const categoryDistribution = Object.entries(catMap).map(([name, value], i) => ({ name, value, fill: COLORS[i % COLORS.length] }));

  // Stock status
  const inStock = products.filter(p => p.stock > p.min_stock).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.min_stock).length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const stockStatus = [
    { name: "In Stock", value: inStock, fill: "hsl(142 71% 45%)" },
    { name: "Low Stock", value: lowStock, fill: "hsl(38 92% 50%)" },
    { name: "Out of Stock", value: outOfStock, fill: "hsl(0 72% 51%)" },
  ].filter(s => s.value > 0);

  // Sales trend by month
  const salesByMonth: Record<string, { sales: number; purchases: number }> = {};
  sales.forEach(s => {
    const m = s.date?.slice(0, 7);
    if (m) { salesByMonth[m] = salesByMonth[m] || { sales: 0, purchases: 0 }; salesByMonth[m].sales += Number(s.total); }
  });
  purchases.forEach(p => {
    const m = p.date?.slice(0, 7);
    if (m) { salesByMonth[m] = salesByMonth[m] || { sales: 0, purchases: 0 }; salesByMonth[m].purchases += Number(p.total); }
  });
  const salesTrend = Object.entries(salesByMonth).sort().slice(-6).map(([month, d]) => ({ month, ...d }));

  // Top products by sales mentions
  const topProducts = products.slice(0, 5).map(p => ({ name: p.name, stock: p.stock }));

  return (
    <div className="p-3 sm:p-6 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mb-6">
        <StatCard title="Total Products" value={products.length} subtitle="In catalog" icon={<Package className="w-4 h-4 sm:w-5 sm:h-5" />} />
        <StatCard title="Low Stock Alerts" value={lowStockCount} subtitle="Need restocking" icon={<AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />} iconColor="text-warning" />
        <StatCard title="Total Value" value={`₹${totalValue.toLocaleString("en-IN")}`} icon={<DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />} />
        <StatCard title="Total Sales" value={sales.length} subtitle={`₹${totalSalesAmount.toLocaleString("en-IN")}`} icon={<ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />} />
        <StatCard title="Profit Margin" value={`${profitMargin}%`} subtitle="Avg. across products" icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />} iconColor="text-success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4 sm:p-5">
          <h3 className="font-semibold text-foreground mb-4 text-sm sm:text-base">Sales & Purchases Trend</h3>
          {salesTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} tick={{ fontSize: 10 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => `₹${v / 1000}k`} width={50} />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="hsl(210 100% 50%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="purchases" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">Add sales and purchases to see trends</div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <h3 className="font-semibold text-foreground mb-4 text-sm sm:text-base">Category Distribution</h3>
          {categoryDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {categoryDistribution.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">Add products to see distribution</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <h3 className="font-semibold text-foreground mb-4 text-sm sm:text-base">Stock Status</h3>
          {stockStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stockStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                  {stockStatus.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">Add products to see stock status</div>
          )}
        </div>

        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4 sm:p-5">
          <h3 className="font-semibold text-foreground mb-4 text-sm sm:text-base">Product Stock Levels</h3>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} width={80} />
                <Tooltip />
                <Bar dataKey="stock" fill="hsl(210 100% 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">Add products to see stock levels</div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
        <h3 className="font-semibold text-foreground mb-4 text-sm sm:text-base">Recent Sales</h3>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[550px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-muted-foreground font-medium text-xs">Date</th>
                <th className="text-left py-2 sm:py-3 px-3 sm:px-4 text-muted-foreground font-medium text-xs">Customer</th>
                <th className="text-center py-2 sm:py-3 px-3 sm:px-4 text-muted-foreground font-medium text-xs">Items</th>
                <th className="text-right py-2 sm:py-3 px-3 sm:px-4 text-muted-foreground font-medium text-xs">Total</th>
                <th className="text-center py-2 sm:py-3 px-3 sm:px-4 text-muted-foreground font-medium text-xs">Payment</th>
                <th className="text-center py-2 sm:py-3 px-3 sm:px-4 text-muted-foreground font-medium text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No sales yet. Create your first sale!</td></tr>
              )}
              {sales.slice(0, 5).map((sale) => (
                <tr key={sale.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm">{sale.date}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm">{sale.customer}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4 text-center">{sale.items}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4 text-right font-mono text-xs sm:text-sm">₹{Number(sale.total).toLocaleString("en-IN")}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4 text-center text-xs sm:text-sm">{sale.payment}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4 text-center">
                    <span className={sale.status === "Completed" ? "status-in-stock" : "status-low-stock"}>
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
