import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, ScanLine, ImageIcon, LayoutGrid, List } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { BarcodeScanner } from "@/components/products/BarcodeScanner";
import { ProductImageUpload } from "@/components/products/ProductImageUpload";

const emptyProduct = { name: "", sku: "", category: "Electronics", stock: 0, cost_price: 0, selling_price: 0, min_stock: 0, location: "", image_url: null as string | null, barcode: "" };

const generateSKU = (category: string, existingCount: number) => {
  const prefix = category.slice(0, 3).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const seq = String(existingCount + 1).padStart(3, "0");
  return `${prefix}-${timestamp}${seq}`;
};

const Products = () => {
  const { user } = useAuth();
  const { formatCurrency } = useAppSettings();
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
  const [showScanner, setShowScanner] = useState(false);
  const [showFormScanner, setShowFormScanner] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const perPage = viewMode === "grid" ? 9 : 5;

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
  const locations = [...new Set(products.map(p => p.location).filter(Boolean))];
  const [customCategory, setCustomCategory] = useState(false);
  const [customLocation, setCustomLocation] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload = { ...form };
    // Auto-generate SKU for new products if empty
    if (!editProduct && !payload.sku) {
      payload.sku = generateSKU(payload.category, products.length);
    }
    if (editProduct) {
      const { error } = await supabase.from("products").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editProduct.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const { error } = await supabase.from("products").insert({ ...payload, user_id: user.id });
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
    setForm({ name: p.name, sku: p.sku, category: p.category, stock: p.stock, cost_price: Number(p.cost_price), selling_price: Number(p.selling_price), min_stock: p.min_stock, location: p.location || "", image_url: p.image_url || null, barcode: p.barcode || "" });
    setEditProduct(p);
    setShowAdd(true);
  };

  const handleScanResult = (code: string) => {
    setSearch(code);
    setPage(1);
    const found = products.find(p => p.barcode === code || p.sku.toLowerCase() === code.toLowerCase());
    if (found) {
      toast({ title: "Product Found", description: `Found: ${found.name} (${found.sku})` });
    } else {
      toast({ title: "No Match", description: `No product found for barcode: ${code}. You can add it as a new product.`, variant: "destructive" });
    }
  };

  const handleBarcodeScanInForm = (code: string) => {
    setForm(f => ({ ...f, barcode: code }));
    setShowFormScanner(false);
    toast({ title: "Barcode scanned", description: `Barcode: ${code}` });
  };

  return (
    <div className="p-3 sm:p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-end mb-4 opacity-0 animate-fade-in">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Button size="sm" variant="outline" onClick={() => setShowScanner(true)}>
                <ScanLine className="w-4 h-4 mr-1 sm:mr-2" />Scan Product
              </Button>
              <Button size="sm" onClick={() => { setForm(emptyProduct); setEditProduct(null); setShowAdd(true); }}>
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />Add Product
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products, SKUs..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex gap-2">
          <Select value={catFilter} onValueChange={v => { setCatFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="In Stock">In Stock</SelectItem>
              <SelectItem value="Low Stock">Low Stock</SelectItem>
              <SelectItem value="Out of Stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => { setViewMode("grid"); setPage(1); }}
              className={`p-2 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setViewMode("list"); setPage(1); }}
              className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        Showing {filtered.length === 0 ? 0 : (page-1)*perPage+1}-{Math.min(page*perPage, filtered.length)} of {filtered.length} products
      </p>

      {/* Grid View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">No products yet. Add your first product!</div>
          )}
          {paginated.map((p, idx) => {
            const status = getStatus(p);
            return (
              <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group opacity-0 animate-fade-in-scale hover:-translate-y-1" style={{ animationDelay: `${200 + idx * 80}ms` }}>
                <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground/40" />
                    </div>
                  )}
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-md bg-background/80 backdrop-blur-sm hover:bg-background text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-md bg-background/80 backdrop-blur-sm hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      status === "In Stock" ? "bg-emerald-500/90 text-white" :
                      status === "Low Stock" ? "bg-amber-500/90 text-white" :
                      "bg-red-500/90 text-white"
                    }`}>
                      {status}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">{p.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">{p.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mb-3">SKU: {p.sku}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Quantity</p>
                      <p className="text-lg font-bold text-foreground">{p.stock}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(Number(p.selling_price))}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-card border border-border rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-border">
                  {["", "Product", "SKU", "Category", "Qty", "Cost", "Price", "Min", "Status", "Location", ...(isAdmin ? ["Actions"] : [])].map(h => (
                    <th key={h || "img"} className="text-left py-2 sm:py-3 px-3 sm:px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr><td colSpan={11} className="py-8 text-center text-muted-foreground">No products yet. Add your first product!</td></tr>
                )}
                {paginated.map((p, idx) => {
                  const status = getStatus(p);
                  return (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors opacity-0 animate-fade-in" style={{ animationDelay: `${250 + idx * 60}ms` }}>
                      <td className="py-2 sm:py-3 px-3 sm:px-4">
                        <div className="w-10 h-10 rounded-lg bg-muted border border-border overflow-hidden flex items-center justify-center">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </td>
                      <td className="py-2 sm:py-3 px-3 sm:px-4 font-medium text-foreground">{p.name}</td>
                      <td className="py-2 sm:py-3 px-3 sm:px-4 font-mono text-muted-foreground text-xs">{p.sku}</td>
                      <td className="py-2 sm:py-3 px-3 sm:px-4">{p.category}</td>
                      <td className="py-2 sm:py-3 px-3 sm:px-4 text-center">{p.stock}</td>
                      <td className="py-2 sm:py-3 px-3 sm:px-4 font-mono text-xs">{formatCurrency(Number(p.cost_price))}</td>
                      <td className="py-2 sm:py-3 px-3 sm:px-4 font-mono text-xs">{formatCurrency(Number(p.selling_price))}</td>
                      <td className="py-2 sm:py-3 px-3 sm:px-4 text-center">{p.min_stock}</td>
                      <td className="py-2 sm:py-3 px-3 sm:px-4">
                        <span className={status === "In Stock" ? "status-in-stock" : status === "Low Stock" ? "status-low-stock" : "status-out-of-stock"}>
                          • {status}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-3 sm:px-4 text-muted-foreground text-xs">{p.location}</td>
                      {isAdmin && (
                        <td className="py-2 sm:py-3 px-3 sm:px-4">
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
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i+1)} className={`px-3 py-1 rounded text-sm ${page === i+1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>{i+1}</button>
          ))}
        </div>
      )}

      {/* Add/Edit Product Dialog */}
      <Dialog open={showAdd} onOpenChange={v => { if (!v) { setShowAdd(false); setEditProduct(null); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <ProductImageUpload imageUrl={form.image_url} onImageChange={(url) => setForm({ ...form, image_url: url })} />
            <div className="sm:col-span-2"><Label>Product Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div>
              <Label>SKU <span className="text-xs text-muted-foreground font-normal">{!editProduct ? "(auto-generated if empty)" : ""}</span></Label>
              <Input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder={!editProduct ? "Leave blank to auto-generate" : ""} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={categories.includes(form.category) ? form.category : "__custom__"} onValueChange={v => { if (v !== "__custom__") setForm({...form, category: v}); }}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  <SelectItem value="__custom__">+ New category</SelectItem>
                </SelectContent>
              </Select>
              {!categories.includes(form.category) && (
                <Input className="mt-2" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Enter new category name" />
              )}
            </div>
            <div className="sm:col-span-2">
              <Label>Barcode</Label>
              <div className="flex gap-2">
                <Input value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} placeholder="Scan or enter barcode" className="flex-1" />
                <Button type="button" variant="outline" size="sm" onClick={() => setShowFormScanner(true)}>
                  <ScanLine className="w-4 h-4 mr-1" />Scan
                </Button>
              </div>
            </div>
            <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={e => setForm({...form, stock: +e.target.value})} /></div>
            <div><Label>Min Stock Alert</Label><Input type="number" value={form.min_stock} onChange={e => setForm({...form, min_stock: +e.target.value})} /></div>
            <div><Label>Cost Price</Label><Input type="number" value={form.cost_price} onChange={e => setForm({...form, cost_price: +e.target.value})} /></div>
            <div><Label>Selling Price</Label><Input type="number" value={form.selling_price} onChange={e => setForm({...form, selling_price: +e.target.value})} /></div>
            <div className="sm:col-span-2"><Label>Location</Label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => { setShowAdd(false); setEditProduct(null); }} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">{saving ? "Saving..." : editProduct ? "Update" : "Add"} Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
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

      {/* Barcode Scanner - Search */}
      {isAdmin && (
        <BarcodeScanner
          open={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={handleScanResult}
        />
      )}

      {/* Barcode Scanner - Form */}
      <BarcodeScanner
        open={showFormScanner}
        onClose={() => setShowFormScanner(false)}
        onScan={handleBarcodeScanInForm}
      />
    </div>
  );
};

export default Products;
