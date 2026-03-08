import { useEffect, useState } from "react";
import { Sun, Moon, Globe, DollarSign } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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

const Settings = () => {
  const { toast } = useToast();
  const [isDark, setIsDark] = useState(() => !document.documentElement.classList.contains("light"));
  const [currency, setCurrency] = useState(() => localStorage.getItem("app_currency") || "INR");
  const [language, setLanguage] = useState(() => localStorage.getItem("app_language") || "en");

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

  const handleCurrencyChange = (val: string) => {
    setCurrency(val);
    localStorage.setItem("app_currency", val);
    const cur = CURRENCIES.find(c => c.value === val);
    toast({ title: "Currency updated", description: `Currency set to ${cur?.label}` });
  };

  const handleLanguageChange = (val: string) => {
    setLanguage(val);
    localStorage.setItem("app_language", val);
    const lang = LANGUAGES.find(l => l.value === val);
    toast({ title: "Language updated", description: `Language set to ${lang?.label}` });
  };

  const selectedCurrency = CURRENCIES.find(c => c.value === currency);
  const selectedLanguage = LANGUAGES.find(l => l.value === language);

  return (
    <div className="p-3 sm:p-6 max-w-[800px] mx-auto">
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-6">
        {/* Appearance */}
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-1">Appearance</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Customize how StockPilot looks</p>
        </div>

        <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-muted/30 border border-border gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {isDark ? <Moon className="w-5 h-5 text-primary shrink-0" /> : <Sun className="w-5 h-5 text-orange-500 shrink-0" />}
            <div className="min-w-0">
              <Label className="text-foreground font-medium">Dark Mode</Label>
              <p className="text-xs text-muted-foreground">Toggle between light and dark theme</p>
            </div>
          </div>
          <Switch checked={isDark} onCheckedChange={setIsDark} />
        </div>

        {/* General */}
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-1">General</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">App preferences</p>
        </div>

        <div className="space-y-3">
          {/* Currency */}
          <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-muted/30 border border-border gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <DollarSign className="w-5 h-5 text-primary shrink-0" />
              <div className="min-w-0">
                <Label className="text-foreground font-medium">Currency</Label>
                <p className="text-xs text-muted-foreground">Display currency for all amounts</p>
              </div>
            </div>
            <Select value={currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="w-[180px] sm:w-[220px] shrink-0">
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
          </div>

          {/* Language */}
          <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-muted/30 border border-border gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Globe className="w-5 h-5 text-primary shrink-0" />
              <div className="min-w-0">
                <Label className="text-foreground font-medium">Language</Label>
                <p className="text-xs text-muted-foreground">Preferred display language</p>
              </div>
            </div>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[180px] sm:w-[220px] shrink-0">
                <SelectValue>{selectedLanguage?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(l => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
