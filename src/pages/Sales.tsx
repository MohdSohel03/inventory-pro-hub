import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Trash2, ShoppingCart, Download, CalendarIcon, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV } from "@/lib/export-csv";
import { useAppSettings } from "@/contexts/AppSettingsContext";

const Sales = () => {
  const { user } = useAuth();
  const { adminId, isStaff } = useRole();
  const { toast } = useToast();
  const { formatCurrency, currencySymbol, formatDate } = useAppSettings();
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [showAdd, setShowAdd] = useState(false);
  const [customer, setCustomer] = useState("");
  const [payment, setPayment] = useState("Cash");
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState([{ product: "", quantity: 1, price: 0 }]);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const [salesRes, prodsRes] = await Promise.all([
      supabase.from("sales").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("*"),
    ]);
    if (salesRes.data) setSales(salesRes.data);
    if (prodsRes.data) setProducts(prodsRes.data);
  };

  useEffect(() => { fetchData(); }, [user]);

  const filtered = sales.filter(s => {
    const matchesSearch = s.customer.toLowerCase().includes(search.toLowerCase()) ||
      s.date?.includes(search) ||
      s.payment?.toLowerCase().includes(search.toLowerCase());
    const saleDate = s.date ? new Date(s.date) : null;
    const matchesFrom = !dateFrom || (saleDate && saleDate >= new Date(dateFrom.setHours(0, 0, 0, 0)));
    const matchesTo = !dateTo || (saleDate && saleDate <= new Date(dateTo.setHours(23, 59, 59, 999)));
    return matchesSearch && matchesFrom && matchesTo;
  });
  const hasDateFilter = dateFrom || dateTo;
  const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0);
  const total = subtotal * (1 - discount / 100);

  const addItem = () => setItems([...items, { product: "", quantity: 1, price: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: any) => setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const handleSave = async () => {
    if (!user) return;

    // Validation
    if (!customer.trim()) {
      toast({ title: "Missing customer", description: "Please enter a customer name", variant: "destructive" });
      return;
    }
    const validItems = items.filter(i => i.product && i.quantity > 0 && i.price > 0);
    if (validItems.length === 0) {
      toast({ title: "No products", description: "Add at least one product with quantity and price", variant: "destructive" });
      return;
    }

    setSaving(true);
    const effectiveUserId = isStaff && adminId ? adminId : user.id;
    const { error } = await supabase.from("sales").insert({
      user_id: effectiveUserId,
      date: new Date().toISOString().split("T")[0],
      customer: customer.trim(),
      items: validItems.length,
      total: +total.toFixed(2),
      discount,
      payment,
      status: "Completed",
    });

    if (error) {
      setSaving(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Deduct stock for each sold product
    for (const item of validItems) {
      const product = products.find(p => p.name === item.product);
      if (product) {
        const newStock = Math.max(0, product.stock - item.quantity);
        await supabase.from("products").update({ stock: newStock, updated_at: new Date().toISOString() }).eq("id", product.id);
      }
    }

    setSaving(false);
    toast({ title: "Sale created!", description: `${formatCurrency(total)} sale to ${customer.trim()}` });
    setShowAdd(false);
    setCustomer("");
    setDiscount(0);
    setPayment("Cash");
    setItems([{ product: "", quantity: 1, price: 0 }]);
    fetchData();
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      toast({ title: "No data", description: "No sales to export", variant: "destructive" });
      return;
    }
    exportToCSV(filtered, `sales-${new Date().toISOString().slice(0, 10)}`, [
      { key: "date", label: "Date" },
      { key: "customer", label: "Customer" },
      { key: "items", label: "Items" },
      { key: "discount", label: "Discount (%)" },
      { key: "total", label: "Total (₹)" },
      { key: "payment", label: "Payment" },
      { key: "status", label: "Status" },
    ]);
    toast({ title: "Exported!", description: `${filtered.length} sales exported to CSV` });
  };

  return (
    <div className="p-3 sm:p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-end gap-2 mb-4">
        <Button onClick={handleExport} variant="outline" size="sm" className="sm:size-default"><Download className="w-4 h-4 mr-1 sm:mr-2" /><span className="hidden sm:inline">Export</span> CSV</Button>
        <Button onClick={() => setShowAdd(true)} size="sm" className="sm:size-default"><Plus className="w-4 h-4 mr-1 sm:mr-2" /><span>Create Sale</span></Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by customer, date, payment..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="w-4 h-4 mr-1" />
                {dateFrom ? format(dateFrom, "dd MMM yyyy") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground text-sm">–</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                <CalendarIcon className="w-4 h-4 mr-1" />
                {dateTo ? format(dateTo, "dd MMM yyyy") : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          {hasDateFilter && (
            <Button variant="ghost" size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
              <X className="w-4 h-4 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                {["Date", "Customer", "Items", "Discount", "Total", "Payment", "Status"].map(h => (
                  <th key={h} className="text-left py-2 sm:py-3 px-3 sm:px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <ShoppingCart className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">{search ? "No sales match your search" : "No sales yet. Create your first sale!"}</p>
                  </td>
                </tr>
              )}
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm">{s.date}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm">{s.customer}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4 text-center">{s.items}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4">{Number(s.discount)}%</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4 font-mono text-xs sm:text-sm">₹{Number(s.total).toLocaleString("en-IN")}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm">{s.payment}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4"><span className={s.status === "Completed" ? "status-in-stock" : "status-low-stock"}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Sale</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Customer <span className="text-destructive">*</span></Label>
                <Input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Customer name" />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={payment} onValueChange={setPayment}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Products <span className="text-destructive">*</span></Label>
                <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3 mr-1" />Add</Button>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => {
                  const selectedProduct = products.find(p => p.name === item.product);
                  return (
                    <div key={i}>
                      <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                        <div className="flex-1">
                          <Select value={item.product} onValueChange={v => { const p = products.find(x => x.name === v); updateItem(i, "product", v); if (p) updateItem(i, "price", Number(p.selling_price)); }}>
                            <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                            <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.name}>{p.name} (Stock: {p.stock})</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2 items-end">
                          <Input type="number" className="w-20" placeholder="Qty" min={1} value={item.quantity} onChange={e => updateItem(i, "quantity", +e.target.value)} />
                          <Input type="number" className="w-28" placeholder="Price" value={item.price} onChange={e => updateItem(i, "price", +e.target.value)} />
                          {items.length > 1 && <button onClick={() => removeItem(i)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>}
                        </div>
                      </div>
                      {selectedProduct && item.quantity > selectedProduct.stock && (
                        <p className="text-xs text-destructive mt-1">⚠ Only {selectedProduct.stock} in stock</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div><Label>Discount (%)</Label><Input type="number" value={discount} onChange={e => setDiscount(+e.target.value)} className="w-28" min={0} max={100} /></div>
            <div className="bg-muted/30 rounded-lg p-3 border border-border">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>Discount ({discount}%)</span>
                  <span>-₹{(subtotal * discount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-foreground mt-2 pt-2 border-t border-border">
                <span>Total</span>
                <span>₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowAdd(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">{saving ? "Creating..." : "Create Sale"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;