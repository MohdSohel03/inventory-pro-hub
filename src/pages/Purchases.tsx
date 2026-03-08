import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Navigate } from "react-router-dom";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { useAppSettings } from "@/contexts/AppSettingsContext";

const Purchases = () => {
  const { user } = useAuth();
  const { isAdmin, isStaff } = useRole();
  const { toast } = useToast();
  const { formatCurrency, formatDate } = useAppSettings();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [supplier, setSupplier] = useState("");
  const [status, setStatus] = useState("Pending");
  const [editItemsCount, setEditItemsCount] = useState(0);
  const [editTotal, setEditTotal] = useState(0);
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

  if (isStaff) {
    return <Navigate to="/" replace />;
  }

  const filtered = purchases.filter(p => p.supplier_name.toLowerCase().includes(search.toLowerCase()));
  const total = items.reduce((s, i) => s + i.quantity * i.cost, 0);

  const addItem = () => setItems([...items, { product: "", quantity: 1, cost: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: any) => setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const openAdd = () => {
    setEditingId(null);
    setSupplier("");
    setStatus("Pending");
    setItems([{ product: "", quantity: 1, cost: 0 }]);
    setShowDialog(true);
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setSupplier(p.supplier_name);
    setStatus(p.status);
    setEditItemsCount(p.items);
    setEditTotal(Number(p.total));
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    if (editingId) {
      const { error } = await supabase.from("purchases").update({
        supplier_name: supplier,
        items: editItemsCount,
        total: editTotal,
        status,
      }).eq("id", editingId);
      setSaving(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setShowDialog(false);
        setEditingId(null);
        fetchData();
        toast({ title: "Purchase updated successfully" });
      }
    } else {
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
        setShowDialog(false);
        setSupplier("");
        setItems([{ product: "", quantity: 1, cost: 0 }]);
        fetchData();
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("purchases").delete().eq("id", deleteId);
    setDeleteId(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchData();
      toast({ title: "Purchase deleted" });
    }
  };

  return (
    <div className="p-3 sm:p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-end mb-4 opacity-0 animate-fade-in">
        {isAdmin && <Button size="sm" className="sm:size-default" onClick={openAdd}><Plus className="w-4 h-4 mr-1 sm:mr-2" />Create Purchase</Button>}
      </div>

      <div className="relative max-w-md mb-4 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search purchases..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-border">
                {["Supplier", "Date", "Items", "Total", "Status", ...(isAdmin ? ["Actions"] : [])].map(h => (
                  <th key={h} className="text-left py-2 sm:py-3 px-3 sm:px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={isAdmin ? 6 : 5} className="py-8 text-center text-muted-foreground">No purchases yet.</td></tr>
              )}
              {filtered.map((p, idx) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors opacity-0 animate-fade-in" style={{ animationDelay: `${250 + idx * 50}ms` }}>
                  <td className="py-2 sm:py-3 px-3 sm:px-4 font-medium text-foreground text-xs sm:text-sm">{p.supplier_name}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm">{formatDate(p.date)}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4 text-center">{p.items}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4 font-mono text-xs sm:text-sm">{formatCurrency(Number(p.total))}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4"><span className={p.status === "Received" ? "status-in-stock" : "status-low-stock"}>{p.status}</span></td>
                  {isAdmin && (
                    <td className="py-2 sm:py-3 px-3 sm:px-4">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Purchase Order" : "Create Purchase Order"}</DialogTitle></DialogHeader>
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
            {editingId && (
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Received">Received</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {editingId ? (
              <>
                <div>
                  <Label>Items Count</Label>
                  <Input type="number" value={editItemsCount} onChange={e => setEditItemsCount(+e.target.value)} />
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <Input type="number" value={editTotal} onChange={e => setEditTotal(+e.target.value)} />
                </div>
                <div className="text-right text-lg font-bold text-foreground">Total: {formatCurrency(editTotal)}</div>
              </>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2"><Label>Products</Label><Button variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3 mr-1" />Add</Button></div>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex flex-col sm:flex-row gap-2 sm:items-end">
                      <div className="flex-1">
                        <Select value={item.product} onValueChange={v => { const p = products.find(x => x.name === v); updateItem(i, "product", v); if (p) updateItem(i, "cost", Number(p.cost_price)); }}>
                          <SelectTrigger><SelectValue placeholder="Product" /></SelectTrigger>
                          <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 items-end">
                        <Input type="number" className="w-20" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, "quantity", +e.target.value)} />
                        <Input type="number" className="w-28" placeholder="Cost" value={item.cost} onChange={e => updateItem(i, "cost", +e.target.value)} />
                        {items.length > 1 && <button onClick={() => removeItem(i)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-right text-lg font-bold text-foreground mt-4">Total: {formatCurrency(total)}</div>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">{saving ? "Saving..." : editingId ? "Update Purchase" : "Create Purchase"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Purchases;
