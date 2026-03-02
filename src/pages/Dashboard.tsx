import { Package, AlertTriangle, DollarSign, ShoppingCart, TrendingUp, Layers } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { mockSalesTrend, mockCategoryDistribution, mockStockStatus, mockProducts, mockSales } from "@/lib/mock-data";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";

const topProducts = [
  { name: "MacBook Pro 16\"", sold: 120, revenue: 299998.80 },
  { name: "Wireless Keyboard", sold: 85, revenue: 6799.15 },
  { name: "USB-C Hub", sold: 64, revenue: 2943.36 },
  { name: "Webcam HD Pro", sold: 42, revenue: 6299.58 },
  { name: "Desk Lamp LED", sold: 38, revenue: 2279.62 },
];

const Dashboard = () => {
  const lowStockCount = mockProducts.filter(p => p.stock <= p.min_stock).length;
  const totalValue = mockProducts.reduce((s, p) => s + p.stock * p.selling_price, 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader title="Dashboard" subtitle="Manage your inventory in real-time" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard title="Total Products" value={mockProducts.length} subtitle="In catalog" icon={<Package className="w-5 h-5" />} />
        <StatCard title="Low Stock Alerts" value={lowStockCount} subtitle="Items need restocking" icon={<AlertTriangle className="w-5 h-5" />} iconColor="text-warning" />
        <StatCard title="Total Value" value={`$${totalValue.toLocaleString()}`} trend="↑ 8% from last month" icon={<DollarSign className="w-5 h-5" />} />
        <StatCard title="Total Sales" value={mockSales.length} trend="↑ 12% from last month" icon={<ShoppingCart className="w-5 h-5" />} />
        <StatCard title="Profit Margin" value="24.5%" subtitle="Avg. across products" icon={<TrendingUp className="w-5 h-5" />} iconColor="text-success" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Sales Trend */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Sales & Purchases Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={mockSalesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 20%)" />
              <XAxis dataKey="month" stroke="hsl(215 15% 55%)" fontSize={12} />
              <YAxis stroke="hsl(215 15% 55%)" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                contentStyle={{ background: "hsl(220 18% 15%)", border: "1px solid hsl(220 13% 20%)", borderRadius: "8px", color: "hsl(210 20% 92%)" }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
              />
              <Line type="monotone" dataKey="sales" stroke="hsl(210 100% 50%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="purchases" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution Pie */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Category Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={mockCategoryDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                {mockCategoryDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(220 18% 15%)", border: "1px solid hsl(220 13% 20%)", borderRadius: "8px", color: "hsl(210 20% 92%)" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Stock Status Pie */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Stock Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={mockStockStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {mockStockStatus.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(220 18% 15%)", border: "1px solid hsl(220 13% 20%)", borderRadius: "8px", color: "hsl(210 20% 92%)" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products Bar */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Top Selling Products</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 20%)" />
              <XAxis type="number" stroke="hsl(215 15% 55%)" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="hsl(215 15% 55%)" fontSize={11} width={120} />
              <Tooltip contentStyle={{ background: "hsl(220 18% 15%)", border: "1px solid hsl(220 13% 20%)", borderRadius: "8px", color: "hsl(210 20% 92%)" }} />
              <Bar dataKey="sold" fill="hsl(210 100% 50%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-4">Recent Sales</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Date</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Customer</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Items</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Total</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Payment</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockSales.map((sale) => (
                <tr key={sale.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">{sale.date}</td>
                  <td className="py-3 px-4 font-medium text-foreground">{sale.customer}</td>
                  <td className="py-3 px-4 text-center">{sale.items}</td>
                  <td className="py-3 px-4 text-right font-mono">${sale.total.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">{sale.payment}</td>
                  <td className="py-3 px-4 text-center">
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
