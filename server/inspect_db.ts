import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  try {
    const columns: any = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'sales' AND table_name = 'quote_items'
    `;
    console.log('Columns in sales.quote_items:');
    console.table(columns);
    
    const ordersColumns: any = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'sales' AND table_name = 'sales_orders'
    `;
    console.log('Columns in sales.sales_orders:');
    console.table(ordersColumns);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
