import { create } from 'zustand';
import { Customer, InventoryItem, Invoice, Account } from '../types';

interface ERPState {
  customers: Customer[];
  items: InventoryItem[];
  invoices: Invoice[];
  accounts: Account[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCustomers: () => Promise<void>;
  fetchItems: () => Promise<void>;
  fetchInvoices: () => Promise<void>;
  fetchAccounts: () => Promise<void>;
  fetchAllData: () => Promise<void>;
  createCustomer: (customer: any) => Promise<void>;
}

const API_BASE = 'http://localhost:3001/api';

export const useERPStore = create<ERPState>((set, get) => ({
  customers: [],
  items: [],
  invoices: [],
  accounts: [],
  isLoading: false,
  error: null,

  createCustomer: async (customerData) => {
    try {
      const res = await fetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });
      if (res.ok) {
        await get().fetchCustomers(); // Refresh the list
      }
    } catch (err) {
      set({ error: 'Failed to create customer' });
    }
  },

  fetchCustomers: async () => {
    try {
      const res = await fetch(`${API_BASE}/customers`);
      const data = await res.json();
      set({ customers: data });
    } catch (err) {
      set({ error: 'Failed to fetch customers' });
    }
  },

  fetchItems: async () => {
    try {
      const res = await fetch(`${API_BASE}/items`);
      const data = await res.json();
      set({ items: data });
    } catch (err) {
      set({ error: 'Failed to fetch items' });
    }
  },

  fetchInvoices: async () => {
    try {
      const res = await fetch(`${API_BASE}/invoices`);
      const data = await res.json();
      set({ invoices: data });
    } catch (err) {
      set({ error: 'Failed to fetch invoices' });
    }
  },

  fetchAccounts: async () => {
    try {
      const res = await fetch(`${API_BASE}/accounts`);
      const data = await res.json();
      set({ accounts: data });
    } catch (err) {
      set({ error: 'Failed to fetch accounts' });
    }
  },

  fetchAllData: async () => {
    set({ isLoading: true, error: null });
    await Promise.all([
      get().fetchCustomers(),
      get().fetchItems(),
      get().fetchInvoices(),
      get().fetchAccounts(),
    ]);
    set({ isLoading: false });
  }
}));
