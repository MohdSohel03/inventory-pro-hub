import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Eye, EyeOff, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";

const StaffManagement = () => {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { toast } = useToast();
  const [staff, setStaff] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStaff = async () => {
    if (!user) return;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("admin_id", user.id)
      .eq("role", "staff");

    if (!roles || roles.length === 0) {
      setStaff([]);
      setLoading(false);
      return;
    }

    const staffIds = roles.map(r => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", staffIds);

    setStaff(profiles || []);
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, [user]);

  if (!isAdmin) return <Navigate to="/" replace />;

  const handleAddStaff = async () => {
    if (!name || !email || !password) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }
    setSaving(true);

    const { data, error } = await supabase.functions.invoke("manage-staff", {
      body: { action: "create", email, password, full_name: name },
    });

    setSaving(false);
    if (error || data?.error) {
      toast({ title: "Error", description: data?.error || error?.message || "Failed to create staff", variant: "destructive" });
    } else {
      toast({ title: "Staff added", description: `${name} has been added successfully` });
      setShowAdd(false);
      setName("");
      setEmail("");
      setPassword("");
      fetchStaff();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { data, error } = await supabase.functions.invoke("manage-staff", {
      body: { action: "delete", staff_user_id: deleteId },
    });

    if (error || data?.error) {
      toast({ title: "Error", description: data?.error || error?.message || "Failed to remove staff", variant: "destructive" });
    } else {
      toast({ title: "Staff removed", description: "Staff member has been removed" });
      fetchStaff();
    }
    setDeleteId(null);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-end mb-4">
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-2" />Add Staff
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : staff.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No staff members yet. Add your first staff member!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map(s => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-foreground">{s.full_name || "Unnamed"}</h3>
                  <p className="text-sm text-primary mt-1">{s.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Role: <span className="font-medium">Staff</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Joined: {new Date(s.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteId(s.id)}
                  className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={v => { if (!v) setShowAdd(false); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Full Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="staff@example.com" />
            </div>
            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Staff will use this email & password to login</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAddStaff} disabled={saving}>{saving ? "Adding..." : "Add Staff"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this staff member's account. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StaffManagement;
