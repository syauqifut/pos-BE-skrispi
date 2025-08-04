import * as path from 'path';
import * as fs from 'fs';
import * as xlsx from 'xlsx';
import pool from '../db';
import { generateTransactionNumber } from '../utils/transaction';

type Product = {
  name: string;
  category: string;
  unit: string;
};

type ProductPrice = {
  type: string;
  unit: string;
  purchase_price: number;
  selling_price: number;
};

type ProductData = {
    name: string;
    category: string;
    stock_qty: number;
    prices: ProductPrice[];
}

async function importProductsFromExcel() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'products.xlsx');

    if (!fs.existsSync(filePath)) {
      throw new Error('Excel file not found at ' + filePath);
    }

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const range = xlsx.utils.decode_range(worksheet['!ref']!);

    const columns = [
        'A', 'B', 'C', 'D', 'E', 'F', 'G',
        'H','I', 'J', 'K', 'L', 'M'
    ];

    let successCount = 0;
    let errorCount = 0;
    const transactionCounter = { value: 0 }; // Global counter for unique transaction numbers

    for (let row = range.s.r + 1; row <= range.e.r; row++) {
        try {
            const rowData: Record<string, string> = {};

            columns.forEach(col => {
                const cellRef = `${col}${row + 1}`; // A2, B2, dst.
                const cell = worksheet[cellRef];
                rowData[col] = cell ? String(cell.v) : ''; // string to all columns
            });

            const productData: ProductData = {
                name: rowData['A'],
                category: rowData['C'],
                stock_qty: Number(rowData['F']) || 0,
                prices: [
                    {
                        unit: rowData['H'],
                        type: 'grosir',
                        purchase_price: Number(rowData['G']) || 0,
                        selling_price: Number(rowData['J']) || 0,
                    },
                    {
                        unit: rowData['K'],
                        type: 'ecer',
                        purchase_price: Number(rowData['G']) || 0,
                        selling_price: Number(rowData['M']) || 0,
                    }
                ]
            }

            await saveData(productData, transactionCounter);
            successCount++;
            console.log(successCount);
            
        } catch (error) {
            errorCount++;
            console.error(`Error processing row ${row + 1}:`, error);
            // Continue with next row instead of stopping
            continue;
        }
    }

    console.log(`Import Summary:`);
    console.log(`Successfully imported: ${successCount} products`);
    console.log(`Failed to import: ${errorCount} products`);
    console.log(`Total rows processed: ${successCount + errorCount}`);

    if (errorCount > 0) {
        console.log(`Some products failed to import. Check the errors above.`);
        process.exit(1);
    } else {
        console.log(`Import completed successfully!`);
        process.exit(0);
    }
  } catch (err) {
    console.error('Import failed:', err);
    process.exit(1);
  }
}

//function to save product data to database
async function saveData(productData: ProductData, transactionCounter: { value: number }) {
    const { name, category, stock_qty, prices } = productData;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        /**
         * 1. loop productData.prices
         * 2. save to table products [name, category, unit]
         * 3. save to table prices [product_id, purchase_price, selling_price]
         * 4. save to table transactions [type adjustment]
         * 5. save to table transaction_items [transaction_id, product_id, qty]
         * 6. save to table stocks [product_id, stock_qty, type adjustment, transaction_id]
         */

        //1. loop productData.prices
        for (const price of prices) {
            const { type, unit, purchase_price, selling_price } = price;

            //2. save to table products [name, category, unit, barcode]
            const productName = name + ' - ' + type;
            const productBarcode = generateBarcode(category, productName);
            const productResult = await client.query(
                `INSERT INTO products (name, category_id, unit_id, barcode, created_by, updated_by)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [productName, category, unit, productBarcode, 1, 1]
            );

            const productId = productResult.rows[0].id;

            //3. save to table prices [product_id, purchase_price, selling_price]
            const priceResult = await client.query(
                `INSERT INTO prices (product_id, purchase_price, selling_price, created_by, updated_by)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [productId, purchase_price, selling_price, 1, 1]
            );

            //4. save to table transactions [type adjustment]
            transactionCounter.value++;
            const transactionNumber = generateUniqueTransactionNumber(transactionCounter.value);
            // const transactionNumber = generateTransactionNumber('adjustment', transactionCounter.value);
            const transactionResult = await client.query(
                `INSERT INTO transactions (no, type, date, description, created_by)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [transactionNumber, 'adjustment', new Date().toISOString().slice(0, 10), 'Import from Excel', 1]
            );

            const transactionId = transactionResult.rows[0].id;

            //5. save to table transaction_items [transaction_id, product_id, qty]
            const transactionItemResult = await client.query(
                `INSERT INTO transaction_items (transaction_id, product_id, unit_id, qty, description)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [transactionId, productId, unit, stock_qty, 'Import from Excel']
            );

            //6. save to table stocks [product_id, stock_qty, type adjustment, transaction_id]
            const stockResult = await client.query(
                `INSERT INTO stocks (product_id, transaction_id, type, qty, unit_id, description, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [productId, transactionId, 'adjustment', stock_qty, unit, 'Import from Excel', 1]
            );
        }

        await client.query('COMMIT');
        console.log(`Successfully imported: ${name}`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Failed to import: ${name}`, error);
        throw error;
    } finally {
        client.release();
    }
}

//private function to generate barcode, take from category + name + random number 4 digits
function generateBarcode(category: string, name: string) {
    return category + name + Math.floor(1000 + Math.random() * 9000).toString();
}

//simple function to generate unique transaction numbers for import
function generateUniqueTransactionNumber(counter: number): string {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const counterPart = counter.toString().padStart(4, '0'); // 0001, 0002, etc.
    return `ADJ-${datePart}-${counterPart}`;
}

importProductsFromExcel(); 