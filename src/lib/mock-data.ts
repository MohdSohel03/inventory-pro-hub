export const mockProducts = [
  { id: 1, name: "MacBook Pro 16\"", sku: "EL-001", category: "Electronics", stock: 45, cost_price: 1999.99, selling_price: 2499.99, min_stock: 10, location: "Warehouse A" },
  { id: 2, name: "Ergonomic Office Chair", sku: "FU-012", category: "Furniture", stock: 8, cost_price: 650.00, selling_price: 899.00, min_stock: 15, location: "Warehouse B" },
  { id: 3, name: "Wireless Keyboard", sku: "EL-045", category: "Electronics", stock: 120, cost_price: 49.99, selling_price: 79.99, min_stock: 20, location: "Distribution Center" },
  { id: 4, name: "Standing Desk", sku: "FU-023", category: "Furniture", stock: 0, cost_price: 899.00, selling_price: 1299.00, min_stock: 5, location: "Warehouse A" },
  { id: 5, name: "USB-C Hub", sku: "EL-078", category: "Electronics", stock: 200, cost_price: 25.00, selling_price: 45.99, min_stock: 30, location: "Distribution Center" },
  { id: 6, name: "Monitor Stand", sku: "FU-034", category: "Furniture", stock: 3, cost_price: 45.00, selling_price: 79.99, min_stock: 10, location: "Warehouse B" },
  { id: 7, name: "Webcam HD Pro", sku: "EL-089", category: "Electronics", stock: 67, cost_price: 89.99, selling_price: 149.99, min_stock: 15, location: "Warehouse A" },
  { id: 8, name: "Desk Lamp LED", sku: "FU-045", category: "Furniture", stock: 34, cost_price: 29.99, selling_price: 59.99, min_stock: 20, location: "Warehouse B" },
];

export const mockSuppliers = [
  { id: 1, name: "TechWorld Distributors", contact: "John Smith", email: "john@techworld.com", phone: "+1-555-0101", address: "123 Tech Ave, San Jose, CA" },
  { id: 2, name: "Office Essentials Co.", contact: "Sarah Johnson", email: "sarah@officeess.com", phone: "+1-555-0202", address: "456 Office Blvd, Austin, TX" },
  { id: 3, name: "Global Electronics Inc.", contact: "Mike Chen", email: "mike@globalelec.com", phone: "+1-555-0303", address: "789 Circuit St, Seattle, WA" },
];

export const mockPurchases = [
  { id: 1, supplier: "TechWorld Distributors", date: "2026-02-28", items: 3, total: 15499.97, status: "Received" },
  { id: 2, supplier: "Office Essentials Co.", date: "2026-02-25", items: 2, total: 8750.00, status: "Pending" },
  { id: 3, supplier: "Global Electronics Inc.", date: "2026-02-20", items: 5, total: 22340.50, status: "Received" },
  { id: 4, supplier: "TechWorld Distributors", date: "2026-02-15", items: 1, total: 4999.95, status: "Received" },
];

export const mockSales = [
  { id: 1, date: "2026-03-01", customer: "Acme Corp", items: 2, total: 5498.98, discount: 5, payment: "Credit Card", status: "Completed" },
  { id: 2, date: "2026-02-28", customer: "TechStart Inc", items: 5, total: 1249.95, discount: 10, payment: "Bank Transfer", status: "Completed" },
  { id: 3, date: "2026-02-27", customer: "HomeOffice LLC", items: 3, total: 3197.97, discount: 0, payment: "Credit Card", status: "Pending" },
  { id: 4, date: "2026-02-26", customer: "DesignHub", items: 1, total: 2499.99, discount: 0, payment: "Cash", status: "Completed" },
];

export const mockSalesTrend = [
  { month: "Sep", sales: 32000, purchases: 24000 },
  { month: "Oct", sales: 38000, purchases: 28000 },
  { month: "Nov", sales: 42000, purchases: 31000 },
  { month: "Dec", sales: 55000, purchases: 40000 },
  { month: "Jan", sales: 48000, purchases: 35000 },
  { month: "Feb", sales: 52000, purchases: 38000 },
];

export const mockCategoryDistribution = [
  { name: "Electronics", value: 45, fill: "hsl(210 100% 50%)" },
  { name: "Furniture", value: 30, fill: "hsl(142 71% 45%)" },
  { name: "Accessories", value: 15, fill: "hsl(38 92% 50%)" },
  { name: "Other", value: 10, fill: "hsl(280 65% 60%)" },
];

export const mockStockStatus = [
  { name: "In Stock", value: 5, fill: "hsl(142 71% 45%)" },
  { name: "Low Stock", value: 2, fill: "hsl(38 92% 50%)" },
  { name: "Out of Stock", value: 1, fill: "hsl(0 72% 51%)" },
];
