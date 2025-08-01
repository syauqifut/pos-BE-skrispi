import pool from '../../db';
import { cashierQueries } from './cashier.sql';

interface ProductItem {
  id: number;
  qty: number;
}

interface Product {
  id: number;
  name: string;
  barcode: string;
  selling_price: number;
  unit_id: string;
}

interface CheckoutData {
  products: ProductItem[];
  total_price: number;
  payment_method: 'cash' | 'qris';
}

export class CashierService {
  /**
   * Get QRIS image static path
   */
  public getQrisPath(): string {
    return '/pictures/qris/qris.png';
  }

  /**
   * Process review order and calculate total price
   */
  public async reviewOrder(products: ProductItem[]) {
    if (!products || products.length === 0) {
      throw new Error('Products array cannot be empty');
    }

    // Extract product IDs
    const productIds = products.map(item => item.id);

    // Get products with prices from database
    const result = await pool.query(cashierQueries.getProductsByIds, [productIds]);
    const dbProducts: Product[] = result.rows;

    if (dbProducts.length !== productIds.length) {
      throw new Error('Some products not found');
    }

    // Calculate total price
    let totalPrice = 0;
    const productDetails = [];

    for (const item of products) {
      const product = dbProducts.find(p => p.id === item.id);
      if (!product) {
        throw new Error(`Product with ID ${item.id} not found`);
      }

      const itemTotal = product.selling_price * item.qty;
      totalPrice += itemTotal;

      productDetails.push({
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        qty: item.qty,
        price: product.selling_price,
        subtotal: itemTotal
      });
    }

    // Payment methods (hardcoded)
    const paymentMethods = ['cash', 'qris'];

    return {
      totalPrice,
      paymentMethods,
      products: productDetails
    };
  }

  /**
   * Process checkout and save transaction to database
   */
  public async checkout(checkoutData: CheckoutData, userId: number) {
    const { products, total_price, payment_method } = checkoutData;

    if (!products || products.length === 0) {
      throw new Error('Products array cannot be empty');
    }

    // Extract product IDs
    const productIds = products.map(item => item.id);

    // Get products with prices from database
    const result = await pool.query(cashierQueries.getProductsByIds, [productIds]);
    const dbProducts: Product[] = result.rows;

    if (dbProducts.length !== productIds.length) {
      throw new Error('Some products not found');
    }

    // Calculate total price to verify
    let calculatedTotal = 0;
    for (const item of products) {
      const product = dbProducts.find(p => p.id === item.id);
      if (!product) {
        throw new Error(`Product with ID ${item.id} not found`);
      }
      calculatedTotal += product.selling_price * item.qty;
    }

    // Verify total price matches
    if (Math.abs(calculatedTotal - total_price) > 0.01) {
      throw new Error('Total price mismatch');
    }

    // check if stock for product is enough. then check if stock reduced by amount, total is not negative
    for (const item of products) {
      const product = dbProducts.find(p => p.id === item.id);
      if (!product) {
        throw new Error(`Product with ID ${item.id} not found`);
      }
      const stock = await pool.query(cashierQueries.getProductStock, [item.id]);
      if (stock.rows[0].qty < item.qty) {
        throw new Error(`Product with ID ${item.id} has insufficient stock`);
      }
      if (stock.rows[0].qty - item.qty < 0) {
        throw new Error(`Product with ID ${item.id} has insufficient stock`);
      }
    }

    // Generate transaction number
    const todayCountResult = await pool.query(cashierQueries.getTodayTransactionCount);
    const todayCount = parseInt(todayCountResult.rows[0].count) + 1;
    const transactionNo = `SALE${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${todayCount.toString().padStart(4, '0')}`;

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create transaction record
      const transactionResult = await client.query(cashierQueries.createTransaction, [
        transactionNo,
        'sale',
        new Date().toISOString().slice(0, 10),
        `Sale transaction - ${payment_method}`,
        total_price,
        total_price, // paid_amount equals total_price for now
        payment_method,
        userId
      ]);

      const transactionId = transactionResult.rows[0].id;

      // Create transaction items and stock records
      for (const item of products) {
        const product = dbProducts.find(p => p.id === item.id);
        
        // Create transaction item
        await client.query(cashierQueries.createTransactionItem, [
          transactionId,
          item.id,
          product?.unit_id,
          item.qty,
          `Sale transaction ${transactionNo}`
        ]);

        // Create stock record (negative qty for sales)
        await client.query(cashierQueries.createStockRecord, [
          item.id,
          transactionId,
          'sale',
          item.qty * -1, // Negative for sales
          product?.unit_id, // Default unit_id
          `Sale transaction ${transactionNo}`,
          userId
        ]);
      }

      await client.query('COMMIT');

      return {
        transactionId,
        transactionNo,
        totalPrice: total_price,
        paymentMethod: payment_method,
        message: 'Transaction completed successfully'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
