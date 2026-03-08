import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user } = useAuth();
  const { isAdmin, isStaff } = useRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    company: "",
  });

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
      }
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

  const initials = form.full_name
    ? form.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="p-3 sm:p-6 max-w-[800px] mx-auto">
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-6">
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
    </div>
  );
};

export default Profile;
