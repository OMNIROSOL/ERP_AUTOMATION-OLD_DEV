import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

async function check() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const customerCount = await prisma.customer.count();
    const quoteCount = await prisma.salesQuote.count();
    const itemCount = await prisma.item.count();
    const invoiceCount = await prisma.invoice.count();

    console.log('--- DATABASE STATUS ---');
    console.log(`Customers: ${customerCount}`);
    console.log(`Sales Quotes: ${quoteCount}`);
    console.log(`Items: ${itemCount}`);
    console.log(`Invoices: ${invoiceCount}`);
    
    if (quoteCount > 0) {
      const latestQuote = await prisma.salesQuote.findFirst({
        include: { customer: true }
      });
      console.log(`Latest Quote: ${latestQuote?.reference} for ${latestQuote?.customer.name}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

check();
