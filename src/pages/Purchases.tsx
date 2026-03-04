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

const Purchases = () => {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [supplier, setSupplier] = useState("");
  const [items, setItems] = useState([{ product: "", quantity: 1, cost: 0 }]);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const [purch, suppl, prods] = await Promise.all([
      supabase.from("purchases").select("*").order("created_at", { ascending: false }),
      supabase.from("suppliers").select("*"),
      supabase.from("products").select("*"),
    ]);
    if (purch.data) setPurchases(purch.data);
    if (suppl.data) setSuppliers(suppl.data);
    if (prods.data) setProducts(prods.data);
  };

  useEffect(() => { fetchData(); }, [user]);

  const filtered = purchases.filter(p => p.supplier_name.toLowerCase().includes(search.toLowerCase()));
  const total = items.reduce((s, i) => s + i.quantity * i.cost, 0);

  const addItem = () => setItems([...items, { product: "", quantity: 1, cost: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: any) => setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("purchases").insert({
      user_id: user.id,
      supplier_name: supplier,
      date: new Date().toISOString().split("T")[0],
      items: items.length,
      total,
      status: "Pending",
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setShowAdd(false);
      setSupplier("");
      setItems([{ product: "", quantity: 1, cost: 0 }]);
      fetchData();
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-end mb-4">
        {isAdmin && <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" />Create Purchase</Button>}
      </div>

      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search purchases..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Supplier", "Date", "Items", "Total", "Status"].map(h => (
                <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No purchases yet.</td></tr>
            )}
            {filtered.map(p => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 font-medium text-foreground">{p.supplier_name}</td>
                <td className="py-3 px-4">{p.date}</td>
                <td className="py-3 px-4 text-center">{p.items}</td>
                <td className="py-3 px-4 font-mono">₹{Number(p.total).toLocaleString("en-IN")}</td>
                <td className="py-3 px-4"><span className={p.status === "Received" ? "status-in-stock" : "status-low-stock"}>{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Supplier</Label>
              <Select value={supplier} onValueChange={setSupplier}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2"><Label>Products</Label><Button variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3 mr-1" />Add</Button></div>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Select value={item.product} onValueChange={v => { const p = products.find(x => x.name === v); updateItem(i, "product", v); if (p) updateItem(i, "cost", Number(p.cost_price)); }}>
                        <SelectTrigger><SelectValue placeholder="Product" /></SelectTrigger>
                        <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <Input type="number" className="w-20" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, "quantity", +e.target.value)} />
                    <Input type="number" className="w-28" placeholder="Cost" value={item.cost} onChange={e => updateItem(i, "cost", +e.target.value)} />
                    {items.length > 1 && <button onClick={() => removeItem(i)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-right text-lg font-bold text-foreground">Total: ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Creating..." : "Create Purchase"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Purchases;
