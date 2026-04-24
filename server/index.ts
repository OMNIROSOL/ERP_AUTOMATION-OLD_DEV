import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import cors from 'cors';

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- MASTER DATA ---
app.get('/api/customers', async (req, res) => {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' }
  });
  res.json(customers);
});

app.post('/api/customers', async (req, res) => {
  const data = req.body;
  try {
    const result = await prisma.customer.create({
      data: {
        code: data.code,
        name: data.name,
        email: data.email,
        currency: data.currency,
        billingAddress: data.billingAddress,
        status: data.status || 'Unpaid',
      }
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/items', async (req, res) => {
  const items = await prisma.item.findMany();
  res.json(items);
});

// --- SALES ---
app.get('/api/invoices', async (req, res) => {
  const invoices = await prisma.invoice.findMany({
    include: { customer: true, items: { include: { item: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(invoices);
});

app.post('/api/invoices', async (req, res) => {
  const { customerId, reference, items, grandTotal, balanceDue, docOptions } = req.body;
  try {
    const result = await prisma.invoice.create({
      data: {
        customerId,
        reference,
        grandTotal,
        balanceDue,
        docOptions: docOptions || {},
        items: {
          create: items.map((item: any) => ({
            itemId: item.itemId,
            qty: item.qty,
            unitPrice: item.unitPrice,
            totalAmount: item.totalAmount
          }))
        }
      }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Sales Quotes
app.get('/api/quotes', async (req, res) => {
    const quotes = await prisma.salesQuote.findMany({
        include: { customer: true, items: { include: { item: true } } },
        orderBy: { createdAt: 'desc' }
    });
    res.json(quotes);
});

app.post('/api/quotes', async (req, res) => {
    const { customerId, reference, items, amount, description, billingAddress, expiryDays, docOptions } = req.body;
    try {
        const result = await prisma.salesQuote.create({
            data: {
                customerId,
                reference,
                amount,
                description,
                billingAddress,
                expiryDays: parseInt(expiryDays) || 30,
                docOptions: docOptions || {},
                items: {
                    create: items.map((item: any) => ({
                        itemId: item.itemId,
                        qty: item.qty,
                        unitPrice: item.unitPrice,
                        totalAmount: item.totalAmount
                    }))
                }
            }
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// Sales Orders
app.get('/api/orders', async (req, res) => {
    const orders = await prisma.salesOrder.findMany({
        include: { customer: true, items: { include: { item: true } } },
        orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
});

app.post('/api/orders', async (req, res) => {
    const { customerId, reference, items, amount, description, billingAddress, docOptions } = req.body;
    try {
        const result = await prisma.salesOrder.create({
            data: {
                customerId,
                reference,
                amount,
                description,
                billingAddress,
                docOptions: docOptions || {},
                items: {
                    create: items.map((item: any) => ({
                        itemId: item.itemId,
                        qty: item.qty,
                        unitPrice: item.unitPrice,
                        totalAmount: item.totalAmount
                    }))
                }
            }
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// Delivery Notes
app.get('/api/delivery-notes', async (req, res) => {
    const notes = await prisma.deliveryNote.findMany({
        include: { customer: true, items: { include: { item: true } } },
        orderBy: { timestamp: 'desc' }
    });
    res.json(notes);
});

app.post('/api/delivery-notes', async (req, res) => {
    const { customerId, reference, items, description, inventoryLocation } = req.body;
    try {
        const result = await prisma.deliveryNote.create({
            data: {
                customerId,
                reference,
                description,
                inventoryLocation,
                items: {
                    create: items.map((item: any) => ({
                        itemId: item.itemId,
                        qty: item.qty
                    }))
                }
            }
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// --- REFERENCE GENERATION ---
app.get('/api/reference/next/:type', async (req, res) => {
    const { type } = req.params;
    let count = 0;
    let prefix = '';

    switch (type) {
        case 'invoice':
            count = await prisma.invoice.count();
            prefix = 'INV';
            break;
        case 'quote':
            count = await prisma.salesQuote.count();
            prefix = 'QT';
            break;
        case 'order':
            count = await prisma.salesOrder.count();
            prefix = 'SO';
            break;
        case 'delivery':
            count = await prisma.deliveryNote.count();
            prefix = 'DN';
            break;
        default:
            return res.status(400).json({ error: 'Invalid document type' });
    }

    const nextRef = `${prefix}-${(count + 1).toString().padStart(4, '0')}`;
    res.json({ nextRef });
});

// --- FINANCE ---
app.get('/api/accounts', async (req, res) => {
  const accounts = await prisma.chartOfAccount.findMany();
  res.json(accounts);
});

app.listen(PORT, () => {
  console.log(`🚀 ERP Backend running at http://localhost:${PORT}`);
});
