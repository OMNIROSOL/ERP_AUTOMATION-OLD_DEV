import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const quotes = await prisma.salesQuote.findMany({
      include: {
        customer: true,
        items: {
          include: {
            item: true
          }
        }
      }
    });

    console.log('--- Sales Quotes in Database ---');
    if (quotes.length === 0) {
      console.log('No quotes found in the database.');
    } else {
      console.log(JSON.stringify(quotes, null, 2));
    }
  } catch (err) {
    console.error('Error querying Sales Quotes:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
