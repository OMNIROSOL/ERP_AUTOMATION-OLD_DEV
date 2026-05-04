import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import cors from 'cors';

const app = express();
console.log('Connecting to DB:', process.env.DATABASE_URL ? 'URL found' : 'URL MISSING');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000
});

pool.on('connect', () => console.log('Database pool connected'));
pool.on('error', (err) => console.error('Database pool error:', err));

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`>>> ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Body keys:', Object.keys(req.body || {}));
  }
  next();
});

app.get('/api/users', (req, res) => res.json([]));

const generateNextReference = async (type: string, tx: any = prisma) => {
  let count = 0;
  let prefix = '';
  
  console.log(`[REF GEN] Generating next reference for type: ${type}`);

  const getNextNum = async (model: any, pref: string) => {
    const records = await model.findMany({
      where: { reference: { startsWith: pref, mode: 'insensitive' } },
      select: { reference: true }
    });
    console.log(`[REF GEN] Found ${records.length} records starting with ${pref}`);
    let max = 0;
    records.forEach((r: any) => {
      const parts = r.reference.split('-');
      const num = parseInt(parts[parts.length - 1]);
      if (!isNaN(num) && num > max) max = num;
    });
    return max;
  };

  const getNextCodeNum = async (model: any, pref: string) => {
    const records = await model.findMany({
      where: { code: { startsWith: pref, mode: 'insensitive' } },
      select: { code: true }
    });
    let max = 0;
    records.forEach((r: any) => {
      const parts = r.code.split('-');
      const num = parseInt(parts[parts.length - 1]);
      if (!isNaN(num) && num > max) max = num;
    });
    return max;
  };

  switch (type) {
    case 'invoice': count = await getNextNum(tx.invoice, 'INV-'); prefix = 'INV'; break;
    case 'quote': count = await getNextNum(tx.salesQuote, 'SQ-'); prefix = 'SQ'; break;
    case 'order': count = await getNextNum(tx.salesOrder, 'SO-'); prefix = 'SO'; break;
    case 'delivery': count = await getNextNum(tx.deliveryNote, 'DN-'); prefix = 'DN'; break;
    case 'receipt': count = await getNextNum(tx.receipt, 'RCP-'); prefix = 'RCP'; break;
    case 'purchase-quote': count = await getNextNum(tx.purchaseQuote, 'PQ-'); prefix = 'PQ'; break;
    case 'purchase-order': count = await getNextNum(tx.purchaseOrder, 'PO-'); prefix = 'PO'; break;
    case 'purchase-invoice': count = await getNextNum(tx.invoices, 'PINV-'); prefix = 'PINV'; break;
    case 'customer': count = await getNextCodeNum(tx.customer, 'CUST-'); prefix = 'CUST'; break;
    case 'supplier': count = await getNextCodeNum(tx.suppliers, 'SUP-'); prefix = 'SUP'; break;
    case 'debit-note': prefix = 'DN'; count = Math.floor(Math.random() * 1000); break;
    case 'credit-note': prefix = 'CN'; count = Math.floor(Math.random() * 1000); break;
    default: throw new Error('Invalid document type');
  }
  
  const nextRef = `${prefix}-${(count + 1).toString().padStart(4, '0')}`;
  console.log(`[REF GEN] Result: ${nextRef}`);
  return nextRef;
};

app.get('/', (req, res) => {
  res.send('🚀 ERP Backend is running');
});

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, now: result.rows[0].now });
  } catch (err: any) {
    console.error('DB Test Failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- MASTER DATA ---
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(customers);
  } catch (err: any) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const customer = await prisma.customer.findUnique({
      where: { id }
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
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
        deliveryAddress: data.deliveryAddress,
        tpin: data.tpin,
        division: data.division,
        salesPerson: data.salesPerson,
        creditDays: data.creditDays ? parseInt(data.creditDays.toString()) : undefined,
        creditLimit: data.creditLimit ? parseFloat(data.creditLimit.toString()) : undefined,
        documentation: data.documentation,
        inactive: data.inactive || false,
        status: data.status || 'Active',
      }
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const result = await prisma.customer.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        email: data.email,
        currency: data.currency,
        billingAddress: data.billingAddress,
        deliveryAddress: data.deliveryAddress,
        tpin: data.tpin,
        division: data.division,
        salesPerson: data.salesPerson,
        creditDays: data.creditDays ? parseInt(data.creditDays.toString()) : undefined,
        creditLimit: data.creditLimit ? parseFloat(data.creditLimit.toString()) : undefined,
        documentation: data.documentation,
        inactive: data.inactive,
        status: data.status
      }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/items', async (req, res) => {
  try {
    const items = await prisma.item.findMany();
    res.json(items);
  } catch (err: any) {
    console.error('Error fetching items:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const item = await prisma.item.findUnique({
      where: { id }
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/items', async (req, res) => {
  const { itemCode, itemName, unitName, sellingPrice, purchasePrice, qtyOnHand, description } = req.body;
  try {
    const result = await prisma.item.create({
      data: { itemCode, itemName, unitName, sellingPrice, purchasePrice, qtyOnHand, description }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.put('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  const { itemCode, itemName, unitName, sellingPrice, purchasePrice, qtyOnHand, description } = req.body;
  try {
    const result = await prisma.item.update({
      where: { id },
      data: { itemCode, itemName, unitName, sellingPrice, purchasePrice, qtyOnHand, description }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- DIVISIONS ---
app.get('/api/divisions', async (req, res) => {
  try {
    const divisions = await prisma.division.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(divisions);
  } catch (err: any) {
    console.error('Error fetching divisions:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/divisions', async (req, res) => {
  const { name, description } = req.body;
  try {
    const result = await prisma.division.create({
      data: { name, description }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/api/divisions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.division.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- SALES ---
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { customer: true, items: { include: { item: true, tax_codes: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(invoices);
  } catch (err: any) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invoices/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { customer: true, items: { include: { item: true, tax_codes: true } } }
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
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
            description: item.description,
            qty: item.qty,
            unitPrice: item.unitPrice,
            discount: item.discount,
            division: item.division,
            tax_code_id: item.tax_code_id,
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

app.put('/api/invoices/:id', async (req, res) => {
  const { id } = req.params;
  const { customerId, reference, items, grandTotal, balanceDue, docOptions } = req.body;
  try {
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
    const result = await prisma.invoice.update({
      where: { id },
      data: {
        customerId,
        reference,
        grandTotal,
        balanceDue,
        docOptions: docOptions || {},
        items: {
          create: items.map((item: any) => ({
            itemId: item.itemId,
            description: item.description,
            qty: item.qty,
            unitPrice: item.unitPrice,
            discount: item.discount,
            division: item.division,
            tax_code_id: item.tax_code_id,
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

app.patch('/api/invoices/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await prisma.invoice.update({
      where: { id },
      data: { status }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Sales Quotes
app.get('/api/quotes', async (req, res) => {
  try {
    const quotes = await prisma.salesQuote.findMany({
      include: { customer: true, items: { include: { item: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(quotes);
  } catch (err: any) {
    console.error('Error fetching quotes:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/quotes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const quote = await prisma.salesQuote.findUnique({
      where: { id },
      include: { customer: true, items: { include: { item: true } } }
    });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    res.json(quote);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/quotes', async (req, res) => {
  const { customerId, reference, items, amount, currency, description, billingAddress, expiryDays, docOptions, issueDate, status } = req.body;
  try {
    const result = await prisma.salesQuote.create({
      data: {
        customerId,
        reference,
        amount,
        currency,
        description,
        billingAddress,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        status: status || 'Active',
        expiryDays: parseInt(expiryDays) || 30,
        docOptions: docOptions || {},
        items: {
          create: items.map((item: any) => ({
            itemId: item.itemId,
            description: item.description,
            qty: item.qty,
            unitPrice: item.unitPrice,
            discount: item.discount,
            division: item.division,
            taxCode: item.taxCode,
            totalAmount: item.totalAmount
          }))
        }
      }
    });
    res.json(result);
  } catch (err) {
    console.error('Error creating quote:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});


app.patch('/api/quotes/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await prisma.salesQuote.update({
      where: { id },
      data: { status }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.put('/api/quotes/:id', async (req, res) => {
  const { id } = req.params;
  const { customerId, reference, items, amount, currency, description, billingAddress, expiryDays, docOptions, status } = req.body;
  try {
    await prisma.quoteItem.deleteMany({ where: { quoteId: id } });
    const result = await prisma.salesQuote.update({
      where: { id },
      data: {
        customerId,
        reference,
        amount,
        currency,
        description,
        billingAddress,
        expiryDays: parseInt(expiryDays) || 30,
        docOptions: docOptions || {},
        status: status || 'Active',
        items: {
          create: items.map((item: any) => ({
            itemId: item.itemId,
            description: item.description,
            qty: item.qty,
            unitPrice: item.unitPrice,
            discount: item.discount,
            division: item.division,
            taxCode: item.taxCode,
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

app.post('/api/quotes/:id/convert', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const quote = await tx.salesQuote.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!quote) throw new Error('Quote not found');

      const order = await tx.salesOrder.create({
        data: {
          customerId: quote.customerId,
          reference: quote.reference,
          amount: Number(quote.amount),
          currency: quote.currency,
          description: quote.description,
          billingAddress: quote.billingAddress,
          orderDate: new Date(),
          status: 'Ordered',
          docOptions: quote.docOptions || {},
          items: {
            create: quote.items.map((item: any) => ({
              itemId: item.itemId,
              description: item.description,
              qty: Number(item.qty),
              unitPrice: Number(item.unitPrice),
              discount: Number(item.discount || 0),
              division: item.division,
              taxCode: item.taxCode,
              totalAmount: Number(item.totalAmount)
            }))
          }
        }
      });

      await tx.salesQuote.update({
        where: { id },
        data: { status: 'Accepted' }
      });

      return order;
    });

    res.json(result);
  } catch (err: any) {
    console.error('Conversion error:', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'A sales order with this reference already exists.' });
    }
    res.status(500).json({ error: err.message || 'Failed to convert quote' });
  }
});

app.delete('/api/quotes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.salesQuote.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});


// Sales Orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await prisma.salesOrder.findMany({
      include: { customer: true, items: { include: { item: true } } },
      orderBy: { createdAt: 'desc' }
    });
    const ordersWithQty = orders.map(o => ({
      ...o,
      qtyReserved: o.items.reduce((sum, item) => sum + Number(item.qty), 0)
    }));
    res.json(ordersWithQty);
  } catch (err: any) {
    console.error('Fetch orders error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: { customer: true, items: { include: { item: true } } }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const orderWithQty = {
      ...order,
      qtyReserved: order.items.reduce((sum, item) => sum + Number(item.qty), 0)
    };
    res.json(orderWithQty);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/orders', async (req, res) => {
  const { customerId, reference, items, amount, currency, description, billingAddress, docOptions, orderDate } = req.body;
  console.log('--- CREATE ORDER REQUEST ---');
  console.log('Body:', JSON.stringify(req.body, null, 2));
  try {
    console.log('Validating items...');
    if (!items || !Array.isArray(items)) throw new Error('Items must be an array');
    
    const prismaData: any = {
      customerId,
      reference,
      amount: Number(amount || 0),
      currency: currency || 'ZMW',
      description,
      billingAddress,
      orderDate: (orderDate && !isNaN(new Date(orderDate).getTime())) ? new Date(orderDate) : new Date(),
      docOptions: docOptions || {},
      items: {
        create: items.map((item: any, idx: number) => {
          if (!item.itemId) {
            console.error(`Item at index ${idx} is missing itemId`, item);
            throw new Error(`Item at index ${idx} is missing itemId`);
          }
          return {
            itemId: item.itemId,
            description: item.description,
            qty: Number(item.qty || 0),
            unitPrice: Number(item.unitPrice || 0),
            discount: Number(item.discount || 0),
            division: item.division || 'General',
            taxCode: item.taxCode || 'No tax',
            totalAmount: Number(item.totalAmount || 0)
          };
        })
      }
    };
    
    console.log('Sending to Prisma:', JSON.stringify(prismaData, (key, value) => 
      key === 'items' ? undefined : value, 2)); // Hide items to keep log clean
    console.log('Items count:', prismaData.items.create.length);

    const result = await prisma.salesOrder.create({
      data: prismaData
    });
    res.json(result);
  } catch (err: any) {
    console.error('CREATE ORDER ERROR:', err);
    res.status(500).json({ error: err.message, detailed: err });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { customerId, reference, items, amount, currency, description, billingAddress, docOptions, status, orderDate } = req.body;
  console.log('--- UPDATE ORDER REQUEST ---');
  console.log('ID:', id);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  try {
    await prisma.quoteItem.deleteMany({ where: { orderId: id } });
    const result = await prisma.salesOrder.update({
      where: { id },
      data: {
        customerId,
        reference,
        amount: Number(amount),
        currency,
        description,
        billingAddress,
        status: status || 'Ordered',
        orderDate: orderDate ? new Date(orderDate) : undefined,
        docOptions: docOptions || {},
        items: {
          create: items.map((item: any) => ({
            itemId: item.itemId,
            description: item.description,
            qty: Number(item.qty),
            unitPrice: Number(item.unitPrice),
            discount: Number(item.discount || 0),
            division: item.division,
            taxCode: item.taxCode,
            totalAmount: Number(item.totalAmount)
          }))
        }
      }
    });
    res.json(result);
  } catch (err: any) {
    console.error('UPDATE ORDER ERROR:', err);
    res.status(500).json({ error: err.message, detailed: err });
  }
});

app.patch('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await prisma.salesOrder.update({
      where: { id },
      data: { status }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Delivery Notes
app.get('/api/delivery-notes', async (req, res) => {
  try {
    const notes = await prisma.deliveryNote.findMany({
      include: { customer: true, items: { include: { item: true } } },
      orderBy: { timestamp: 'desc' }
    });
    res.json(notes);
  } catch (err: any) {
    console.error('Fetch delivery notes error:', err);
    res.status(500).json({ error: err.message });
  }
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

// --- SUPPLIERS ---
app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await prisma.suppliers.findMany();
    res.json(suppliers);
  } catch (err: any) {
    console.error('Fetch suppliers error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/suppliers', async (req, res) => {
  const { code, name, email, currency, billingAddress, status } = req.body;
  try {
    const result = await prisma.suppliers.create({
      data: { code, name, email, currency, billingAddress, status: status || 'Paid' }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.put('/api/suppliers/:id', async (req, res) => {
  const { id } = req.params;
  const { code, name, email, currency, billingAddress, status } = req.body;
  try {
    const result = await prisma.suppliers.update({
      where: { id },
      data: { code, name, email, currency, billingAddress, status }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- RECEIPTS ---
app.get('/api/receipts', async (req, res) => {
  try {
    const receipts = await prisma.receipt.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(receipts);
  } catch (err: any) {
    console.error('Fetch receipts error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/receipts', async (req, res) => {
  const { reference, date, paidByContact, receivedInAccount, description, amount, currency, status } = req.body;
  try {
    const result = await prisma.receipt.create({
      data: {
        reference,
        date: date ? new Date(date) : undefined,
        paidByContact,
        receivedInAccount,
        description,
        amount,
        currency,
        status: status || 'Completed'
      }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- TAX CODES ---
app.get('/api/tax-codes', async (req, res) => {
  try {
    const codes = await prisma.tax_codes.findMany();
    res.json(codes);
  } catch (err: any) {
    console.error('Fetch tax codes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- REFERENCE GENERATION ---
app.get('/api/reference/next/:type', async (req, res) => {
  const { type } = req.params;
  try {
    const nextRef = await generateNextReference(type);
    res.json({ nextRef });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- FINANCE ---
app.get('/api/accounts', async (req, res) => {
  try {
    const accounts = await prisma.chartOfAccount.findMany({
      orderBy: { code: 'asc' }
    });
    res.json(accounts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bank-accounts', async (req, res) => {
  try {
    const accounts = await prisma.chartOfAccount.findMany({
      where: { isPaymentAccount: true },
      orderBy: { name: 'asc' }
    });
    res.json(accounts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- MASTER ---
app.get('/api/divisions', async (req, res) => {
  try {
    const divisions = await prisma.division.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(divisions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/divisions', async (req, res) => {
  try {
    const result = await prisma.division.create({ data: req.body });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/divisions/:id', async (req, res) => {
  try {
    await prisma.division.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tax-codes', async (req, res) => {
  try {
    const codes = await prisma.tax_codes.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(codes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- INVENTORY ---
app.get('/api/locations', async (req, res) => {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(locations);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inventory-transfers', (req, res) => res.json([]));
app.get('/api/inventory-write-offs', (req, res) => res.json([]));
app.get('/api/debit-notes', (req, res) => res.json([]));
app.get('/api/credit-notes', (req, res) => res.json([]));

// --- PROCUREMENT ---
// Purchase schema not fully defined yet, omitted.

app.get('/api/purchase-invoices', async (req, res) => {
  const invs = await prisma.invoices.findMany({
    include: { suppliers: true },
    orderBy: { created_at: 'desc' }
  });
  res.json(invs);
});

// --- FOOTERS ---
app.get('/api/footers', async (req, res) => {
  try {
    const footers = await prisma.footer.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(footers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/footers', async (req, res) => {
  try {
    const result = await prisma.footer.create({ data: req.body });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/footers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, content } = req.body;
    const result = await prisma.footer.update({
      where: { id },
      data: { name, content }
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/footers/:id', async (req, res) => {
  try {
    await prisma.footer.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 ERP Backend running at http://localhost:${PORT}`);
});
