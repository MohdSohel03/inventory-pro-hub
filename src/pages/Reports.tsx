import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { mockSalesTrend, mockProducts } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const topSelling = [
  { name: "MacBook Pro 16\"", sold: 120 },
  { name: "Wireless Keyboard", sold: 85 },
  { name: "USB-C Hub", sold: 64 },
  { name: "Webcam HD Pro", sold: 42 },
  { name: "Desk Lamp LED", sold: 38 },
];

const Reports = () => {
  const [period, setPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-03-01");

  const totalSales = mockSalesTrend.reduce((s, d) => s + d.sales, 0);
  const totalPurchases = mockSalesTrend.reduce((s, d) => s + d.purchases, 0);
  const profit = totalSales - totalPurchases;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader title="Reports" subtitle="Analytics and insights" />

      {/* Controls */}
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

      {/* Profit Summary */}
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
          <p className="text-2xl font-bold text-success">₹{profit.toLocaleString("en-IN")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Sales Trend */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Sales Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={mockSalesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 20%)" />
              <XAxis dataKey="month" stroke="hsl(215 15% 55%)" fontSize={12} />
              <YAxis stroke="hsl(215 15% 55%)" fontSize={12} tickFormatter={v => `₹${v/1000}k`} />
              <Tooltip contentStyle={{ background: "hsl(220 18% 15%)", border: "1px solid hsl(220 13% 20%)", borderRadius: "8px", color: "hsl(210 20% 92%)" }} />
              <Line type="monotone" dataKey="sales" stroke="hsl(210 100% 50%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Selling */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Top Selling Products</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topSelling} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 20%)" />
              <XAxis type="number" stroke="hsl(215 15% 55%)" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="hsl(215 15% 55%)" fontSize={11} width={120} />
              <Tooltip contentStyle={{ background: "hsl(220 18% 15%)", border: "1px solid hsl(220 13% 20%)", borderRadius: "8px", color: "hsl(210 20% 92%)" }} />
              <Bar dataKey="sold" fill="hsl(210 100% 50%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low Stock Products */}
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
            {mockProducts.filter(p => p.stock <= p.min_stock).map(p => (
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
