import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

const CURRENCIES: Record<string, { symbol: string; locale: string }> = {
  INR: { symbol: "₹", locale: "en-IN" },
  USD: { symbol: "$", locale: "en-US" },
  EUR: { symbol: "€", locale: "de-DE" },
  GBP: { symbol: "£", locale: "en-GB" },
  AED: { symbol: "د.إ", locale: "ar-AE" },
  SAR: { symbol: "﷼", locale: "ar-SA" },
};

interface AppSettings {
  currency: string;
  currencySymbol: string;
  currencyLocale: string;
  dateFormat: string;
  itemsPerPage: number;
  lowStockThreshold: number;
  formatCurrency: (amount: number) => string;
  formatDate: (dateStr: string) => string;
  updateSettings: (settings: Partial<RawSettings>) => void;
}

interface RawSettings {
  currency: string;
  dateFormat: string;
  itemsPerPage: string;
  lowStockThreshold: string;
}

const AppSettingsContext = createContext<AppSettings | null>(null);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState(() => localStorage.getItem("app_currency") || "INR");
  const [dateFormat, setDateFormat] = useState(() => localStorage.getItem("app_date_format") || "DD/MM/YYYY");
  const [itemsPerPage, setItemsPerPage] = useState(() => parseInt(localStorage.getItem("items_per_page") || "25"));
  const [lowStockThreshold, setLowStockThreshold] = useState(() => parseInt(localStorage.getItem("default_min_stock") || "10"));

  // Listen for localStorage changes from Settings page
  useEffect(() => {
    const handler = () => {
      setCurrency(localStorage.getItem("app_currency") || "INR");
      setDateFormat(localStorage.getItem("app_date_format") || "DD/MM/YYYY");
      setItemsPerPage(parseInt(localStorage.getItem("items_per_page") || "25"));
      setLowStockThreshold(parseInt(localStorage.getItem("default_min_stock") || "10"));
    };
    window.addEventListener("storage", handler);
    // Custom event for same-tab updates
    window.addEventListener("app-settings-changed", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("app-settings-changed", handler);
    };
  }, []);

  const cur = CURRENCIES[currency] || CURRENCIES.INR;

  const formatCurrency = useCallback((amount: number) => {
    return `${cur.symbol}${amount.toLocaleString(cur.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [cur]);

  const formatDate = useCallback((dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    if (!y || !m || !d) return dateStr;
    if (dateFormat === "MM/DD/YYYY") return `${m}/${d}/${y}`;
    if (dateFormat === "YYYY-MM-DD") return `${y}-${m}-${d}`;
    return `${d}/${m}/${y}`; // DD/MM/YYYY default
  }, [dateFormat]);

  const updateSettings = useCallback((settings: Partial<RawSettings>) => {
    if (settings.currency) { setCurrency(settings.currency); localStorage.setItem("app_currency", settings.currency); }
    if (settings.dateFormat) { setDateFormat(settings.dateFormat); localStorage.setItem("app_date_format", settings.dateFormat); }
    if (settings.itemsPerPage) { setItemsPerPage(parseInt(settings.itemsPerPage)); localStorage.setItem("items_per_page", settings.itemsPerPage); }
    if (settings.lowStockThreshold) { setLowStockThreshold(parseInt(settings.lowStockThreshold)); localStorage.setItem("default_min_stock", settings.lowStockThreshold); }
    window.dispatchEvent(new Event("app-settings-changed"));
  }, []);

  return (
    <AppSettingsContext.Provider value={{
      currency,
      currencySymbol: cur.symbol,
      currencyLocale: cur.locale,
      dateFormat,
      itemsPerPage,
      lowStockThreshold,
      formatCurrency,
      formatDate,
      updateSettings,
    }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error("useAppSettings must be used within AppSettingsProvider");
  return ctx;
}
