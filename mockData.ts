import {
  Customer, SalesQuote, SalesOrder, Invoice, CreditNote, DeliveryNote, Receipt, Account, Transaction,
  ApprovalRequest, InventoryItem, InventoryTransfer, InventoryWriteOff, InventoryLocation, InventoryUnitCost,
  Supplier, PurchaseOrder, PurchaseInvoice, DebitNote, GoodsReceivedNote, PurchaseQuote, AppUser,
  UserRole, TaxCode, WithholdingTax, RoleDefinition, ScreenPermission, DocumentFooter
} from './types';

// CONFIGURATION
export const ADJUSTABLE_MARGIN_THRESHOLD = 0.1;

// MOCK DATA - EMPTIED TO USE DATABASE ONLY
export const mockInventory: Record<string, any> = {};
export const mockInventoryItems: any[] = [];
export const getInventoryItems = () => [];
export const saveInventoryItems = (items: any) => {};

export const getInvoices = (): Invoice[] => [];
export const mockInvoices: Invoice[] = [];
export const saveInvoices = (invoices: Invoice[]) => {
  localStorage.setItem('invoices_data', JSON.stringify(invoices));
  window.dispatchEvent(new Event('invoices_updated'));
};

export const getSalesQuotes = (): SalesQuote[] => [];
export const mockSalesQuotes: SalesQuote[] = [];
export const saveSalesQuotes = (quotes: SalesQuote[]) => {
  localStorage.setItem('sales_quotes_data', JSON.stringify(quotes));
  window.dispatchEvent(new Event('sales_quotes_updated'));
};

export const getSalesOrders = (): SalesOrder[] => [];
export const mockSalesOrders: SalesOrder[] = [];
export const saveSalesOrders = (orders: SalesOrder[]) => {
  localStorage.setItem('sales_orders_data', JSON.stringify(orders));
  window.dispatchEvent(new Event('sales_orders_updated'));
};

export const getReceipts = (): Receipt[] => [];
export const mockReceipts: Receipt[] = [];
export const saveReceipts = (receipts: Receipt[]) => {
  localStorage.setItem('receipts_data', JSON.stringify(receipts));
  window.dispatchEvent(new Event('receipts_updated'));
};

export const getCreditNotes = (): CreditNote[] => [];
export const mockCreditNotes: CreditNote[] = [];
export const saveCreditNotes = (notes: CreditNote[]) => {
  localStorage.setItem('credit_notes_data', JSON.stringify(notes));
};

export const getDeliveryNotes = (): DeliveryNote[] => [];
export const mockDeliveryNotes: DeliveryNote[] = [];
export const saveDeliveryNotes = (notes: DeliveryNote[]) => {
  localStorage.setItem('delivery_notes_data', JSON.stringify(notes));
  window.dispatchEvent(new Event('delivery_notes_updated'));
};

export const getCustomers = (): Customer[] => [];
export const mockCustomers: Customer[] = [];
export const saveCustomers = (customers: Customer[]) => {
  localStorage.setItem('customers_data', JSON.stringify(customers));
};
export const getCustomerDeliveryDetails = (name: string) => null;

export const getSuppliers = (): Supplier[] => [];
export const mockSuppliers: Supplier[] = [];
export const saveSuppliers = (suppliers: Supplier[]) => {
  localStorage.setItem('suppliers_data', JSON.stringify(suppliers));
};

export const getPurchaseOrders = (): PurchaseOrder[] => [];
export const mockPurchaseOrders: PurchaseOrder[] = [];
export const savePurchaseOrders = (orders: PurchaseOrder[]) => {};

export const getPurchaseInvoices = (): PurchaseInvoice[] => [];
export const mockPurchaseInvoices: PurchaseInvoice[] = [];
export const savePurchaseInvoices = (invoices: PurchaseInvoice[]) => {};

export const getDebitNotes = (): DebitNote[] => [];
export const mockDebitNotes: DebitNote[] = [];
export const saveDebitNotes = (notes: DebitNote[]) => {};

export const getGoodsReceivedNotes = (): GoodsReceivedNote[] => [];
export const mockGoodsReceivedNotes: GoodsReceivedNote[] = [];
export const saveGoodsReceivedNotes = (notes: GoodsReceivedNote[]) => {};

export const getPurchaseQuotes = (): PurchaseQuote[] => [];
export const mockPurchaseQuotes: PurchaseQuote[] = [];
export const savePurchaseQuotes = (quotes: PurchaseQuote[]) => {};

export const getInventoryLocations = (): InventoryLocation[] => [];
export const mockInventoryLocations: InventoryLocation[] = [];
export const saveInventoryLocations = (locations: InventoryLocation[]) => {};

