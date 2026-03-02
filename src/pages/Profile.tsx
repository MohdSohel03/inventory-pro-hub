import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Camera } from "lucide-react";

const Profile = () => {
  const [form, setForm] = useState({
    name: "Admin User",
    email: "admin@stockpilot.com",
    phone: "+91 98765 43210",
    company: "StockPilot Inc.",
    role: "Administrator",
  });

  return (
    <div className="p-6 max-w-[800px] mx-auto">
      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="bg-primary/15 text-primary text-2xl font-bold">SP</AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{form.name}</h2>
            <p className="text-sm text-muted-foreground">{form.role}</p>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Full Name</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
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
            <Input value={form.role} disabled className="opacity-60" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
