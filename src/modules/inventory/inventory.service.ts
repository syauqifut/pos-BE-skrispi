import { HttpException } from '../../exceptions/HttpException';
import pool from '../../db';
import { inventoryQueries } from './inventory.sql';
import { AdjustmentTransactionRequest, PurchaseTransactionRequest } from './validators/inventory.schema';

export interface Product {
  id: number;
  name: string;
  barcode?: string;
  image_url?: string;
  category_id?: string;
  unit_id?: string;
  is_active: boolean;
  stock_qty: number;
  purchase_price: number;
  selling_price: number;
  created_at: Date;
  updated_at: Date;
  created_by: number;
  updated_by: number;
  stock_history: any[];
}

export interface CreateProductRequest {
  name: string;
  barcode?: string;
  image_url?: string;
  category_id?: string;
  unit_id?: string;
  stock_qty?: number;
  purchase_price?: number;
  selling_price?: number;
}

export interface UpdateProductRequest {
  name?: string;
  barcode?: string;
  image_url?: string;
  category_id?: string;
  unit_id?: string;
  stock_qty?: number;
  purchase_price?: number;
  selling_price?: number;
}

export interface FindAllOptions {
  search?: string;
  category_id?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface TransactionQueryOptions {
  search?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Transaction {
  id: number;
  no: string;
  product_name: string;
  type: string;
  date: Date;
  description: string;
  created_at: Date;
  created_by: number;
}

export class InventoryService {
  /**
   * Transform raw query result to Product format
   */
  private transformProduct(row: any): Product {
    return {
      id: row.id,
      name: row.name,
      barcode: row.barcode,
      image_url: row.image_url,
      category_id: row.category_id,
      unit_id: row.unit_id,
      is_active: row.is_active,
      stock_qty: row.stock_qty,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by: row.created_by,
      updated_by: row.updated_by,
      stock_history: row.stock_history,
      purchase_price: row.purchase_price,
      selling_price: row.selling_price
    };
  }

  /**
   * Transform raw query result to Transaction format
   */
  private transformTransaction(row: any): Transaction {
    return {
      id: row.id,
      no: row.no,
      product_name: row.product_name,
      type: row.type,
      date: row.date,
      description: row.description,
      created_at: row.created_at,
      created_by: row.created_by
    };
  }

  /**
   * Build dynamic WHERE clause for search and filters
   */
  private buildWhereClause(options: FindAllOptions): { whereClause: string; values: any[] } {
    const conditions: string[] = ['p.is_active = true'];
    const values: any[] = [];
    let paramCount = 0;

    // Search functionality
    if (options.search) {
      paramCount++;
      conditions.push(`(
        p.name ILIKE $${paramCount} OR 
        p.barcode ILIKE $${paramCount}
      )`);
      values.push(`%${options.search}%`);
    }

    // Filter by category_id
    if (options.category_id) {
      paramCount++;
      conditions.push(`p.category_id = $${paramCount}`);
      values.push(options.category_id);
    }



    return {
      whereClause: conditions.join(' AND '),
      values
    };
  }

  /**
   * Build ORDER BY clause
   */
  private buildOrderClause(options: FindAllOptions): string {
    const sortBy = options.sort_by || 'name';
    const sortOrder = options.sort_order || 'ASC';
    
    // Validate sort_by field to prevent SQL injection
    const allowedSortFields = ['name', 'barcode'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    let orderByField: string;
    switch (safeSortBy) {
      case 'name':
        orderByField = 'LOWER(p.name)';
        break;
      case 'barcode':
        orderByField = 'LOWER(p.barcode)';
        break;
      default:
        orderByField = 'LOWER(p.name)';
        break;
    }
    
    
    return `ORDER BY ${orderByField} ${sortOrder}`;
  }

  /**
   * Get all products with search, filter, sort, and pagination
   */
  async findAll(options: FindAllOptions = {}): Promise<PaginatedResult<Product>> {
    try {
      const page = options.page || 1;
      const limit = options.limit || Number.MAX_SAFE_INTEGER;
      const offset = (page - 1) * limit;

      const { whereClause, values } = this.buildWhereClause(options);
      const orderClause = this.buildOrderClause(options);

      // Build final query
      const baseQuery = inventoryQueries.findAll.replace('WHERE p.is_active = true', `WHERE ${whereClause}`);
      const finalQuery = `${baseQuery} ${orderClause} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;

      // Get total count for pagination
      const countQuery = inventoryQueries.countAll.replace('WHERE p.is_active = true', `WHERE ${whereClause}`);
      const countResult = await pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated results
      const result = await pool.query(finalQuery, [...values, limit, offset]);
      const products = result.rows.map(row => this.transformProduct(row));

      return {
        data: products,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new HttpException(500, 'Internal server error while fetching products');
    }
  }

  /**
   * Get product by ID
   */
  async findById(id: number): Promise<Product> {
    try {
      const result = await pool.query(inventoryQueries.findById, [id]);
      const stockHistoryResult = await pool.query(inventoryQueries.findStockHistoryByProductId, [id]);
      const priceResult = await pool.query(inventoryQueries.findPriceByProductId, [id]);

      if (result.rows.length === 0) {
        throw new HttpException(404, 'Product not found');
      }

      return {
        ...this.transformProduct(result.rows[0]),
        stock_history: stockHistoryResult.rows,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error fetching product:', error);
      throw new HttpException(500, 'Internal server error while fetching product');
    }
  }

  /**
   * Create new product
   */
  async create(productData: CreateProductRequest, userId: number): Promise<Product> {
    try {
      console.log(productData);
      const result = await pool.query(inventoryQueries.create, [
        productData.name,
        productData.barcode || null,
        productData.image_url || null,
        productData.category_id || null,
        productData.unit_id || null,
        userId, // created_by
        userId  // updated_by
      ]);

      const productId = result.rows[0].id;

      if(productData.purchase_price && productData.selling_price) {
        const priceResult = await pool.query(inventoryQueries.insertPrice, [
          productId,
          productData.purchase_price,
          productData.selling_price,
          userId,
          userId
        ]);
      }

      const transactionNumber = await this.generateTransactionNumber('adjustment');

      const transactionResult = await pool.query(inventoryQueries.insertTransaction, [
        transactionNumber, 'adjustment', new Date(), 'Initial stock for ' + productData.name, userId
      ]);
      const transactionId = transactionResult.rows[0]?.id;
      
      const transactionItemResult = await pool.query(inventoryQueries.insertTransactionItem, [
        transactionId,
        productId,
        productData.unit_id,
        productData.stock_qty,
        'Initial stock for ' + productData.name
      ]);

      const stockResult = await pool.query(inventoryQueries.insertStock, [
        productId,
        transactionId,
        'adjustment',
        productData.stock_qty,
        productData.unit_id,
        'Initial stock for ' + productData.name,
        userId
      ]);

      return await this.findById(productId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error creating product:', error);
      throw new HttpException(500, 'Internal server error while creating product');
    }
  }

  /**
   * Update product
   */
  async update(id: number, productData: UpdateProductRequest, userId: number): Promise<Product> {
    try {
      // Check if product exists
      await this.findById(id);

      // Get current data to fill in missing fields
      const currentProduct = await this.findById(id);

      const result = await pool.query(inventoryQueries.update, [
        id,
        productData.name !== undefined ? productData.name : currentProduct.name,
        productData.barcode !== undefined ? productData.barcode : currentProduct.barcode,
        productData.image_url !== undefined ? productData.image_url : currentProduct.image_url,
        productData.category_id !== undefined ? productData.category_id : currentProduct.category_id,
        productData.unit_id !== undefined ? productData.unit_id : currentProduct.unit_id,
        userId // updated_by
      ]);

      if (result.rows.length === 0) {
        throw new HttpException(404, 'Product not found or already deleted');
      }

      if(productData.purchase_price && productData.selling_price) {
        const priceResult = await pool.query(inventoryQueries.insertPrice, [
          id,
          productData.purchase_price,
          productData.selling_price,
          userId,
          userId
        ]);
      }

      const transactionNumber = await this.generateTransactionNumber('adjustment');

      const transactionResult = await pool.query(inventoryQueries.insertTransaction, [
        transactionNumber, 'adjustment', new Date(), 'Edit stock for ' + productData.name, userId
      ]);
      const transactionId = transactionResult.rows[0]?.id;
      
      const transactionItemResult = await pool.query(inventoryQueries.insertTransactionItem, [
        transactionId,
        id,
        productData.unit_id,
        productData.stock_qty,
        'Edit stock for ' + productData.name
      ]);

      if (currentProduct.stock_qty + (productData.stock_qty || 0) < 0) {
        throw new HttpException(400, 'Stock quantity cannot be less than 0');
      }

      const negateStockResult = await pool.query(inventoryQueries.insertStock, [
        id,
        transactionId,
        'adjustment',
        currentProduct.stock_qty * (-1),
        productData.unit_id,
        'Edit stock for ' + productData.name,
        userId
      ]);

      const addStockResult = await pool.query(inventoryQueries.insertStock, [
        id,
        transactionId,
        'adjustment',
        productData.stock_qty,
        productData.unit_id,
        'Edit stock for ' + productData.name,
        userId
      ]);

      return await this.findById(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error updating product:', error);
      throw new HttpException(500, 'Internal server error while updating product');
    }
  }

  /**
   * Soft delete product
   */
  async delete(id: number, userId: number): Promise<Product> {
    try {
      // Get current product data before deletion
      const currentProduct = await this.findById(id);

      const transactionResult = await pool.query(inventoryQueries.findTransactionByProductId, [id]);
      if (transactionResult.rows.length > 1) {
        throw new HttpException(400, 'Product is used in transaction');
      }

      const result = await pool.query(inventoryQueries.softDelete, [id, userId]);

      if (result.rows.length === 0) {
        throw new HttpException(404, 'Product not found or already deleted');
      }

      // Return the product data as it was before deletion
      return currentProduct;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error deleting product:', error);
      throw new HttpException(500, 'Internal server error while deleting product');
    }
  }

  /**
   * Soft delete multiple products
   */
  async deleteMultiple(ids: number[], userId: number): Promise<Product[]> {
    try {
      const products = await Promise.all(ids.map(id => this.delete(id, userId)));
      return products;
    }
    catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error deleting multiple products:', error);
      throw new HttpException(500, 'Internal server error while deleting multiple products');
    }
  }

  /**
   * Upload product image and return image URL (does not update database)
   */
  async uploadProductImage(productId: number, filename: string, userId: number): Promise<string> {
    try {
      // Check if product exists
      const product = await this.findById(productId);
      if (!product) {
        throw new HttpException(404, 'Product not found');
      }

      // Generate image URL
      const imageUrl = `/pictures/${productId}/${filename}`;

      // Return only the image URL
      return imageUrl;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error uploading product image:', error);
      throw new HttpException(500, 'Internal server error while uploading product image');
    }
  }

  /**
   * Generate transaction number
   */

  async generateTransactionNumber(type: string): Promise<string> {
    const client = await pool.connect();
    try {
      // 1. Tentukan prefix
      const prefixMap: Record<string, string> = {
        sale: 'SAL',
        purchase: 'PUR',
        adjustment: 'ADJ'
      };
      const prefix = prefixMap[type];
      if (!prefix) throw new Error(`Unknown transaction type: ${type}`);
  
      // 2. Hitung jumlah transaksi hari ini dengan type yang sama
      const result = await pool.query(inventoryQueries.countTodayTransactionsByType, [type]);
      const count = parseInt(result.rows[0]?.count || '0', 10) + 1;
  
      // 3. Format tanggal dan counter
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
      const counterPart = count.toString().padStart(4, '0'); // 0001
  
      // 4. Gabungkan jadi nomor transaksi
      const transactionNo = `${prefix}-${datePart}-${counterPart}`;
      return transactionNo;
    } catch (error) {
      console.error('Error generating transaction number:', error);
      throw new HttpException(500, 'Gagal membuat nomor transaksi');
    } finally {
      client.release();
    }
  }

  /**
   * Build dynamic WHERE clause for transaction search and filters
   */
  private buildTransactionWhereClause(options: TransactionQueryOptions): { whereClause: string; values: any[] } {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    // Search functionality
    if (options.search) {
      paramCount++;
      conditions.push(`(
        t.no ILIKE $${paramCount} OR 
        p.name ILIKE $${paramCount} OR
        t.type ILIKE $${paramCount}
      )`);
      values.push(`%${options.search}%`);
    }

    return {
      whereClause: conditions.length > 0 ? conditions.join(' AND ') : '1=1',
      values
    };
  }

  /**
   * Build ORDER BY clause for transactions
   */
  private buildTransactionOrderClause(options: TransactionQueryOptions): string {
    const sortBy = options.sort_by || 'created_at';
    const sortOrder = options.sort_order || 'DESC';
    
    // Validate sort_by field to prevent SQL injection
    const allowedSortFields = ['no', 'product_name', 'type', 'date', 'created_at'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    let orderByField: string;
    
    switch (safeSortBy) {
      case 'no':
        orderByField = 't.no';
        break;
      case 'product_name':
        orderByField = 'LOWER(p.name)';
        break;
      case 'type':
        orderByField = 'LOWER(t.type)';
        break;
      case 'date':
        orderByField = 't.date';
        break;
      case 'created_at':
        orderByField = 's.created_at';
        break;
      default:
        orderByField = 's.created_at';
        break;
    }
    
    return `ORDER BY ${orderByField} ${sortOrder}`;
  }

  /**
   * Get all transactions with search, sort, and pagination
   */
  async findTransactionList(options: TransactionQueryOptions = {}): Promise<PaginatedResult<Transaction>> {
    try {
      const page = options.page || 1;
      const limit = options.limit || Number.MAX_SAFE_INTEGER;
      const offset = (page - 1) * limit;

      const { whereClause, values } = this.buildTransactionWhereClause(options);
      const orderClause = this.buildTransactionOrderClause(options);

      // Build final query
      const baseQuery = inventoryQueries.findTransactionList;
      const finalQuery = `${baseQuery} WHERE ${whereClause} ${orderClause} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;

      // Get total count for pagination
      const countQuery = `${inventoryQueries.countAllTransactions} WHERE ${whereClause}`;
      const countResult = await pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated results
      const result = await pool.query(finalQuery, [...values, limit, offset]);
      const transactions = result.rows.map(row => this.transformTransaction(row));

      return {
        data: transactions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new HttpException(500, 'Internal server error while fetching transactions');
    }
  }

  /**
   * Purchase transaction
   */
  async purchaseTransaction(data: PurchaseTransactionRequest, userId: number): Promise<string> {
    try {
      const transactionNumber = await this.generateTransactionNumber('purchase');
      const transactionResult = await pool.query(inventoryQueries.insertTransaction, [transactionNumber, 'purchase', new Date(), 'Purchase transaction', userId]);
      const transactionId = transactionResult.rows[0]?.id;
      
      for (const item of data.items) {
        const product = await this.findById(item.product_id);
        if (!product) {
          throw new HttpException(404, 'Product not found');
        }
        if (item.quantity < product.stock_qty) {
          throw new HttpException(400, 'Inserted quantity must be more than current stock for product ' + product.name);
        }
        const transactionItemResult = await pool.query(inventoryQueries.insertTransactionItem, [transactionId, item.product_id, product.unit_id, item.quantity, 'Purchase transaction']);
        const stockResult = await pool.query(inventoryQueries.insertStock, [item.product_id, transactionId, 'purchase', item.quantity, product.unit_id, 'Purchase transaction', userId]);
      }
      
      return transactionId;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error purchasing transaction:', error);
      throw new HttpException(500, 'Internal server error while purchasing transaction');
    }
  }

  /**
   * Adjustment transaction
   */
  async adjustmentTransaction(data: AdjustmentTransactionRequest, userId: number): Promise<string> {
    try {
      const transactionNumber = await this.generateTransactionNumber('adjustment');
      const transactionResult = await pool.query(inventoryQueries.insertTransaction, [transactionNumber, 'adjustment', new Date(), 'Adjustment transaction', userId]);
      const transactionId = transactionResult.rows[0]?.id;
      
      for (const item of data.items) {
        const product = await this.findById(item.product_id);
        if (!product) {
          throw new HttpException(404, 'Product not found');
        }
        
        const transactionItemResult = await pool.query(inventoryQueries.insertTransactionItem, [transactionId, item.product_id, product.unit_id, item.quantity, data.description]);
        if (item.quantity < 0) {
          throw new HttpException(400, 'Quantity cannot be less than 0');
        }
        const negateStockResult = await pool.query(inventoryQueries.insertStock, [item.product_id, transactionId, 'adjustment', item.quantity * (-1), product.unit_id, data.description, userId]);
        const stockResult = await pool.query(inventoryQueries.insertStock, [item.product_id, transactionId, 'adjustment', item.quantity, product.unit_id, data.description, userId]);
      }
      
      return transactionId;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error adjusting transaction:', error);
      throw new HttpException(500, 'Internal server error while adjusting transaction');
    }
  }
} 