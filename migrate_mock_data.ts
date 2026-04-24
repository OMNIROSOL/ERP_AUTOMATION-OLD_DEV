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

    // Dynamically import mockData
    const mockData = await import('./mockData.ts');

    // 1. Migrate Accounts
    console.log('Migrating Accounts...');
    for (const acc of (mockData.mockAccounts as any[])) {
      console.log(`- ${acc.name}`);
      await (prisma as any).chartOfAccount.upsert({
        where: { code: acc.code },
        update: {
          name: acc.name,
          accountType: acc.type,
          isPaymentAccount: acc.isPaymentAccount || false,
        },
        create: {
          code: acc.code,
          name: acc.name,
          accountType: acc.type,
          isPaymentAccount: acc.isPaymentAccount || false,
        },
      });
    }

    // 2. Migrate Inventory Items
    console.log('Migrating Inventory Items...');
    for (const item of (mockData.mockInventoryItems as any[])) {
      console.log(`- ${item.itemName}`);
      await (prisma as any).item.upsert({
        where: { itemCode: item.itemCode },
        update: {
          itemName: item.itemName,
          description: item.description,
          unitName: item.unitName,
          valuationMethod: item.valuationMethod,
        },
        create: {
          itemCode: item.itemCode,
          itemName: item.itemName,
          description: item.description,
          unitName: item.unitName,
          valuationMethod: item.valuationMethod,
        },
      });
    }

    // 3. Migrate Customers
    console.log('Migrating Customers...');
    const customers = (mockData as any).getCustomers();
    for (const cust of customers) {
      console.log(`- ${cust.name}`);
      await (prisma as any).customer.upsert({
        where: { code: cust.code },
        update: {
          name: cust.name,
          email: cust.email || '',
          currency: (cust.currency || 'ZMW').split(' ')[0], // Extract currency code like 'ZMW' from 'ZMW - Zambian Kwacha'
          billingAddress: cust.billingAddress || '',
          status: cust.status || 'Unpaid',
        },
        create: {
          code: cust.code,
          name: cust.name,
          email: cust.email || '',
          currency: (cust.currency || 'ZMW').split(' ')[0],
          billingAddress: cust.billingAddress || '',
          status: cust.status || 'Unpaid',
        },
      });
    }

    // 4. Migrate Suppliers
    console.log('Migrating Suppliers...');
    const suppliers = (mockData as any).getSuppliers();
    for (const sup of suppliers) {
      console.log(`- ${sup.name}`);
      await (prisma as any).suppliers.upsert({
        where: { code: sup.code },
        update: {
          name: sup.name,
          email: sup.email || '',
          currency: sup.currency || 'ZMW',
          status: sup.status || 'Active',
        },
        create: {
          code: sup.code,
          name: sup.name,
          email: sup.email || '',
          currency: sup.currency || 'ZMW',
          status: sup.status || 'Active',
        },
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