export const getInventoryTransfers = (): InventoryTransfer[] => [];
export const mockInventoryTransfers: InventoryTransfer[] = [];
export const saveInventoryTransfers = (transfers: InventoryTransfer[]) => {};

export const getInventoryWriteOffs = (): InventoryWriteOff[] => [];
export const mockInventoryWriteOffs: InventoryWriteOff[] = [];
export const saveInventoryWriteOffs = (writeOffs: InventoryWriteOff[]) => {};

export const getInventoryUnitCosts = (): InventoryUnitCost[] => [];
export const mockInventoryUnitCosts: InventoryUnitCost[] = [];
export const saveInventoryUnitCosts = (costs: InventoryUnitCost[]) => {};

export const getTransactionsByCustomer = (name: string) => [];
export const getCustomerTransactions = (name: string) => [];
export const getSupplierTransactions = (name: string) => [];
export const getInvoiceTransactions = (ref: string) => [];
export const getInventoryItemTransactions = (name: string) => [];
export const getDeliveryTransactionsByItem = (item: string) => [];

export const getFooters = (): DocumentFooter[] => [];
export const mockFooters: DocumentFooter[] = [];
export const saveFooters = (footers: DocumentFooter[]) => {
  localStorage.setItem('footers_data', JSON.stringify(footers));
};

export const getWithholdingTaxes = (): WithholdingTax[] => [];
export const mockWithholdingTaxes: WithholdingTax[] = [];
export const saveWithholdingTaxes = (taxes: WithholdingTax[]) => {};

export const getAccounts = (): Account[] => [];
export const SCREENS = [
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'sales-invoices', name: 'Sales Invoices' },
  { id: 'customers', name: 'Customers' }
];

export const mockAccounts: Account[] = [];
export const saveAccounts = (accounts: Account[]) => {};

export const getApprovalRequests = (): ApprovalRequest[] => [];
export const mockApprovalRequests: ApprovalRequest[] = [];
export const saveApprovalRequests = (requests: ApprovalRequest[]) => {
  localStorage.setItem('approval_requests_data', JSON.stringify(requests));
};

// CORE SYSTEM DATA
export const initialRoleDefinitions: RoleDefinition[] = [
  {
    id: 'admin',
    name: 'Administrator',
    permissions: [
      { screenId: 'dashboard', screenName: 'Dashboard', view: true, add: true, edit: true, delete: true, full: true },
      { screenId: 'sales-invoices', screenName: 'Sales Invoices', view: true, add: true, edit: true, delete: true, full: true },
      { screenId: 'customers', screenName: 'Customers', view: true, add: true, edit: true, delete: true, full: true }
    ]
  },
  {
    id: 'manager',
    name: 'Manager',
    permissions: [
      { screenId: 'dashboard', screenName: 'Dashboard', view: true, add: true, edit: true, delete: true, full: true },
      { screenId: 'sales-invoices', screenName: 'Sales Invoices', view: true, add: true, edit: true, delete: true, full: true },
      { screenId: 'customers', screenName: 'Customers', view: true, add: true, edit: true, delete: true, full: true }
    ]
  }
];

export const initialUsers: AppUser[] = [
  { id: 'u1', name: 'Admin User', email: 'admin@example.com', role: 'Administrator', roleId: 'admin', avatar: 'AU' },
  { id: 'u2', name: 'Manager User', email: 'manager@example.com', role: 'Manager', roleId: 'manager', avatar: 'MU' }
];

export const getUsers = () => initialUsers;
export const mockUsers = initialUsers;
export const saveUsers = (users: AppUser[]) => {
  localStorage.setItem('users_sim_data', JSON.stringify(users));
  window.dispatchEvent(new Event('users_updated'));
};
export const setCurrentUser = (user: AppUser) => {
  localStorage.setItem('current_user_sim', JSON.stringify(user));
  window.dispatchEvent(new Event('user_sim_updated'));
};
export const getCurrentUser = (): AppUser => {
  const saved = localStorage.getItem('current_user_sim');
  return saved ? JSON.parse(saved) : initialUsers[0];
};

export const getRoleDefinitions = () => initialRoleDefinitions;
export const saveRoleDefinitions = (roles: RoleDefinition[]) => {
  localStorage.setItem('role_definitions_data', JSON.stringify(roles));
};
export const getRoleById = (id: string) => initialRoleDefinitions.find(r => r.id === id);

export const getTaxCodes = (): TaxCode[] => [
  { id: '1', name: 'No tax', rate: 0 },
  { id: '2', name: 'VAT 16%', rate: 16 }
];
export const mockTaxCodes: TaxCode[] = [
  { id: '1', name: 'No tax', rate: 0 },
  { id: '2', name: 'VAT 16%', rate: 16 }
];
export const saveTaxCodes = (codes: TaxCode[]) => {
  localStorage.setItem('tax_codes_data', JSON.stringify(codes));
};
