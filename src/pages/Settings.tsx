import { useEffect, useState } from "react";
import {
  Sun, Moon, Monitor, Globe, DollarSign, Bell, BellOff, Package, Shield,
  Download, Trash2, AlertTriangle, Clock, Hash, Loader2, Palette
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV } from "@/lib/export-csv";
import { useNavigate } from "react-router-dom";

const CURRENCIES = [
  { value: "INR", label: "Indian Rupee (₹)", symbol: "₹", locale: "en-IN" },
  { value: "USD", label: "US Dollar ($)", symbol: "$", locale: "en-US" },
  { value: "EUR", label: "Euro (€)", symbol: "€", locale: "de-DE" },
  { value: "GBP", label: "British Pound (£)", symbol: "£", locale: "en-GB" },
  { value: "AED", label: "UAE Dirham (د.إ)", symbol: "د.إ", locale: "ar-AE" },
  { value: "SAR", label: "Saudi Riyal (﷼)", symbol: "﷼", locale: "ar-SA" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi (हिन्दी)" },
  { value: "ar", label: "Arabic (العربية)" },
  { value: "es", label: "Spanish (Español)" },
  { value: "fr", label: "French (Français)" },
];

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const TIME_ZONES = [
  { value: "Asia/Kolkata", label: "IST (India)" },
  { value: "America/New_York", label: "EST (US East)" },
  { value: "America/Los_Angeles", label: "PST (US West)" },
  { value: "Europe/London", label: "GMT (UK)" },
  { value: "Asia/Dubai", label: "GST (Dubai)" },
  { value: "Asia/Tokyo", label: "JST (Japan)" },
];

// Reusable setting row component
function SettingRow({ icon: Icon, label, description, children }: {
  icon: React.ElementType;
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-muted/30 border border-border gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="w-5 h-5 text-primary shrink-0" />
        <div className="min-w-0">
          <Label className="text-foreground font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-base sm:text-lg font-semibold text-foreground mb-1">{title}</h2>
      <p className="text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

const Settings = () => {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Appearance
  const [themeMode, setThemeMode] = useState<"dark" | "light" | "system">(() => {
    return (localStorage.getItem("theme_mode") as "dark" | "light" | "system") || "dark";
  });

  // General
  const [currency, setCurrency] = useState(() => localStorage.getItem("app_currency") || "INR");
  const [language, setLanguage] = useState(() => localStorage.getItem("app_language") || "en");
  const [dateFormat, setDateFormat] = useState(() => localStorage.getItem("app_date_format") || "DD/MM/YYYY");
  const [timezone, setTimezone] = useState(() => localStorage.getItem("app_timezone") || "Asia/Kolkata");

  // Notifications
  const [lowStockAlerts, setLowStockAlerts] = useState(() => localStorage.getItem("notif_low_stock") !== "false");
  const [salesAlerts, setSalesAlerts] = useState(() => localStorage.getItem("notif_sales") !== "false");

  // Inventory
  const [defaultMinStock, setDefaultMinStock] = useState(() => localStorage.getItem("default_min_stock") || "10");
  const [autoSku, setAutoSku] = useState(() => localStorage.getItem("auto_sku") !== "false");

  // Data export
  const [exporting, setExporting] = useState(false);

  // Theme effect
  useEffect(() => {
    const applyTheme = (mode: "dark" | "light" | "system") => {
      let isDark: boolean;
      if (mode === "system") {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      } else {
        isDark = mode === "dark";
      }
      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.classList.toggle("light", !isDark);
      localStorage.setItem("theme", isDark ? "dark" : "light");
      localStorage.setItem("theme_mode", mode);
    };

    applyTheme(themeMode);

    if (themeMode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [themeMode]);

  // Handlers
  const saveSetting = (key: string, value: string, label: string, detail: string) => {
    localStorage.setItem(key, value);
    toast({ title: `${label} updated`, description: detail });
  };

  const handleCurrencyChange = (val: string) => {
    setCurrency(val);
    const cur = CURRENCIES.find(c => c.value === val);
    saveSetting("app_currency", val, "Currency", `Currency set to ${cur?.label}`);
  };

  const handleLanguageChange = (val: string) => {
    setLanguage(val);
    const lang = LANGUAGES.find(l => l.value === val);
    saveSetting("app_language", val, "Language", `Language set to ${lang?.label}`);
  };

  const handleDateFormatChange = (val: string) => {
    setDateFormat(val);
    saveSetting("app_date_format", val, "Date format", `Date format set to ${val}`);
  };

  const handleTimezoneChange = (val: string) => {
    setTimezone(val);
    const tz = TIME_ZONES.find(t => t.value === val);
    saveSetting("app_timezone", val, "Time zone", `Time zone set to ${tz?.label}`);
  };

  const handleToggle = (key: string, value: boolean, setter: (v: boolean) => void, label: string) => {
    setter(value);
    localStorage.setItem(key, String(value));
    toast({ title: `${label} ${value ? "enabled" : "disabled"}` });
  };

  const handleMinStockChange = (val: string) => {
    setDefaultMinStock(val);
    localStorage.setItem("default_min_stock", val);
  };

  const handleMinStockSave = () => {
    const num = parseInt(defaultMinStock);
    if (isNaN(num) || num < 0) {
      toast({ title: "Invalid value", description: "Please enter a valid number", variant: "destructive" });
      return;
    }
    localStorage.setItem("default_min_stock", String(num));
    toast({ title: "Default min stock updated", description: `Default minimum stock set to ${num}` });
  };

  const handleExportAll = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [salesRes, productsRes, purchasesRes] = await Promise.all([
        supabase.from("sales").select("*"),
        supabase.from("products").select("*"),
        supabase.from("purchases").select("*"),
      ]);

      const dateStr = new Date().toISOString().slice(0, 10);

      if (productsRes.data && productsRes.data.length > 0) {
        exportToCSV(productsRes.data, `products-backup-${dateStr}`, [
          { key: "name", label: "Name" }, { key: "sku", label: "SKU" },
          { key: "category", label: "Category" }, { key: "stock", label: "Stock" },
          { key: "min_stock", label: "Min Stock" }, { key: "cost_price", label: "Cost Price" },
          { key: "selling_price", label: "Selling Price" }, { key: "location", label: "Location" },
        ]);
      }

      if (salesRes.data && salesRes.data.length > 0) {
        exportToCSV(salesRes.data, `sales-backup-${dateStr}`, [
          { key: "date", label: "Date" }, { key: "customer", label: "Customer" },
          { key: "items", label: "Items" }, { key: "total", label: "Total" },
          { key: "discount", label: "Discount" }, { key: "payment", label: "Payment" },
          { key: "status", label: "Status" },
        ]);
      }

      if (purchasesRes.data && purchasesRes.data.length > 0) {
        exportToCSV(purchasesRes.data, `purchases-backup-${dateStr}`, [
          { key: "date", label: "Date" }, { key: "supplier_name", label: "Supplier" },
          { key: "items", label: "Items" }, { key: "total", label: "Total" },
          { key: "status", label: "Status" },
        ]);
      }

      toast({ title: "Data exported!", description: "Products, sales and purchases exported as CSV files" });
    } catch {
      toast({ title: "Export failed", description: "Something went wrong", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleSignOutAll = async () => {
    await signOut();
    toast({ title: "Signed out", description: "You have been signed out from all sessions" });
    navigate("/login");
  };

  const selectedCurrency = CURRENCIES.find(c => c.value === currency);
  const selectedLanguage = LANGUAGES.find(l => l.value === language);

  return (
    <div className="p-3 sm:p-6 max-w-[800px] mx-auto space-y-4">
      {/* Appearance */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Appearance</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Theme & display settings</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {([
            { value: "dark" as const, label: "Dark", icon: Moon },
            { value: "light" as const, label: "Light", icon: Sun },
            { value: "system" as const, label: "System", icon: Monitor },
          ]).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setThemeMode(value)}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all ${
                themeMode === value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
              }`}
            >
              <div className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${
                value === "dark" ? "bg-muted-foreground/30" : value === "light" ? "bg-muted-foreground/20" : "bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/15"
              }`}>
                <div className={`w-5 h-5 rounded-full transition-transform ${
                  value === "dark" ? "translate-x-5 bg-foreground" : value === "light" ? "translate-x-0 bg-muted-foreground" : "translate-x-2.5 bg-gradient-to-r from-foreground to-muted-foreground"
                }`} />
              </div>
              <span className={`text-sm font-medium ${themeMode === value ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* General */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
        <SectionHeader title="General" subtitle="App preferences and regional settings" />
        <div className="space-y-3">
          <SettingRow icon={DollarSign} label="Currency" description="Display currency for all amounts">
            <Select value={currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="w-[160px] sm:w-[200px] shrink-0">
                <SelectValue>{selectedCurrency?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>
                    <span className="font-medium">{c.symbol}</span>
                    <span className="ml-2">{c.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow icon={Globe} label="Language" description="Preferred display language">
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[160px] sm:w-[200px] shrink-0">
                <SelectValue>{selectedLanguage?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(l => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow icon={Clock} label="Date Format" description="How dates are displayed">
            <Select value={dateFormat} onValueChange={handleDateFormatChange}>
              <SelectTrigger className="w-[160px] sm:w-[200px] shrink-0">
                <SelectValue>{dateFormat}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMATS.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow icon={Globe} label="Time Zone" description="Your local time zone">
            <Select value={timezone} onValueChange={handleTimezoneChange}>
              <SelectTrigger className="w-[160px] sm:w-[200px] shrink-0">
                <SelectValue>{TIME_ZONES.find(t => t.value === timezone)?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TIME_ZONES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
        <SectionHeader title="Notifications" subtitle="Control what alerts you receive" />
        <div className="space-y-3">
          <SettingRow icon={Bell} label="Low Stock Alerts" description="Get notified when products are below minimum stock">
            <Switch
              checked={lowStockAlerts}
              onCheckedChange={(v) => handleToggle("notif_low_stock", v, setLowStockAlerts, "Low stock alerts")}
            />
          </SettingRow>
          <SettingRow icon={lowStockAlerts ? Bell : BellOff} label="Sales Notifications" description="Get notified on new sales transactions">
            <Switch
              checked={salesAlerts}
              onCheckedChange={(v) => handleToggle("notif_sales", v, setSalesAlerts, "Sales notifications")}
            />
          </SettingRow>
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
        <SectionHeader title="Inventory" subtitle="Default inventory management settings" />
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-muted/30 border border-border gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Package className="w-5 h-5 text-primary shrink-0" />
              <div className="min-w-0">
                <Label className="text-foreground font-medium">Default Min Stock</Label>
                <p className="text-xs text-muted-foreground">Default minimum stock level for new products</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Input
                type="number"
                min={0}
                value={defaultMinStock}
                onChange={e => handleMinStockChange(e.target.value)}
                className="w-20 text-center"
              />
              <Button size="sm" variant="outline" onClick={handleMinStockSave}>Save</Button>
            </div>
          </div>

          <SettingRow icon={Hash} label="Auto-generate SKU" description="Automatically generate SKU codes for new products">
            <Switch
              checked={autoSku}
              onCheckedChange={(v) => handleToggle("auto_sku", v, setAutoSku, "Auto SKU generation")}
            />
          </SettingRow>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
        <SectionHeader title="Data & Privacy" subtitle="Manage your data and account security" />
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-muted/30 border border-border gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Download className="w-5 h-5 text-primary shrink-0" />
              <div className="min-w-0">
                <Label className="text-foreground font-medium">Export All Data</Label>
                <p className="text-xs text-muted-foreground">Download all your products, sales & purchases as CSV</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={handleExportAll} disabled={exporting}>
              {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Download className="w-4 h-4 mr-1" />}
              {exporting ? "Exporting..." : "Export"}
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-muted/30 border border-border gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Shield className="w-5 h-5 text-primary shrink-0" />
              <div className="min-w-0">
                <Label className="text-foreground font-medium">Sign Out All Sessions</Label>
                <p className="text-xs text-muted-foreground">Sign out from all devices and browsers</p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline">Sign Out All</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out all sessions?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will be signed out from all devices and need to log in again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSignOutAll} className="w-full sm:w-auto">Sign Out All</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card border border-destructive/30 rounded-xl p-4 sm:p-6 space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-destructive mb-1 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Danger Zone
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Irreversible actions — proceed with caution</p>
        </div>

        <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-destructive/5 border border-destructive/20 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Trash2 className="w-5 h-5 text-destructive shrink-0" />
            <div className="min-w-0">
              <Label className="text-foreground font-medium">Delete All Sales Data</Label>
              <p className="text-xs text-muted-foreground">Permanently remove all sales records</p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all your sales records from the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                  onClick={async () => {
                    if (!user) return;
                    const { error } = await supabase.from("sales").delete().neq("id", "00000000-0000-0000-0000-000000000000");
                    if (error) {
                      toast({ title: "Error", description: error.message, variant: "destructive" });
                    } else {
                      toast({ title: "Sales data deleted", description: "All sales records have been removed" });
                    }
                  }}
                >
                  Yes, delete all sales
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default Settings;
