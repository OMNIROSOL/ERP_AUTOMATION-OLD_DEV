const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.purchaseOrder.count();
    const orders = await prisma.purchaseOrder.findMany({
      include: { supplier: true }
    });
    console.log('Total POs:', count);
    orders.forEach(o => {
      console.log(`PO ID: ${o.id}, Status: ${o.status}, Supplier: ${o.supplier?.name || 'NULL'}, Ref: ${o.reference}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
