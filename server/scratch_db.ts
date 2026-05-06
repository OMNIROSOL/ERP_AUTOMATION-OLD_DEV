import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const notes = await prisma.deliveryNote.findMany({
    take: 5,
    select: { id: true, reference: true, status: true }
  });

  console.log('Sample Delivery Notes:');
  console.log(JSON.stringify(notes, null, 2));

  await pool.end();
}

main();
