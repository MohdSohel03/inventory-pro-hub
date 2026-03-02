import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Settings = () => {
  const [isDark, setIsDark] = useState(() => !document.documentElement.classList.contains("light"));

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") setIsDark(false);
  }, []);

  return (
    <div className="p-6 max-w-[800px] mx-auto">
      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Appearance</h2>
          <p className="text-sm text-muted-foreground">Customize how StockPilot looks</p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-3">
            {isDark ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-warning" />}
            <div>
              <Label className="text-foreground font-medium">Dark Mode</Label>
              <p className="text-xs text-muted-foreground">Toggle between light and dark theme</p>
            </div>
          </div>
          <Switch checked={isDark} onCheckedChange={setIsDark} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">General</h2>
          <p className="text-sm text-muted-foreground">App preferences</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
            <div>
              <Label className="text-foreground font-medium">Currency</Label>
              <p className="text-xs text-muted-foreground">Indian Rupee (₹)</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
            <div>
              <Label className="text-foreground font-medium">Language</Label>
              <p className="text-xs text-muted-foreground">English</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
