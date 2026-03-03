import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";

const emptyProduct = { name: "", sku: "", category: "Electronics", stock: 0, cost_price: 0, selling_price: 0, min_stock: 0, location: "" };

const Products = () => {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const perPage = 5;

  const fetchProducts = async () => {
    if (!user) return;
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) setProducts(data);
  };

  useEffect(() => { fetchProducts(); }, [user]);

  const getStatus = (p: any) => p.stock === 0 ? "Out of Stock" : p.stock <= p.min_stock ? "Low Stock" : "In Stock";

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || p.category === catFilter;
    const matchStatus = statusFilter === "all" || getStatus(p) === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const categories = [...new Set(products.map(p => p.category))];

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    if (editProduct) {
      const { error } = await supabase.from("products").update({ ...form, updated_at: new Date().toISOString() }).eq("id", editProduct.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const { error } = await supabase.from("products").insert({ ...form, user_id: user.id });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setSaving(false);
    setShowAdd(false);
    setEditProduct(null);
    setForm(emptyProduct);
    fetchProducts();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("products").delete().eq("id", deleteId);
    setDeleteId(null);
    fetchProducts();
  };

  const openEdit = (p: any) => {
    setForm({ name: p.name, sku: p.sku, category: p.category, stock: p.stock, cost_price: Number(p.cost_price), selling_price: Number(p.selling_price), min_stock: p.min_stock, location: p.location || "" });
    setEditProduct(p);
    setShowAdd(true);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-end mb-4">
        {isAdmin && (
          <Button onClick={() => { setForm(emptyProduct); setEditProduct(null); setShowAdd(true); }}><Plus className="w-4 h-4 mr-2" />Add Product</Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products, SKUs..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={catFilter} onValueChange={v => { setCatFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="In Stock">In Stock</SelectItem>
            <SelectItem value="Low Stock">Low Stock</SelectItem>
            <SelectItem value="Out of Stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Product", "SKU", "Category", "Qty", "Cost", "Price", "Min Stock", "Status", "Location", ...(isAdmin ? ["Actions"] : [])].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={10} className="py-8 text-center text-muted-foreground">No products yet. Add your first product!</td></tr>
              )}
              {paginated.map(p => {
                const status = getStatus(p);
                return (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">{p.name}</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">{p.sku}</td>
                    <td className="py-3 px-4">{p.category}</td>
                    <td className="py-3 px-4 text-center">{p.stock}</td>
                    <td className="py-3 px-4 font-mono">₹{Number(p.cost_price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 font-mono">₹{Number(p.selling_price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-center">{p.min_stock}</td>
                    <td className="py-3 px-4">
                      <span className={status === "In Stock" ? "status-in-stock" : status === "Low Stock" ? "status-low-stock" : "status-out-of-stock"}>
                        • {status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{p.location}</td>
                    {isAdmin && (
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Showing {(page-1)*perPage+1}-{Math.min(page*perPage, filtered.length)} of {filtered.length}</p>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i+1)} className={`px-3 py-1 rounded text-sm ${page === i+1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>{i+1}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={v => { if (!v) { setShowAdd(false); setEditProduct(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2"><Label>Product Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div><Label>SKU</Label><Input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} /></div>
            <div><Label>Category</Label><Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} /></div>
            <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={e => setForm({...form, stock: +e.target.value})} /></div>
            <div><Label>Min Stock Alert</Label><Input type="number" value={form.min_stock} onChange={e => setForm({...form, min_stock: +e.target.value})} /></div>
            <div><Label>Cost Price</Label><Input type="number" value={form.cost_price} onChange={e => setForm({...form, cost_price: +e.target.value})} /></div>
            <div><Label>Selling Price</Label><Input type="number" value={form.selling_price} onChange={e => setForm({...form, selling_price: +e.target.value})} /></div>
            <div className="col-span-2"><Label>Location</Label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setEditProduct(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editProduct ? "Update" : "Add"} Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this product? This action cannot be undone.</AlertDialogDescription>
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

export default Products;
