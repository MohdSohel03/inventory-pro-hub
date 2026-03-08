import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Navigate } from "react-router-dom";
import { Plus, Search, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";

const emptySupplier = { name: "", contact: "", email: "", phone: "", address: "" };

const Suppliers = () => {
  const { user } = useAuth();
  const { isAdmin, isStaff } = useRole();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptySupplier);
  const [saving, setSaving] = useState(false);

  const fetchSuppliers = async () => {
    if (!user) return;
    const { data } = await supabase.from("suppliers").select("*").order("created_at", { ascending: false });
    if (data) setSuppliers(data);
  };

  useEffect(() => { fetchSuppliers(); }, [user]);

  if (isStaff) {
    return <Navigate to="/" replace />;
  }

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contact || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("suppliers").insert({ ...form, user_id: user.id });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setShowAdd(false);
      setForm(emptySupplier);
      fetchSuppliers();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("suppliers").delete().eq("id", deleteId);
    setDeleteId(null);
    fetchSuppliers();
  };

  return (
    <div className="p-3 sm:p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-end mb-4 opacity-0 animate-fade-in">
        {isAdmin && <Button size="sm" className="sm:size-default" onClick={() => { setForm(emptySupplier); setShowAdd(true); }}><Plus className="w-4 h-4 mr-1 sm:mr-2" />Add Supplier</Button>}
      </div>

      <div className="relative max-w-md mb-4 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search suppliers..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {suppliers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No suppliers yet. Add your first supplier!</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filtered.map((s, idx) => (
          <div key={s.id} className="bg-card border border-border rounded-xl p-4 sm:p-5 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 opacity-0 animate-fade-in-scale" style={{ animationDelay: `${200 + idx * 80}ms` }}>
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-foreground text-sm sm:text-base">{s.name}</h3>
              {isAdmin && <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">{s.contact}</p>
            <p className="text-xs sm:text-sm text-primary mt-1 break-all">{s.email}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{s.phone}</p>
            <p className="text-xs text-muted-foreground mt-2">{s.address}</p>
          </div>
        ))}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Supplier</DialogTitle></DialogHeader>
          <div className="space-y-3 py-4">
            <div><Label>Company Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div><Label>Contact Person</Label><Input value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            <div><Label>Address</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowAdd(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">{saving ? "Saving..." : "Add Supplier"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
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

export default Suppliers;
