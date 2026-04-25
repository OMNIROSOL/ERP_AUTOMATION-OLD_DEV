import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log('Connecting to database...');
    const res = await pool.query('SELECT * FROM sales.sales_quotes LIMIT 10;');
    
    console.log('--- Sales Quotes (Raw SQL) ---');
    if (res.rows.length === 0) {
      console.log('No quotes found in sales.sales_quotes table.');
    } else {
      console.log(JSON.stringify(res.rows, null, 2));
    }
    
    const itemsRes = await pool.query('SELECT * FROM sales.quote_items LIMIT 10;');
    console.log('\n--- Quote Items (Raw SQL) ---');
    console.log(JSON.stringify(itemsRes.rows, null, 2));

    console.log('\n--- Customers (Raw SQL) ---');
    const custRes = await pool.query('SELECT id, name, code FROM master.customers LIMIT 10;');
    console.log(JSON.stringify(custRes.rows, null, 2));

    console.log('\n--- Inventory Items (Raw SQL) ---');
    const itemsListRes = await pool.query('SELECT id, item_name, item_code FROM master.items LIMIT 10;');
    console.log(JSON.stringify(itemsListRes.rows, null, 2));

  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await pool.end();
  }
}

main();
