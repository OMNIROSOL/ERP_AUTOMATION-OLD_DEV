import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const columns: any = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'quote_items' 
    AND table_schema = 'sales'
  `;
  console.log('Columns in master.items:', JSON.stringify(columns, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
