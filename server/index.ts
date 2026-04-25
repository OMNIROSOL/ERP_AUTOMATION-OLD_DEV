import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import cors from 'cors';
import { getProcurementSuggestions, calculateETA } from './procurement';

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
  const items = await prisma.item.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' }
  });
  // Map DB fields to frontend field names
  const mapped = items.map((item: any) => ({
    id: item.id,
    itemCode: item.itemCode,
    itemName: item.itemName,
    description: item.description || '',
    unitName: item.unitName || 'Pcs',
    valuationMethod: item.valuationMethod || 'FIFO',
    isInactive: item.isInactive || false,
    inactive: item.isInactive || false,
    purchasePrice: parseFloat(item.purchase_price) || 0,
    sellingPrice: parseFloat(item.selling_price) || 0,
    avgCost: parseFloat(item.purchase_price) || 0,
    qtyOnHand: 0,
    totalValue: 0,
    reorderLevel: 0,
    category: item.category?.name || '',
    categoryId: item.categoryId || null,
    createdAt: item.createdAt,
  }));
  res.json(mapped);
});

app.post('/api/items', async (req, res) => {
  const data = req.body;
  let categoryId = null;
  if (data.category) {
    const cat = await prisma.itemCategory.findUnique({ where: { name: data.category } });
    if (cat) categoryId = cat.id;
  }

  try {
    const result = await prisma.item.create({
      data: {
        itemCode: data.itemCode,
        itemName: data.itemName,
        description: data.description || null,
        unitName: data.unitName || 'Pcs',
        valuationMethod: data.valuationMethod || 'FIFO',
        isInactive: data.inactive || false,
        purchase_price: data.purchasePrice || 0,
        selling_price: data.sellingPrice || 0,
        categoryId: categoryId,
      }
    });
    res.json(result);
  } catch (err) {
    console.error('Create item failed:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.patch('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  let categoryId: string | null | undefined = undefined;
  if (data.category !== undefined) {
    if (data.category === '') {
      categoryId = null;
    } else {
      const cat = await prisma.itemCategory.findUnique({ where: { name: data.category } });
      if (cat) categoryId = cat.id;
    }
  }

  try {
    const result = await prisma.item.update({
      where: { id },
      data: {
        itemName: data.itemName,
        description: data.description || null,
        unitName: data.unitName || 'Pcs',
        valuationMethod: data.valuationMethod || 'FIFO',
        isInactive: data.inactive || false,
        purchase_price: data.purchasePrice || 0,
        selling_price: data.sellingPrice || 0,
        ...(categoryId !== undefined && { categoryId }),
      }
    });
    res.json(result);
  } catch (err) {
    console.error('Update item failed:', err);
    res.status(500).json({ error: (err as Error).message });
  }
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

app.patch('/api/quotes/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const result = await prisma.salesQuote.update({
            where: { id },
            data: { status }
        });
        res.json(result);
    } catch (err) {
        console.error('Error updating quote status:', err);
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

// --- SUPPLIERS ---
app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await prisma.suppliers.findMany({
      orderBy: { created_at: 'desc' }
    });
    // Map DB columns to frontend field names
    const mapped = suppliers.map((s: any) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      email: s.email,
      currency: s.currency,
      status: s.status || 'Active',
      billingAddress: s.billing_address,
      division: s.division,
      balance: parseFloat(s.balance) || 0,
      inactive: s.inactive || false,
      createdAt: s.created_at,
      // Computed fields for the frontend table (start at 0 for new suppliers)
      purchaseOrders: 0,
      purchaseInvoices: 0,
      goodsReceipts: 0,
      qtyToReceive: 0,
    }));
    res.json(mapped);
  } catch (err) {
    console.error('Fetch suppliers failed:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/suppliers', async (req, res) => {
  const data = req.body;
  try {
    const result = await prisma.suppliers.create({
      data: {
        code: data.code,
        name: data.name,
        email: data.email || null,
        currency: data.currency || 'ZMW',
        status: data.status || 'Active',
        billing_address: data.billingAddress || null,
        division: data.division || null,
        balance: 0,
        inactive: false,
      }
    });
    res.json(result);
  } catch (err) {
    console.error('Create supplier failed:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.patch('/api/suppliers/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const result = await prisma.suppliers.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email || null,
        currency: data.currency || 'ZMW',
        status: data.status,
        billing_address: data.billingAddress || null,
        division: data.division || null,
        inactive: data.inactive ?? false,
      }
    });
    res.json(result);
  } catch (err) {
    console.error('Update supplier failed:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/suppliers/count', async (req, res) => {
  try {
    const count = await prisma.suppliers.count();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- ITEM UNITS ---
app.get('/api/item-units', async (req, res) => {
  try {
    const units = await prisma.item_units.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(units.map((u: any) => ({
      id: u.id,
      name: u.name,
      code: u.code,
      isActive: u.is_active,
      createdAt: u.created_at,
    })));
  } catch (err) {
    console.error('Fetch item units failed:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/item-units', async (req, res) => {
  const { name, code } = req.body;
  try {
    const result = await prisma.item_units.create({
      data: {
        name: name,
        code: code || name.toUpperCase().replace(/\s+/g, ''),
      }
    });
    res.json(result);
  } catch (err) {
    console.error('Create item unit failed:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/api/item-units/:id', async (req, res) => {
  try {
    await prisma.item_units.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete item unit failed:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- ITEM CATEGORIES ---
app.get('/api/item-categories', async (req, res) => {
  try {
    const categories = await prisma.itemCategory.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (err) {
    console.error('Fetch item categories failed:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/item-categories', async (req, res) => {
  const { name, description } = req.body;
  try {
    const result = await prisma.itemCategory.create({
      data: { name, description }
    });
    res.json(result);
  } catch (err) {
    console.error('Create item category failed:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.patch('/api/item-categories/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const result = await prisma.itemCategory.update({
      where: { id },
      data: { name, description }
    });
    res.json(result);
  } catch (err) {
    console.error('Update item category failed:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/api/item-categories/:id', async (req, res) => {
  try {
    await prisma.itemCategory.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete item category failed:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- INVENTORY LOCATIONS ---
app.get('/api/inventory-locations', async (req, res) => {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(locations.map((l: any) => ({
      id: l.id,
      name: l.name,
      description: l.description,
      inactive: l.inactive,
      createdAt: l.createdAt,
    })));
  } catch (err) {
    console.error('Fetch inventory locations failed:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/inventory-locations', async (req, res) => {
  const { name, description, inactive } = req.body;
  try {
    const result = await prisma.location.create({
      data: { name, description: description || null, inactive: inactive || false }
    });
    res.json(result);
  } catch (err) {
    console.error('Create inventory location failed:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.patch('/api/inventory-locations/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, inactive } = req.body;
  try {
    const result = await prisma.location.update({
      where: { id },
      data: { name, description: description || null, inactive: inactive ?? false }
    });
    res.json(result);
  } catch (err) {
    console.error('Update inventory location failed:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/api/inventory-locations/:id', async (req, res) => {
  try {
    await prisma.location.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete inventory location failed:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- INVENTORY WRITE OFFS ---
app.get('/api/inventory-write-offs', async (req, res) => {
  try {
    const writeOffs = await prisma.inventoryWriteOff.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(writeOffs);
  } catch (err) {
    console.error('Fetch inventory write-offs failed:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/inventory-write-offs', async (req, res) => {
  const { date, reference, inventoryItem, qty, amount, account, description, status, division, allocation, taxCode } = req.body;
  try {
    const result = await prisma.inventoryWriteOff.create({
      data: {
        date: new Date(date),
        reference,
        inventoryItem,
        qty,
        amount,
        account,
        description,
        status,
        division,
        allocation,
        taxCode
      }
    });
    res.json(result);
  } catch (err) {
    console.error('Create inventory write-off failed:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.patch('/api/inventory-write-offs/:id', async (req, res) => {
  const { id } = req.params;
  const { date, reference, inventoryItem, qty, amount, account, description, status, division, allocation, taxCode } = req.body;
  try {
    const result = await prisma.inventoryWriteOff.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        reference,
        inventoryItem,
        qty,
        amount,
        account,
        description,
        status,
        division,
        allocation,
        taxCode
      }
    });
    res.json(result);
  } catch (err) {
    console.error('Update inventory write-off failed:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/api/inventory-write-offs/:id', async (req, res) => {
  try {
    await prisma.inventoryWriteOff.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete inventory write-off failed:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- INVENTORY UNIT COSTS ---
app.get('/api/inventory-unit-costs', async (req, res) => {
  try {
    const unitCosts = await prisma.inventoryUnitCost.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(unitCosts);
  } catch (err) {
    console.error('Fetch inventory unit costs failed:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/inventory-unit-costs', async (req, res) => {
  const { date, itemId, itemName, unitCost, minSellingPrice, division } = req.body;
  try {
    const result = await prisma.inventoryUnitCost.create({
      data: {
        date: new Date(date),
        itemId,
        itemName,
        unitCost,
        minSellingPrice: minSellingPrice || 0,
        division
      }
    });
    res.json(result);
  } catch (err) {
    console.error('Create inventory unit cost failed:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.patch('/api/inventory-unit-costs/:id', async (req, res) => {
  const { id } = req.params;
  const { date, itemId, itemName, unitCost, minSellingPrice, division } = req.body;
  try {
    const result = await prisma.inventoryUnitCost.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        itemId,
        itemName,
        unitCost,
        minSellingPrice,
        division
      }
    });
    res.json(result);
  } catch (err) {
    console.error('Update inventory unit cost failed:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/api/inventory-unit-costs/:id', async (req, res) => {
  try {
    await prisma.inventoryUnitCost.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete inventory unit cost failed:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- FINANCE ---
app.get('/api/accounts', async (req, res) => {
  const accounts = await prisma.chartOfAccount.findMany();
  res.json(accounts);
});

// Procurement Module
app.get('/api/procurement/suggestions/:supplierId', async (req, res) => {
    try {
        const suggestions = await getProcurementSuggestions(prisma, req.params.supplierId);
        res.json(suggestions);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

app.get('/api/procurement/orders', async (req, res) => {
    const orders = await prisma.procurementOrder.findMany({
        include: { supplier: true, items: { include: { item: true } } },
        orderBy: { orderDate: 'desc' }
    });
    res.json(orders);
});

app.post('/api/procurement/orders', async (req, res) => {
    const { supplierId, reference, items, description, totalLandedCost, expenses } = req.body;
    try {
        const leadTime = await prisma.supplierLeadTime.findUnique({
            where: { supplierId }
        });
        const projectedEta = calculateETA(new Date(), leadTime);

        const result = await prisma.procurementOrder.create({
            data: {
                supplierId,
                reference,
                description,
                projectedEta,
                totalLandedCost: totalLandedCost || 0,
                expenses: {
                    create: (expenses || []).map((exp: any) => ({
                        expenseName: exp.expenseName,
                        amount: exp.amount
                    }))
                },
                items: {
                    create: items.map((item: any) => ({
                        itemId: item.itemId,
                        qty: item.qty,
                        unitPrice: item.unitPrice,
                        totalAmount: item.totalAmount,
                        landedCost: item.landedCost || null
                    }))
                }
            }
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

app.get('/api/procurement/lead-times/:supplierId', async (req, res) => {
    const leadTime = await prisma.supplierLeadTime.findUnique({
        where: { supplierId: req.params.supplierId }
    });
    res.json(leadTime || { 
        processingDays: 0, 
        productionDays: 0, 
        shippingDays: 0, 
        roadTransportDays: 0 
    });
});

app.post('/api/procurement/lead-times', async (req, res) => {
    const { supplierId, processingDays, productionDays, shippingDays, roadTransportDays } = req.body;
    const result = await prisma.supplierLeadTime.upsert({
        where: { supplierId },
        update: { processingDays, productionDays, shippingDays, roadTransportDays },
        create: { supplierId, processingDays, productionDays, shippingDays, roadTransportDays }
    });
    res.json(result);
});

// Inventory Transfers
app.get('/api/inventory-transfers', async (req, res) => {
    try {
        const transfers = await prisma.inventoryTransfer.findMany({
            include: { items: { include: { item: true } } },
            orderBy: { date: 'desc' }
        });
        res.json(transfers);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

app.post('/api/inventory-transfers', async (req, res) => {
    const { reference, date, fromLocation, toLocation, description, status, items } = req.body;
    try {
        const result = await prisma.inventoryTransfer.create({
            data: {
                reference,
                date: new Date(date),
                fromLocation,
                toLocation,
                description,
                status,
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

app.listen(PORT, () => {
  console.log(`🚀 ERP Backend running at http://localhost:${PORT}`);
});
