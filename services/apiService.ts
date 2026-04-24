import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const apiService = {
  // Master Data
  getCustomers: () => api.get('/customers').then(res => res.data),
  createCustomer: (data: any) => api.post('/customers', data).then(res => res.data),
  updateCustomer: (id: string, data: any) => api.put(`/customers/${id}`, data).then(res => res.data),
  
  getItems: () => api.get('/items').then(res => res.data),
  createItem: (data: any) => api.post('/items', data).then(res => res.data),
  updateItem: (id: string, data: any) => api.put(`/items/${id}`, data).then(res => res.data),

  getDivisions: () => api.get('/divisions').then(res => res.data),
  createDivision: (data: any) => api.post('/divisions', data).then(res => res.data),
  deleteDivision: (id: string) => api.delete(`/divisions/${id}`).then(res => res.data),
  
  // Sales
  getQuotes: () => api.get('/quotes').then(res => res.data),
  createQuote: (data: any) => api.post('/quotes', data).then(res => res.data),
  updateQuote: (id: string, data: any) => api.put(`/quotes/${id}`, data).then(res => res.data),
  updateQuoteStatus: (id: string, status: string) => api.patch(`/quotes/${id}`, { status }).then(res => res.data),
  deleteQuote: (id: string) => api.delete(`/quotes/${id}`).then(res => res.data),

  getOrders: () => api.get('/orders').then(res => res.data),
  createOrder: (data: any) => api.post('/orders', data).then(res => res.data),
  updateOrder: (id: string, data: any) => api.put(`/orders/${id}`, data).then(res => res.data),

  getInvoices: () => api.get('/invoices').then(res => res.data),
  createInvoice: (data: any) => api.post('/invoices', data).then(res => res.data),
  updateInvoice: (id: string, data: any) => api.put(`/invoices/${id}`, data).then(res => res.data),

  getDeliveryNotes: () => api.get('/delivery-notes').then(res => res.data),
  
  // Suppliers & Tax
  getSuppliers: () => api.get('/suppliers').then(res => res.data),
  createSupplier: (data: any) => api.post('/suppliers', data).then(res => res.data),
  updateSupplier: (id: string, data: any) => api.put(`/suppliers/${id}`, data).then(res => res.data),

  getTaxCodes: () => api.get('/tax-codes').then(res => res.data),
  
  // Reference Generation
  getNextReference: (type: 'invoice' | 'quote' | 'order' | 'delivery' | 'customer' | 'supplier') => 
    api.get(`/reference/next/${type}`).then(res => res.data.nextRef),
    
  // Finance
  getAccounts: () => api.get('/accounts').then(res => res.data),
};

export default apiService;
