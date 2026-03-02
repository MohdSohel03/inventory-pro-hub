const API_BASE = "http://localhost:8000";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

// Products
export const getProducts = () => request<any[]>("/products");
export const addProduct = (data: any) => request("/add-product", { method: "POST", body: JSON.stringify(data) });
export const updateProduct = (id: number, data: any) => request(`/update-product/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteProduct = (id: number) => request(`/delete-product/${id}`, { method: "DELETE" });
export const getLowStock = () => request<any[]>("/low-stock");

// Suppliers
export const getSuppliers = () => request<any[]>("/suppliers");
export const addSupplier = (data: any) => request("/add-supplier", { method: "POST", body: JSON.stringify(data) });
export const deleteSupplier = (id: number) => request(`/delete-supplier/${id}`, { method: "DELETE" });

// Purchases
export const getPurchases = () => request<any[]>("/purchases");
export const addPurchase = (data: any) => request("/add-purchase", { method: "POST", body: JSON.stringify(data) });

// Sales
export const getSales = () => request<any[]>("/sales");
export const createSale = (data: any) => request("/create-sale", { method: "POST", body: JSON.stringify(data) });

// Reports
export const getReports = (params: string) => request<any>(`/reports?${params}`);
