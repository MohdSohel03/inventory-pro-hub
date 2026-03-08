import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown, Package } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend, Area, AreaChart
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV } from "@/lib/export-csv";

const PERIOD_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="font-semibold" style={{ color: entry.color }}>
          {entry.name}: ₹{Number(entry.value).toLocaleString("en-IN")}
        </p>
      ))}
    </div>
  );
};

const StockTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-muted-foreground">
          {entry.name}: <span className="font-semibold text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

const Reports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [period, setPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("sales").select("*"),
      supabase.from("purchases").select("*"),
      supabase.from("products").select("*"),
    ]).then(([s, p, pr]) => {
      if (s.data) setSales(s.data);
      if (p.data) setPurchases(p.data);
      if (pr.data) setProducts(pr.data);
    });
  }, [user]);

  // Auto-set date range when period changes
  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    if (period === "daily") {
      const from = new Date(today);
      from.setDate(from.getDate() - 7);
      setStartDate(from.toISOString().slice(0, 10));
    } else if (period === "weekly") {
      const from = new Date(today);
      from.setDate(from.getDate() - 28);
      setStartDate(from.toISOString().slice(0, 10));
    } else {
      const from = new Date(today);
      from.setMonth(from.getMonth() - 6);
      setStartDate(from.toISOString().slice(0, 10));
    }
    setEndDate(todayStr);
  }, [period]);

  // Filter sales and purchases by date range
  const filteredSales = useMemo(() => {
    return sales.filter(s => s.date >= startDate && s.date <= endDate);
  }, [sales, startDate, endDate]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => p.date >= startDate && p.date <= endDate);
  }, [purchases, startDate, endDate]);

  const totalSales = filteredSales.reduce((s, d) => s + Number(d.total), 0);
  const totalPurchases = filteredPurchases.reduce((s, d) => s + Number(d.total), 0);
  const profit = totalSales - totalPurchases;

  // Sales & Purchases Trend grouped by period
  const trendData = useMemo(() => {
    const getKey = (date: string) => {
      if (period === "daily") return date;
      if (period === "weekly") {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d);
        monday.setDate(diff);
        return monday.toISOString().slice(0, 10);
      }
      return date.slice(0, 7);
    };

    const grouped: Record<string, { sales: number; purchases: number }> = {};

    filteredSales.forEach(s => {
      const key = getKey(s.date);
      if (!grouped[key]) grouped[key] = { sales: 0, purchases: 0 };
      grouped[key].sales += Number(s.total);
    });

    filteredPurchases.forEach(p => {
      const key = getKey(p.date);
      if (!grouped[key]) grouped[key] = { sales: 0, purchases: 0 };
      grouped[key].purchases += Number(p.total);
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, data]) => {
        const displayLabel = period === "monthly"
          ? new Date(label + "-01").toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
          : period === "weekly"
            ? `W ${new Date(label).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`
            : new Date(label).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
        return { label: displayLabel, ...data };
      });
  }, [filteredSales, filteredPurchases, period]);

  // Top selling products based on filtered sales (count items sold per product name)
  const productSalesMap = useMemo(() => {
    const map: Record<string, number> = {};
    // Sales table stores total and items count, but not individual product names
    // So we show products sorted by stock with selling context
    return map;
  }, [filteredSales]);

  // Product Stock Levels - show all products sorted by stock (ascending = most critical first)
  const stockData = useMemo(() => {
    return [...products]
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 8)
      .map(p => ({
        name: p.name.length > 15 ? p.name.slice(0, 15) + "…" : p.name,
        stock: p.stock,
        minStock: p.min_stock,
        isLow: p.stock <= p.min_stock,
      }));
  }, [products]);

  // Low stock products (always relevant - not date filtered since stock is current state)
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock <= p.min_stock);
  }, [products]);

  const handleExportSales = () => {
    if (filteredSales.length === 0) {
      toast({ title: "No data", description: "No sales in this period to export", variant: "destructive" });
      return;
    }
    exportToCSV(filteredSales, `sales-report-${startDate}-to-${endDate}`, [
      { key: "date", label: "Date" },
      { key: "customer", label: "Customer" },
      { key: "items", label: "Items" },
      { key: "discount", label: "Discount (%)" },
      { key: "total", label: "Total (₹)" },
      { key: "payment", label: "Payment" },
      { key: "status", label: "Status" },
    ]);
    toast({ title: "Exported!", description: `${filteredSales.length} sales exported to CSV` });
  };

  const handleExportLowStock = () => {
    if (lowStockProducts.length === 0) {
      toast({ title: "No data", description: "No low stock products to export", variant: "destructive" });
      return;
    }
    exportToCSV(lowStockProducts, `low-stock-${new Date().toISOString().slice(0, 10)}`, [
      { key: "name", label: "Product" },
      { key: "sku", label: "SKU" },
      { key: "stock", label: "Current Stock" },
      { key: "min_stock", label: "Min Stock" },
      { key: "category", label: "Category" },
      { key: "location", label: "Location" },
    ]);
    toast({ title: "Exported!", description: `${lowStockProducts.length} products exported to CSV` });
  };

  return (
    <div className="p-3 sm:p-6 max-w-[1400px] mx-auto">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
        <div className="flex bg-card border border-border rounded-lg overflow-hidden w-full sm:w-auto">
          {["daily", "weekly", "monthly"].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium capitalize transition-colors ${
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Label className="text-sm shrink-0">From</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full sm:w-40" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Label className="text-sm shrink-0">To</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full sm:w-40" />
          </div>
        </div>
        <div className="sm:ml-auto">
          <Button onClick={handleExportSales} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Export Sales</span> CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Sales</p>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">₹{totalSales.toLocaleString("en-IN")}</p>
          <p className="text-xs text-muted-foreground mt-1">{filteredSales.length} transactions</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Purchases</p>
            <TrendingDown className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">₹{totalPurchases.toLocaleString("en-IN")}</p>
          <p className="text-xs text-muted-foreground mt-1">{filteredPurchases.length} orders</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Net Profit</p>
            <Package className="w-4 h-4 text-primary" />
          </div>
          <p className={`text-xl sm:text-2xl font-bold mt-1 ${profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
            {profit >= 0 ? "+" : ""}₹{profit.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalSales > 0 ? `${((profit / totalSales) * 100).toFixed(1)}% margin` : "No data"}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-6">
        {/* Sales & Purchases Trend */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground text-sm sm:text-base">
              Sales & Purchases Trend
              <span className="text-muted-foreground font-normal text-xs ml-2">({PERIOD_LABELS[period]})</span>
            </h3>
          </div>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="purchasesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                  width={55}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Sales"
                  stroke="hsl(var(--chart-1))"
                  fill="url(#salesGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="purchases"
                  name="Purchases"
                  stroke="hsl(var(--chart-2))"
                  fill="url(#purchasesGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
              <TrendingUp className="w-8 h-8 opacity-30" />
              No data for this period
            </div>
          )}
        </div>

        {/* Product Stock Levels */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Product Stock Levels</h3>
            <span className="text-xs text-muted-foreground">{products.length} products</span>
          </div>
          {stockData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stockData} layout="vertical" margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  width={90}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<StockTooltip />} />
                <Bar dataKey="stock" name="Current Stock" radius={[0, 4, 4, 0]} barSize={16}>
                  {stockData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.isLow ? "hsl(var(--destructive))" : "hsl(var(--chart-1))"}
                      opacity={entry.isLow ? 0.8 : 1}
                    />
                  ))}
                </Bar>
                <Bar dataKey="minStock" name="Min Required" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} barSize={16} opacity={0.3} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
              <Package className="w-8 h-8 opacity-30" />
              No products yet
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Table */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Low Stock Products</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lowStockProducts.length} product{lowStockProducts.length !== 1 ? "s" : ""} below minimum stock level
            </p>
          </div>
          {lowStockProducts.length > 0 && (
            <Button onClick={handleExportLowStock} variant="ghost" size="sm" className="text-xs h-7">
              <Download className="w-3 h-3 mr-1" />Export
            </Button>
          )}
        </div>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-border">
                {["Product", "SKU", "Stock", "Min", "Category", "Status"].map(h => (
                  <th key={h} className="text-left py-2 sm:py-3 px-3 sm:px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    ✅ All products are well stocked!
                  </td>
                </tr>
              )}
              {lowStockProducts.map(p => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-2 sm:py-3 px-3 sm:px-4 font-medium text-foreground">{p.name}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4 font-mono text-muted-foreground text-xs">{p.sku}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4 font-semibold">{p.stock}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4 text-muted-foreground">{p.min_stock}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4 text-xs">{p.category}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4">
                    <span className={p.stock === 0 ? "status-out-of-stock" : "status-low-stock"}>
                      {p.stock === 0 ? "Out of Stock" : "Low Stock"}
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

export default Reports;
