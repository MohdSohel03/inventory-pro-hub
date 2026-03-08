import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Lock, Eye, EyeOff, Package, ShoppingCart, DollarSign, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user } = useAuth();
  const { isAdmin, isStaff } = useRole();
  const { formatCurrency } = useAppSettings();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    company: "",
  });

  // Password change
  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [changingPassword, setChangingPassword] = useState(false);

  // Stats
  const [stats, setStats] = useState({ totalProducts: 0, totalSales: 0, totalSalesAmount: 0, totalPurchases: 0, memberSince: "" });

  useEffect(() => {
    if (!user) return;

    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        setForm({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          company: data.company || "",
        });
        setStats(prev => ({ ...prev, memberSince: data.created_at ? new Date(data.created_at).toLocaleDateString() : "" }));
      }
    });

    // Fetch stats
    Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("sales").select("id, total"),
      supabase.from("purchases").select("id", { count: "exact", head: true }),
    ]).then(([productsRes, salesRes, purchasesRes]) => {
      const salesData = salesRes.data || [];
      setStats(prev => ({
        ...prev,
        totalProducts: productsRes.count || 0,
        totalSales: salesData.length,
        totalSalesAmount: salesData.reduce((sum, s) => sum + (s.total || 0), 0),
        totalPurchases: purchasesRes.count || 0,
      }));
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name,
      phone: form.phone,
      company: form.company,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword.length < 6) {
      toast({ title: "Password too short", description: "Must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
    setChangingPassword(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated successfully!" });
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    }
  };

  const initials = form.full_name
    ? form.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="p-3 sm:p-6 max-w-[800px] mx-auto space-y-4">
      {/* Profile Info */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-6 opacity-0 animate-fade-in-scale">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative shrink-0">
            <Avatar className="w-16 h-16 sm:w-20 sm:h-20">
              <AvatarFallback className="bg-primary/15 text-primary text-xl sm:text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-foreground truncate">{form.full_name || "User"}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground capitalize">{isAdmin ? "Admin" : isStaff ? "Staff" : "User"}</p>
            {stats.memberSince && (
              <p className="text-xs text-muted-foreground mt-0.5">Member since {stats.memberSince}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Full Name</Label>
            <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={form.email} disabled className="opacity-60" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label>Company</Label>
            <Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Role</Label>
            <Input value={isAdmin ? "Admin" : isStaff ? "Staff" : "User"} disabled className="opacity-60" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Profile Stats */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 opacity-0 animate-fade-in-scale" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
        <h3 className="text-sm sm:text-base font-semibold text-foreground mb-4">Your Stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Products", value: stats.totalProducts, icon: Package, color: "text-primary" },
            { label: "Sales", value: stats.totalSales, icon: ShoppingCart, color: "text-success" },
            { label: "Revenue", value: formatCurrency(stats.totalSalesAmount), icon: DollarSign, color: "text-warning" },
            { label: "Purchases", value: stats.totalPurchases, icon: Calendar, color: "text-chart-4" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-lg bg-muted/40 border border-border p-3 sm:p-4 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-1.5 ${color}`} />
              <p className="text-lg sm:text-xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4 opacity-0 animate-fade-in-scale" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-foreground">Change Password</h3>
            <p className="text-xs text-muted-foreground">Update your account password</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Label>New Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Min 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label>Confirm Password</Label>
            <Input
              type={showPassword ? "text" : "password"}
              value={passwordForm.confirmPassword}
              onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              placeholder="Re-enter password"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleChangePassword}
            disabled={changingPassword || !passwordForm.newPassword}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {changingPassword ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
