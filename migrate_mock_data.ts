import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

// Mock localStorage for mockData.ts
const mockStorage: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { for (const key in mockStorage) delete mockStorage[key]; },
  length: 0,
  key: (index: number) => Object.keys(mockStorage)[index] || null,
};

// Mock window for mockData.ts
global.window = {
  dispatchEvent: () => {},
} as any;
global.Event = class {} as any;

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('--- MOCK DATA MIGRATION STARTED ---');

    // Dynamically import mockData_backup
    const mockData = await import('./mockData_backup.ts');

    // 1. Migrate Accounts
    console.log('Migrating Accounts...');
    for (const acc of (mockData.mockAccounts as any[])) {
      await (prisma as any).chartOfAccount.upsert({
        where: { code: acc.code },
        update: { name: acc.name, accountType: acc.type, isPaymentAccount: acc.isPaymentAccount || false },
        create: { code: acc.code, name: acc.name, accountType: acc.type, isPaymentAccount: acc.isPaymentAccount || false },
      });
    }

    // 2. Migrate Inventory Items
    console.log('Migrating Inventory Items...');
    for (const item of (mockData.mockInventoryItems as any[])) {
      await (prisma as any).item.upsert({
        where: { itemCode: item.itemCode },
        update: { itemName: item.itemName, description: item.description, unitName: item.unitName, valuationMethod: item.valuationMethod },
        create: { itemCode: item.itemCode, itemName: item.itemName, description: item.description, unitName: item.unitName, valuationMethod: item.valuationMethod },
      });
    }

    // 3. Migrate Customers
    console.log('Migrating Customers...');
    const customers = (mockData as any).getCustomers();
    const customerMap = new Map<string, string>();
    for (const cust of customers) {
      const created = await (prisma as any).customer.upsert({
        where: { code: cust.code },
        update: { name: cust.name, email: cust.email || '', currency: (cust.currency || 'ZMW').split(' ')[0], billingAddress: cust.billingAddress || '', status: cust.status || 'Unpaid' },
        create: { code: cust.code, name: cust.name, email: cust.email || '', currency: (cust.currency || 'ZMW').split(' ')[0], billingAddress: cust.billingAddress || '', status: cust.status || 'Unpaid' },
      });
      customerMap.set(cust.name, created.id);
    }

    // 4. Migrate Sales Quotes
    console.log('Migrating Sales Quotes...');
    const quotes = (mockData as any).getSalesQuotes();
    for (const quote of quotes) {
      const custId = customerMap.get(quote.customer);
      if (!custId) continue;
      
      await (prisma as any).salesQuote.upsert({
        where: { reference: quote.reference },
        update: { amount: quote.amount, status: quote.status, description: quote.description },
        create: {
          reference: quote.reference,
          issueDate: new Date(quote.issueDate.split('.').reverse().join('-')),
          customerId: custId,
          amount: quote.amount,
          status: quote.status,
          description: quote.description,
          currency: quote.currency
        },
      });
    }

    // 5. Migrate Sales Orders
    console.log('Migrating Sales Orders...');
    const orders = (mockData as any).getSalesOrders();
    for (const order of orders) {
      const custId = customerMap.get(order.customer);
      if (!custId) continue;
      
      await (prisma as any).salesOrder.upsert({
        where: { reference: order.reference },
        update: { amount: order.amount, status: order.status, description: order.description },
        create: {
          reference: order.reference,
          orderDate: new Date(order.orderDate.split('.').reverse().join('-')),
          customerId: custId,
          amount: order.amount,
          status: order.status,
          description: order.description,
          currency: order.currency
        },
      });
    }

    // 6. Migrate Invoices
    console.log('Migrating Invoices...');
    const invoices = (mockData as any).getInvoices();
    for (const inv of invoices) {
      const custId = customerMap.get(inv.customer);
      if (!custId) continue;
      
      await (prisma as any).invoice.upsert({
        where: { reference: inv.reference },
        update: { grandTotal: inv.invoiceAmount, balanceDue: inv.balanceDue, status: inv.status },
        create: {
          reference: inv.reference,
          issueDate: new Date(inv.issueDate.split('.').reverse().join('-')),
          dueDate: inv.dueDate ? new Date(inv.dueDate.split('.').reverse().join('-')) : null,
          customerId: custId,
          grandTotal: inv.invoiceAmount,
          balanceDue: inv.balanceDue,
          status: inv.status
        },
      });
    }

    // 7. Migrate Suppliers
    console.log('Migrating Suppliers...');
    const suppliers = (mockData as any).getSuppliers();
    for (const sup of suppliers) {
      await (prisma as any).suppliers.upsert({
        where: { code: sup.code },
        update: { name: sup.name, email: sup.email || '', currency: sup.currency || 'ZMW', status: sup.status || 'Active' },
        create: { code: sup.code, name: sup.name, email: sup.email || '', currency: sup.currency || 'ZMW', status: sup.status || 'Active' },
      });
    }

    // 8. Migrate Tax Codes
    console.log('Migrating Tax Codes...');
    const taxCodes = (mockData as any).mockTaxCodes || [];
    for (const tax of taxCodes) {
      await (prisma as any).tax_codes.upsert({
        where: { name: tax.name },
        update: { rate: tax.rate },
        create: { name: tax.name, rate: tax.rate },
      });
    }

    console.log('--- MIGRATION COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

migrate();
