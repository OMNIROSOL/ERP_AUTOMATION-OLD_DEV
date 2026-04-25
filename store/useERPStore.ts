import { create } from 'zustand';
import { Customer, InventoryItem, Invoice, Account } from '../types';

interface ERPState {
  customers: Customer[];
  items: InventoryItem[];
  invoices: Invoice[];
  quotes: any[];
  orders: any[];
  deliveryNotes: any[];
  procurementOrders: any[];
  suppliers: any[];
  accounts: Account[];
  itemUnits: any[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCustomers: () => Promise<void>;
  fetchItems: () => Promise<void>;
  fetchInvoices: () => Promise<void>;
  fetchQuotes: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchDeliveryNotes: () => Promise<void>;
  fetchAccounts: () => Promise<void>;
  fetchSuppliers: () => Promise<void>;
  fetchAllData: () => Promise<void>;
  
  createCustomer: (customer: any) => Promise<void>;
  createInvoice: (invoice: any) => Promise<void>;
  createQuote: (quote: any) => Promise<void>;
  createOrder: (order: any) => Promise<void>;
  createDeliveryNote: (note: any) => Promise<void>;
  createReceipt: (receipt: any) => Promise<void>;
  updateQuoteStatus: (id: string, status: string) => Promise<void>;
  
  createSupplier: (supplier: any) => Promise<void>;
  updateSupplier: (id: string, supplier: any) => Promise<void>;
  createItem: (item: any) => Promise<void>;
  updateItem: (id: string, item: any) => Promise<void>;

  // Item Units
  fetchItemUnits: () => Promise<void>;
  createItemUnit: (unit: any) => Promise<void>;
  deleteItemUnit: (id: string) => Promise<void>;

  // Item Categories
  itemCategories: any[];
  fetchItemCategories: () => Promise<void>;
  createItemCategory: (category: any) => Promise<void>;
  updateItemCategory: (id: string, category: any) => Promise<void>;
  deleteItemCategory: (id: string) => Promise<void>;

  // Inventory Locations
  inventoryLocations: any[];
  fetchInventoryLocations: () => Promise<void>;
  createInventoryLocation: (loc: any) => Promise<void>;
  updateInventoryLocation: (id: string, loc: any) => Promise<void>;
  deleteInventoryLocation: (id: string) => Promise<void>;

  // Inventory Write-offs
  inventoryWriteOffs: any[];
  fetchInventoryWriteOffs: () => Promise<void>;
  createInventoryWriteOff: (wo: any) => Promise<void>;
  updateInventoryWriteOff: (id: string, wo: any) => Promise<void>;
  deleteInventoryWriteOff: (id: string) => Promise<void>;

  // Inventory Unit Costs
  inventoryUnitCosts: any[];
  fetchInventoryUnitCosts: () => Promise<void>;
  createInventoryUnitCost: (cost: any) => Promise<void>;
  updateInventoryUnitCost: (id: string, cost: any) => Promise<void>;
  deleteInventoryUnitCost: (id: string) => Promise<void>;

  // Procurement Actions
  fetchProcurementOrders: () => Promise<void>;
  createProcurementOrder: (order: any) => Promise<void>;
  fetchProcurementSuggestions: (supplierId: string) => Promise<any[]>;
  // Inventory Transfers
  inventoryTransfers: any[];
  fetchInventoryTransfers: () => Promise<void>;
  createInventoryTransfer: (transfer: any) => Promise<void>;

  // Goods Received Notes
  goodsReceivedNotes: any[];
  fetchGoodsReceivedNotes: () => Promise<void>;
  createGoodsReceivedNote: (note: any) => Promise<void>;

  getNextReference: (type: string) => Promise<string>;
}

const API_BASE = '/api';

export const useERPStore = create<ERPState>((set, get) => ({
  customers: [],
  items: [],
  invoices: [],
  quotes: [],
  orders: [],
  deliveryNotes: [],
  procurementOrders: [],
  suppliers: [],
  accounts: [],
  itemUnits: [],
  inventoryLocations: [],
  itemCategories: [],
  inventoryWriteOffs: [],
  inventoryUnitCosts: [],
  inventoryTransfers: [],
  goodsReceivedNotes: [],
  isLoading: false,
  error: null,

  fetchCustomers: async () => {
    try {
      const res = await fetch(`${API_BASE}/customers`);
      const data = await res.json();
      set({ customers: data });
    } catch (err) {
      console.error('Fetch customers failed:', err);
    }
  },

  fetchItems: async () => {
    try {
      const res = await fetch(`${API_BASE}/items`);
      const data = await res.json();
      set({ items: data });
    } catch (err) {
      console.error('Fetch items failed:', err);
    }
  },

  fetchInvoices: async () => {
    try {
      const res = await fetch(`${API_BASE}/invoices`);
      const rawData = await res.json();
      const mappedData = rawData.map((inv: any) => ({
        ...inv,
        customer: inv.customer?.name || 'Unknown Customer',
        issueDate: inv.issueDate || new Date(inv.createdAt).toLocaleDateString('en-GB').replace(/\//g, '.'),
        invoiceAmount: parseFloat(inv.grandTotal) || 0,
        balanceDue: parseFloat(inv.balanceDue) || 0,
        status: inv.status || (inv.balanceDue === 0 ? 'Paid' : 'Unpaid'),
        items: inv.items?.map((item: any) => ({
            ...item,
            item: item.item?.itemName || 'Unknown Item',
            unitPrice: item.unitPrice.toString(),
            qty: item.qty.toString()
        }))
      }));
      set({ invoices: mappedData });
    } catch (err) {
      console.error('Fetch invoices failed:', err);
    }
  },

  fetchQuotes: async () => {
      try {
          const res = await fetch(`${API_BASE}/quotes`);
          const rawData = await res.json();
          const mappedData = rawData.map((q: any) => ({
              ...q,
              customer: q.customer?.name || 'Unknown',
              issueDate: q.issueDate || new Date(q.createdAt).toLocaleDateString('en-GB').replace(/\//g, '.'),
              amount: parseFloat(q.amount) || 0,
              items: q.items?.map((item: any) => ({
                  ...item,
                  item: item.item?.itemName || 'Unknown Item',
                  unitPrice: item.unitPrice.toString(),
                  qty: item.qty.toString()
              }))
          }));
          set({ quotes: mappedData });
      } catch (err) {
          console.error('Fetch quotes failed:', err);
      }
  },

  fetchOrders: async () => {
      try {
          const res = await fetch(`${API_BASE}/orders`);
          const rawData = await res.json();
          const mappedData = rawData.map((o: any) => ({
              ...o,
              customer: o.customer?.name || 'Unknown',
              orderDate: o.orderDate || new Date(o.createdAt).toLocaleDateString('en-GB').replace(/\//g, '.'),
              amount: parseFloat(o.amount) || 0,
              items: o.items?.map((item: any) => ({
                ...item,
                item: item.item?.itemName || 'Unknown Item',
                unitPrice: item.unitPrice.toString(),
                qty: item.qty.toString()
            }))
          }));
          set({ orders: mappedData });
      } catch (err) {
          console.error('Fetch orders failed:', err);
      }
  },

  fetchDeliveryNotes: async () => {
      try {
          const res = await fetch(`${API_BASE}/delivery-notes`);
          const rawData = await res.json();
          const mappedData = rawData.map((dn: any) => ({
              ...dn,
              customer: dn.customer?.name || 'Unknown',
              deliveryDate: dn.deliveryDate || new Date(dn.timestamp).toLocaleDateString('en-GB').replace(/\//g, '.'),
              items: dn.items?.map((item: any) => ({
                ...item,
                item: item.item?.itemName || 'Unknown Item',
                qty: item.qty.toString()
            }))
          }));
          set({ deliveryNotes: mappedData });
      } catch (err) {
          console.error('Fetch delivery notes failed:', err);
      }
  },

  fetchAccounts: async () => {
    try {
      const res = await fetch(`${API_BASE}/accounts`);
      const data = await res.json();
      set({ accounts: data });
    } catch (err) {
      console.error('Fetch accounts failed:', err);
    }
  },

  fetchAllData: async () => {
    set({ isLoading: true, error: null });
    try {
        await Promise.all([
            get().fetchCustomers(),
            get().fetchItems(),
            get().fetchInvoices(),
            get().fetchQuotes(),
            get().fetchOrders(),
            get().fetchDeliveryNotes(),
            get().fetchAccounts(),
            get().fetchSuppliers(),
        ]);
    } catch (err) {
        console.error('Fetch all data failed:', err);
    }
    set({ isLoading: false });
  },

  getNextReference: async (type: string) => {
    try {
      const res = await fetch(`${API_BASE}/reference/next/${type}`);
      const data = await res.json();
      return data.reference || data.nextRef; // Supporting both formats for resilience
    } catch (err) {
      console.error('Failed to get next reference:', err);
      return `${type.toUpperCase()}-${Date.now()}`;
    }
  },

  createCustomer: async (customerData) => {
    try {
      const res = await fetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });
      if (res.ok) {
        await get().fetchCustomers();
      }
    } catch (err) {
      console.error('Create customer failed:', err);
    }
  },

  createQuote: async (quoteData: any) => {
    try {
      const res = await fetch(`${API_BASE}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData),
      });
      if (!res.ok) throw new Error('Failed to create quote');
      await get().fetchQuotes();
    } catch (err) {
      console.error('Create quote failed:', err);
      throw err;
    }
  },

  createOrder: async (orderData: any) => {
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (!res.ok) throw new Error('Failed to create order');
      await get().fetchOrders();
    } catch (err) {
      console.error('Create order failed:', err);
      throw err;
    }
  },

  createDeliveryNote: async (dnData: any) => {
    try {
      const res = await fetch(`${API_BASE}/delivery-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dnData),
      });
      if (!res.ok) throw new Error('Failed to create delivery note');
      await get().fetchDeliveryNotes();
    } catch (err) {
      console.error('Create delivery note failed:', err);
      throw err;
    }
  },

  createInvoice: async (invoiceData: any) => {
    try {
      const res = await fetch(`${API_BASE}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });
      if (!res.ok) throw new Error('Failed to create invoice');
      await get().fetchInvoices();
    } catch (err) {
      console.error('Create invoice failed:', err);
      throw err;
    }
  },

  createReceipt: async (receiptData: any) => {
    try {
      const res = await fetch(`${API_BASE}/receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receiptData),
      });
      if (!res.ok) throw new Error('Failed to create receipt');
      await Promise.all([get().fetchInvoices(), get().fetchCustomers()]);
    } catch (err) {
      console.error('Create receipt failed:', err);
      throw err;
    }
  },

  updateQuoteStatus: async (id: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE}/quotes/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update quote status');
      await get().fetchQuotes();
    } catch (err) {
      console.error('Update quote status failed:', err);
      throw err;
    }
  },

  fetchProcurementOrders: async () => {
    try {
      const res = await fetch(`${API_BASE}/procurement/orders`);
      const data = await res.json();
      set({ procurementOrders: data });
    } catch (err) {
      console.error('Fetch procurement orders failed:', err);
    }
  },

  fetchSuppliers: async () => {
    try {
      const res = await fetch(`${API_BASE}/suppliers`);
      const data = await res.json();
      set({ suppliers: data });
    } catch (err) {
      console.error('Fetch suppliers failed:', err);
    }
  },

  createSupplier: async (supplierData: any) => {
    try {
      const res = await fetch(`${API_BASE}/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData),
      });
      if (!res.ok) throw new Error('Failed to create supplier');
      await get().fetchSuppliers();
    } catch (err) {
      console.error('Create supplier failed:', err);
      throw err;
    }
  },

  updateSupplier: async (id: string, supplierData: any) => {
    try {
      const res = await fetch(`${API_BASE}/suppliers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData),
      });
      if (!res.ok) throw new Error('Failed to update supplier');
      await get().fetchSuppliers();
    } catch (err) {
      console.error('Update supplier failed:', err);
      throw err;
    }
  },

  createItem: async (itemData: any) => {
    try {
      const res = await fetch(`${API_BASE}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });
      if (!res.ok) throw new Error('Failed to create item');
      await get().fetchItems();
    } catch (err) {
      console.error('Create item failed:', err);
      throw err;
    }
  },

  updateItem: async (id: string, itemData: any) => {
    try {
      const res = await fetch(`${API_BASE}/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });
      if (!res.ok) throw new Error('Failed to update item');
      await get().fetchItems();
    } catch (err) {
      console.error('Update item failed:', err);
      throw err;
    }
  },

  fetchItemUnits: async () => {
    try {
      const res = await fetch(`${API_BASE}/item-units`);
      const data = await res.json();
      set({ itemUnits: data });
    } catch (err) {
      console.error('Fetch item units failed:', err);
    }
  },

  createItemUnit: async (unitData: any) => {
    try {
      const res = await fetch(`${API_BASE}/item-units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unitData),
      });
      if (!res.ok) throw new Error('Failed to create item unit');
      await get().fetchItemUnits();
    } catch (err) {
      console.error('Create item unit failed:', err);
      throw err;
    }
  },

  deleteItemUnit: async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/item-units/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete item unit');
      await get().fetchItemUnits();
    } catch (err) {
      console.error('Delete item unit failed:', err);
      throw err;
    }
  },

  // --- ITEM CATEGORIES ---
  fetchItemCategories: async () => {
    try {
      const res = await fetch(`${API_BASE}/item-categories`);
      const data = await res.json();
      set({ itemCategories: data });
    } catch (err) {
      console.error('Fetch item categories failed:', err);
    }
  },

  createItemCategory: async (categoryData: any) => {
    try {
      const res = await fetch(`${API_BASE}/item-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });
      if (!res.ok) throw new Error('Failed to create item category');
      await get().fetchItemCategories();
    } catch (err) {
      console.error('Create item category failed:', err);
      throw err;
    }
  },

  updateItemCategory: async (id: string, categoryData: any) => {
    try {
      const res = await fetch(`${API_BASE}/item-categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });
      if (!res.ok) throw new Error('Failed to update item category');
      await get().fetchItemCategories();
    } catch (err) {
      console.error('Update item category failed:', err);
      throw err;
    }
  },

  deleteItemCategory: async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/item-categories/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete item category');
      await get().fetchItemCategories();
    } catch (err) {
      console.error('Delete item category failed:', err);
      throw err;
    }
  },

  fetchInventoryLocations: async () => {
    try {
      const res = await fetch(`${API_BASE}/inventory-locations`);
      const data = await res.json();
      set({ inventoryLocations: data });
    } catch (err) {
      console.error('Fetch inventory locations failed:', err);
    }
  },

  createInventoryLocation: async (locData: any) => {
    try {
      const res = await fetch(`${API_BASE}/inventory-locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locData),
      });
      if (!res.ok) throw new Error('Failed to create inventory location');
      await get().fetchInventoryLocations();
    } catch (err) {
      console.error('Create inventory location failed:', err);
      throw err;
    }
  },

  updateInventoryLocation: async (id: string, locData: any) => {
    try {
      const res = await fetch(`${API_BASE}/inventory-locations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locData),
      });
      if (!res.ok) throw new Error('Failed to update inventory location');
      await get().fetchInventoryLocations();
    } catch (err) {
      console.error('Update inventory location failed:', err);
      throw err;
    }
  },

  deleteInventoryLocation: async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/inventory-locations/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete inventory location');
      await get().fetchInventoryLocations();
    } catch (err) {
      console.error('Delete inventory location failed:', err);
      throw err;
    }
  },

  // --- Inventory Write-offs ---
  fetchInventoryWriteOffs: async () => {
    try {
      const res = await fetch(`${API_BASE}/inventory-write-offs`);
      const data = await res.json();
      set({ inventoryWriteOffs: data });
    } catch (err) {
      console.error('Failed to fetch inventory write-offs:', err);
    }
  },

  createInventoryWriteOff: async (woData: any) => {
    try {
      const res = await fetch(`${API_BASE}/inventory-write-offs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(woData),
      });
      if (!res.ok) throw new Error('Failed to create inventory write-off');
      await get().fetchInventoryWriteOffs();
    } catch (err) {
      console.error('Create inventory write-off failed:', err);
      throw err;
    }
  },

  updateInventoryWriteOff: async (id: string, woData: any) => {
    try {
      const res = await fetch(`${API_BASE}/inventory-write-offs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(woData),
      });
      if (!res.ok) throw new Error('Failed to update inventory write-off');
      await get().fetchInventoryWriteOffs();
    } catch (err) {
      console.error('Update inventory write-off failed:', err);
      throw err;
    }
  },

  deleteInventoryWriteOff: async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/inventory-write-offs/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete inventory write-off');
      await get().fetchInventoryWriteOffs();
    } catch (err) {
      console.error('Delete inventory write-off failed:', err);
      throw err;
    }
  },

  // --- INVENTORY UNIT COSTS ---
  fetchInventoryUnitCosts: async () => {
    try {
      const res = await fetch(`${API_BASE}/inventory-unit-costs`);
      const data = await res.json();
      set({ inventoryUnitCosts: data });
    } catch (err) {
      console.error('Fetch inventory unit costs failed:', err);
    }
  },

  createInventoryUnitCost: async (costData: any) => {
    try {
      const res = await fetch(`${API_BASE}/inventory-unit-costs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(costData),
      });
      if (!res.ok) throw new Error('Failed to create inventory unit cost');
      await get().fetchInventoryUnitCosts();
    } catch (err) {
      console.error('Create inventory unit cost failed:', err);
      throw err;
    }
  },

  updateInventoryUnitCost: async (id: string, costData: any) => {
    try {
      const res = await fetch(`${API_BASE}/inventory-unit-costs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(costData),
      });
      if (!res.ok) throw new Error('Failed to update inventory unit cost');
      await get().fetchInventoryUnitCosts();
    } catch (err) {
      console.error('Update inventory unit cost failed:', err);
      throw err;
    }
  },

  deleteInventoryUnitCost: async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/inventory-unit-costs/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete inventory unit cost');
      await get().fetchInventoryUnitCosts();
    } catch (err) {
      console.error('Delete inventory unit cost failed:', err);
      throw err;
    }
  },
  createProcurementOrder: async (orderData: any) => {
    try {
      const res = await fetch(`${API_BASE}/procurement/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (!res.ok) throw new Error('Failed to create procurement order');
      await get().fetchProcurementOrders();
    } catch (err) {
      console.error('Create procurement order failed:', err);
      throw err;
    }
  },

  fetchProcurementSuggestions: async (supplierId: string) => {
    try {
      const res = await fetch(`${API_BASE}/procurement/suggestions/${supplierId}`);
      return await res.json();
    } catch (err) {
      console.error('Fetch procurement suggestions failed:', err);
      return [];
    }
  },

  fetchLeadTime: async (supplierId: string) => {
    try {
      const res = await fetch(`${API_BASE}/procurement/lead-times/${supplierId}`);
      return await res.json();
    } catch (err) {
      console.error('Fetch lead time failed:', err);
      return null;
    }
  },

  updateLeadTime: async (leadTime: any) => {
    try {
      const res = await fetch(`${API_BASE}/procurement/lead-times`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadTime),
      });
      if (!res.ok) throw new Error('Failed to update lead time');
    } catch (err) {
      console.error('Update lead time failed:', err);
      throw err;
    }
  },

  // Inventory Transfers
  fetchInventoryTransfers: async () => {
    try {
      const res = await fetch(`${API_BASE}/inventory-transfers`);
      const data = await res.json();
      set({ inventoryTransfers: data });
    } catch (err) {
      console.error('Fetch inventory transfers failed:', err);
    }
  },

  createInventoryTransfer: async (transfer: any) => {
    try {
      const res = await fetch(`${API_BASE}/inventory-transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transfer),
      });
      if (!res.ok) throw new Error('Failed to create inventory transfer');
      await get().fetchInventoryTransfers();
    } catch (err) {
      console.error('Create inventory transfer failed:', err);
      throw err;
    }
  },

  fetchGoodsReceivedNotes: async () => {
    try {
      const res = await fetch(`${API_BASE}/goods-received-notes`);
      const data = await res.json();
      set({ goodsReceivedNotes: data });
    } catch (err) {
      console.error('Fetch goods received notes failed:', err);
    }
  },

  createGoodsReceivedNote: async (note: any) => {
    try {
      const res = await fetch(`${API_BASE}/goods-received-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
      });
      if (!res.ok) throw new Error('Failed to create goods received note');
      await get().fetchGoodsReceivedNotes();
    } catch (err) {
      console.error('Create goods received note failed:', err);
      throw err;
    }
  }
}));
