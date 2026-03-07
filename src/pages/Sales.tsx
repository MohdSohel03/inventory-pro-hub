import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";

const Sales = () => {
  const { user } = useAuth();
  const { adminId, isStaff } = useRole();
  const { toast } = useToast();
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [customer, setCustomer] = useState("");
  const [payment, setPayment] = useState("Credit Card");
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

  const filtered = sales.filter(s => s.customer.toLowerCase().includes(search.toLowerCase()));
  const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0);
  const total = subtotal * (1 - discount / 100);

  const addItem = () => setItems([...items, { product: "", quantity: 1, price: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: any) => setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("sales").insert({
      user_id: user.id,
      date: new Date().toISOString().split("T")[0],
      customer,
      items: items.length,
      total: +total.toFixed(2),
      discount,
      payment,
      status: "Completed",
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setShowAdd(false);
      setCustomer("");
      setDiscount(0);
      setItems([{ product: "", quantity: 1, price: 0 }]);
      fetchData();
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-end mb-4">
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" />Create Sale</Button>
      </div>

      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search sales..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Date", "Customer", "Items", "Discount", "Total", "Payment", "Status"].map(h => (
                <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No sales yet.</td></tr>
            )}
            {filtered.map(s => (
              <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4">{s.date}</td>
                <td className="py-3 px-4 font-medium text-foreground">{s.customer}</td>
                <td className="py-3 px-4 text-center">{s.items}</td>
                <td className="py-3 px-4">{Number(s.discount)}%</td>
                <td className="py-3 px-4 font-mono">₹{Number(s.total).toLocaleString("en-IN")}</td>
                <td className="py-3 px-4">{s.payment}</td>
                <td className="py-3 px-4"><span className={s.status === "Completed" ? "status-in-stock" : "status-low-stock"}>{s.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Create Sale</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Customer</Label><Input value={customer} onChange={e => setCustomer(e.target.value)} /></div>
              <div>
                <Label>Payment Method</Label>
                <Select value={payment} onValueChange={setPayment}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2"><Label>Products</Label><Button variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3 mr-1" />Add</Button></div>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Select value={item.product} onValueChange={v => { const p = products.find(x => x.name === v); updateItem(i, "product", v); if (p) updateItem(i, "price", Number(p.selling_price)); }}>
                        <SelectTrigger><SelectValue placeholder="Product" /></SelectTrigger>
                        <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <Input type="number" className="w-20" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, "quantity", +e.target.value)} />
                    <Input type="number" className="w-28" placeholder="Price" value={item.price} onChange={e => updateItem(i, "price", +e.target.value)} />
                    {items.length > 1 && <button onClick={() => removeItem(i)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                ))}
              </div>
            </div>
            <div><Label>Discount (%)</Label><Input type="number" value={discount} onChange={e => setDiscount(+e.target.value)} className="w-28" /></div>
            <div className="flex justify-between text-foreground">
              <span>Subtotal: ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              <span className="text-lg font-bold">Total: ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Creating..." : "Create Sale"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;
