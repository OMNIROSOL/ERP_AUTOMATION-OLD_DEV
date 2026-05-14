import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
});

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.message);
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out');
    }
    return Promise.reject(error);
  }
);


export const apiService = {
  // Master Data
  getCustomers: () => api.get('/customers').then(res => res.data),
  getCustomer: (id: string) => api.get(`/customers/${id}`).then(res => res.data),
  getCustomerTransactions: (id: string) => api.get(`/customers/${id}/transactions`).then(res => res.data),
  createCustomer: (data: any) => api.post('/customers', data).then(res => res.data),
  updateCustomer: (id: string, data: any) => api.put(`/customers/${id}`, data).then(res => res.data),

  getItems: () => api.get('/items').then(res => res.data),
  getItem: (id: string) => api.get(`/items/${id}`).then(res => res.data),
  createItem: (data: any) => api.post('/items', data).then(res => res.data),
  updateItem: (id: string, data: any) => api.put(`/items/${id}`, data).then(res => res.data),
  getItemTransactions: (id: string) => api.get(`/items/${id}/transactions`).then(res => res.data),

  getDivisions: () => api.get('/divisions').then(res => res.data),
  createDivision: (data: any) => api.post('/divisions', data).then(res => res.data),
  deleteDivision: (id: string) => api.delete(`/divisions/${id}`).then(res => res.data),

  getAccounts: () => api.get('/accounts').then(res => res.data),
  getAccount: (id: string) => api.get(`/accounts/${id}`).then(res => res.data),
  createAccount: (data: any) => api.post('/accounts', data).then(res => res.data),
  updateAccount: (id: string, data: any) => api.put(`/accounts/${id}`, data).then(res => res.data),

  // Sales
  getQuotes: () => api.get('/quotes').then(res => res.data),
  createQuote: (data: any) => api.post('/quotes', data).then(res => res.data),
  updateQuote: (id: string, data: any) => api.put(`/quotes/${id}`, data).then(res => res.data),
  updateQuoteStatus: (id: string, status: string) => api.patch(`/quotes/${id}`, { status }).then(res => res.data),
  convertQuoteToOrder: (id: string) => api.post(`/quotes/${id}/convert`).then(res => res.data),
  deleteQuote: (id: string) => api.delete(`/quotes/${id}`).then(res => res.data),

  getOrders: () => api.get('/orders').then(res => res.data),
  getOrder: (id: string) => api.get(`/orders/${id}`).then(res => res.data),
  createOrder: (data: any) => api.post('/orders', data).then(res => res.data),
  updateOrder: (id: string, data: any) => api.put(`/orders/${id}`, data).then(res => res.data),
  updateOrderStatus: (id: string, status: string) => api.patch(`/orders/${id}`, { status }).then(res => res.data),

  getInvoices: () => api.get('/invoices').then(res => res.data),
  getInvoice: (id: string) => api.get(`/invoices/${id}`).then(res => res.data),
  createInvoice: (data: any) => api.post('/invoices', data).then(res => res.data),
  updateInvoice: (id: string, data: any) => api.put(`/invoices/${id}`, data).then(res => res.data),
  updateInvoiceStatus: (id: string, status: string) => api.patch(`/invoices/${id}`, { status }).then(res => res.data),

  getDeliveryNotes: () => api.get('/delivery-notes').then(res => res.data),
  getDeliveryNote: (id: string) => api.get(`/delivery-notes/${id}`).then(res => res.data),
  createDeliveryNote: (data: any) => api.post('/delivery-notes', data).then(res => res.data),
  updateDeliveryNote: (id: string, data: any) => api.put(`/delivery-notes/${id}`, data).then(res => res.data),
  updateDeliveryNoteStatus: (id: string, status: string) => api.patch(`/delivery-notes/${id}`, { status }).then(res => res.data),


  getGoodsReceivedNotes: () => api.get('/goods-received-notes').then(res => res.data),
  createGoodsReceivedNote: (data: any) => api.post('/goods-received-notes', data).then(res => res.data),

  getReceipts: () => api.get('/receipts').then(res => res.data),
  getReceipt: (id: string) => api.get(`/receipts/${id}`).then(res => res.data),
  createReceipt: (data: any) => api.post('/receipts', data).then(res => res.data),
  updateReceipt: (id: string, data: any) => api.put(`/receipts/${id}`, data).then(res => res.data),

  getCreditNotes: () => api.get('/credit-notes').then(res => res.data),
  createCreditNote: (data: any) => api.post('/credit-notes', data).then(res => res.data),

  getDebitNotes: () => api.get('/debit-notes').then(res => res.data),
  createDebitNote: (data: any) => api.post('/debit-notes', data).then(res => res.data),

  getTaxCodes: () => api.get('/tax-codes').then(res => res.data),
  createTaxCode: (data: any) => api.post('/tax-codes', data).then(res => res.data),
  updateTaxCode: (id: string, data: any) => api.put(`/tax-codes/${id}`, data).then(res => res.data),
  deleteTaxCode: (id: string) => api.delete(`/tax-codes/${id}`).then(res => res.data),
  getWithholdingTaxes: () => api.get('/withholding-taxes').then(res => res.data),
  createWithholdingTax: (data: any) => api.post('/withholding-taxes', data).then(res => res.data),
  updateWithholdingTax: (id: string, data: any) => api.put(`/withholding-taxes/${id}`, data).then(res => res.data),

  // Inventory
  getInventoryTransfers: () => api.get('/inventory-transfers').then(res => res.data),
  getInventoryTransfer: (id: string) => api.get(`/inventory-transfers/${id}`).then(res => res.data),
  createInventoryTransfer: (data: any) => api.post('/inventory-transfers', data).then(res => res.data),
  updateInventoryTransfer: (id: string, data: any) => api.put(`/inventory-transfers/${id}`, data).then(res => res.data),

  getInventoryWriteOffs: () => api.get('/inventory-write-offs').then(res => res.data),
  getInventoryWriteOff: (id: string) => api.get(`/inventory-write-offs/${id}`).then(res => res.data),
  createInventoryWriteOff: (data: any) => api.post('/inventory-write-offs', data).then(res => res.data),
  updateInventoryWriteOff: (id: string, data: any) => api.put(`/inventory-write-offs/${id}`, data).then(res => res.data),

  getInventoryLocations: () => api.get('/locations').then(res => res.data),
  createLocation: (data: any) => api.post('/locations', data).then(res => res.data),
  updateLocation: (id: string, data: any) => api.put(`/locations/${id}`, data).then(res => res.data),
  deleteLocation: (id: string) => api.delete(`/locations/${id}`).then(res => res.data),
  getInventoryUnitCosts: () => api.get('/inventory-unit-costs').then(res => res.data),
  createInventoryUnitCost: (data: any) => api.post('/inventory-unit-costs', data).then(res => res.data),
  updateInventoryUnitCost: (id: string, data: any) => api.put(`/inventory-unit-costs/${id}`, data).then(res => res.data),

  // Suppliers
  getSuppliers: () => api.get('/suppliers').then(res => res.data),
  getSupplier: (id: string) => api.get(`/suppliers/${id}`).then(res => res.data),
  createSupplier: (data: any) => api.post('/suppliers', data).then(res => res.data),
  updateSupplier: (id: string, data: any) => api.put(`/suppliers/${id}`, data).then(res => res.data),

  // Procurement
  getPurchaseEnquiries: () => api.get('/purchase-enquiries').then(res => res.data),
  getPurchaseEnquiry: (id: string) => api.get(`/purchase-enquiries/${id}`).then(res => res.data),
  createPurchaseEnquiry: (data: any) => api.post('/purchase-enquiries', data).then(res => res.data),
  updatePurchaseEnquiry: (id: string, data: any) => api.put(`/purchase-enquiries/${id}`, data).then(res => res.data),
  updatePurchaseEnquiryStatus: (id: string, status: string) => api.patch(`/purchase-enquiries/${id}`, { status }).then(res => res.data),

  getPurchaseOrders: () => api.get('/purchase-orders').then(res => res.data),
  getPurchaseOrder: (id: string) => api.get(`/purchase-orders/${id}`).then(res => res.data),
  createPurchaseOrder: (data: any) => api.post('/purchase-orders', data).then(res => res.data),
  updatePurchaseOrder: (id: string, data: any) => api.put(`/purchase-orders/${id}`, data).then(res => res.data),
  updatePurchaseOrder: (id: string, data: any) => api.put(`/purchase-orders/${id}`, data).then(res => res.data),
  updatePurchaseOrderStatus: (id: string, status: string) => api.patch(`/purchase-orders/${id}`, { status }).then(res => res.data),

  getPurchaseInvoices: () => api.get('/purchase-invoices').then(res => res.data),
  getPurchaseInvoice: (id: string) => api.get(`/purchase-invoices/${id}`).then(res => res.data),
  createPurchaseInvoice: (data: any) => api.post('/purchase-invoices', data).then(res => res.data),
  updatePurchaseInvoice: (id: string, data: any) => api.put(`/purchase-invoices/${id}`, data).then(res => res.data),

  // Goods Received Notes
  getGoodsReceivedNotes: () => api.get('/goods-received-notes').then(res => res.data),
  getGoodsReceivedNote: (id: string) => api.get(`/goods-received-notes/${id}`).then(res => res.data),
  createGoodsReceivedNote: (data: any) => api.post('/goods-received-notes', data).then(res => res.data),
  getFooters: () => api.get('/footers').then(res => res.data),
  createFooter: (data: any) => api.post('/footers', data).then(res => res.data),
  updateFooter: (id: string, data: any) => api.put(`/footers/${id}`, data).then(res => res.data),
  deleteFooter: (id: string) => api.delete(`/footers/${id}`).then(res => res.data),

  // Reference Generation
  getLocations: () => api.get('/locations').then(res => res.data),
  getNextReference: (type: 'invoice' | 'quote' | 'order' | 'delivery' | 'customer' | 'supplier' | 'purchase-quote' | 'purchase-enquiry' | 'purchase-order' | 'receipt' | 'purchase-invoice' | 'debit-note' | 'credit-note' | 'goods-received-note') =>
    api.get(`/reference/next/${type}`).then(res => res.data.nextRef),

  // Accounts
  getBankAccounts: () => api.get('/bank-accounts').then(res => res.data),
  createBankAccount: (data: any) => api.post('/bank-accounts', data).then(res => res.data),
  updateBankAccount: (id: string, data: any) => api.put(`/bank-accounts/${id}`, data).then(res => res.data),

  // Roles & Permissions
  getRoles: () => api.get('/roles').then(res => res.data),
  createRole: (data: any) => api.post('/roles', data).then(res => res.data),
  updateRole: (id: string, data: any) => api.put(`/roles/${id}`, data).then(res => res.data),
  getScreens: () => Promise.resolve([
    { id: 'sales-quotes', name: 'Sales Quotes' },
    { id: 'sales-orders', name: 'Sales Orders' },
    { id: 'sales-invoices', name: 'Sales Invoices' },
    { id: 'customers', name: 'Customers' },
    { id: 'suppliers', name: 'Suppliers' },
    { id: 'items', name: 'Inventory Items' },
    { id: 'inventory-transfers', name: 'Inventory Transfers' },
    { id: 'inventory-write-offs', name: 'Inventory Write-offs' },
    { id: 'bank-accounts', name: 'Bank Accounts' },
    { id: 'purchase-quotes', name: 'Purchase Enquiry' },
    { id: 'purchase-orders', name: 'Purchase Orders' },
    { id: 'purchase-invoices', name: 'Purchase Invoices' },
    { id: 'receipts', name: 'Receipts' },
    { id: 'debit-notes', name: 'Debit Notes' },
    { id: 'credit-notes', name: 'Credit Notes' },
    { id: 'delivery-notes', name: 'Delivery Notes' },
    { id: 'reports', name: 'Reports' },
    { id: 'settings', name: 'Settings' }
  ]),

  // Users & Session
  getUsers: () => api.get('/users').then(res => res.data),
  createUser: (data: any) => api.post('/users', data).then(res => res.data),
  getCurrentUser: () => {
    try {
      const saved = localStorage.getItem('erp_sim_user');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error('Failed to parse sim user from localStorage:', err);
    }
    return {
      id: 'u-admin',
      name: 'Omni Admin',
      email: 'admin@omnirosol.com',
      role: 'Admin',
      roleId: 'r-admin',
      avatar: 'OA'
    };
  },
  setCurrentUser: (user: any) => {
    try {
      localStorage.setItem('erp_sim_user', JSON.stringify(user));
      window.dispatchEvent(new Event('user_sim_updated'));
    } catch (err) {
      console.error('Failed to save sim user to localStorage:', err);
    }
  },
};

export default apiService;
