import { HttpException } from '../../exceptions/HttpException';
import pool from '../../db';
import { restockRecommendationQueries } from './restockRecommendation.sql';

export interface RestockRecommendationItem {
  product_name: string;
  category_name: string;
  unit: string;
  current_stock: number;
  estimated_days_left: string | number;
}

export interface RestockRecommendationOptions {
  search?: string;
  sort_by?: 'estimated_days_left' | 'current_stock' | 'product_name';
  order?: 'asc' | 'desc';
}

export interface ProductBasicInfo {
  product_id: string;
  product_name: string;
  category_name: string;
  unit: string;
}

export interface ProductWithStock {
  product_id: string;
  product_name: string;
  category_name: string;
  unit: string;
  current_stock: number;
}

export interface ProductWithSales {
  product_id: string;
  product_name: string;
  category_name: string;
  unit: string;
  current_stock: number;
  total_sales: number;
}

export class RestockRecommendationService {
  /**
   * Get the number of days to calculate average sales from environment variable
   */
  private getAverageDays(): number {
    const avgDays = process.env.RESTOCK_AVG_DAYS;
    if (!avgDays) {
      throw new HttpException(500, 'RESTOCK_AVG_DAYS environment variable is not configured');
    }
    
    const days = parseInt(avgDays);
    if (isNaN(days) || days <= 0) {
      throw new HttpException(500, 'RESTOCK_AVG_DAYS must be a positive number');
    }
    
    return days;
  }

  /**
   * Fetch all active products from database
   */
  private async fetchActiveProducts(search?: string): Promise<ProductBasicInfo[]> {
    try {
      let query: string;
      let params: any[];

      if (search) {
        query = restockRecommendationQueries.getActiveProductsWithSearch;
        params = [search];
      } else {
        query = restockRecommendationQueries.getActiveProducts;
        params = [];
      }

      const result = await pool.query(query, params);
      
      return result.rows.map((row: any) => ({
        product_id: row.product_id?.toString() || '',
        product_name: row.product_name || 'Unknown Product',
        category_name: row.category_name || 'Uncategorized',
        unit: row.unit || 'pcs'
      }));
    } catch (error) {
      console.error('Error fetching active products:', error);
      throw new HttpException(500, 'Failed to fetch active products from database');
    }
  }

  /**
   * Fetch current stock for a specific product
   */
  private async fetchProductStock(productId: string): Promise<number> {
    try {
      const result = await pool.query(restockRecommendationQueries.getProductStock, [productId]);
      return parseInt(result.rows[0]?.current_stock || '0');
    } catch (error) {
      console.error(`Error fetching stock for product ${productId}:`, error);
      return 0;
    }
  }

  /**
   * Fetch total sales for a specific product in the last N days
   */
  private async fetchProductSales(productId: string, avgDays: number): Promise<number> {
    try {
      const result = await pool.query(restockRecommendationQueries.getProductSales, [productId, avgDays]);
      return parseInt(result.rows[0]?.total_sales || '0');
    } catch (error) {
      console.error(`Error fetching sales for product ${productId}:`, error);
      return 0;
    }
  }

  /**
   * Add stock information to products
   */
  private async addStockToProducts(products: ProductBasicInfo[]): Promise<ProductWithStock[]> {
    const productsWithStock: ProductWithStock[] = [];
    
    for (const product of products) {
      const currentStock = await this.fetchProductStock(product.product_id);
      productsWithStock.push({
        ...product,
        current_stock: currentStock
      });
    }
    
    return productsWithStock;
  }

  /**
   * Add sales information to products
   */
  private async addSalesToProducts(products: ProductWithStock[], avgDays: number): Promise<ProductWithSales[]> {
    const productsWithSales: ProductWithSales[] = [];
    
    for (const product of products) {
      const totalSales = await this.fetchProductSales(product.product_id, avgDays);
      productsWithSales.push({
        ...product,
        total_sales: totalSales
      });
    }
    
    return productsWithSales;
  }

  /**
   * Calculate average sales per day
   */
  private calculateAverageSales(totalSales: number, avgDays: number): number {
    if (avgDays <= 0) {
      return 0;
    }
    return totalSales / avgDays;
  }

  /**
   * Calculate estimated days left based on current stock and average sales
   */
  private calculateEstimatedDaysLeft(currentStock: number, totalSales: number, avgDays: number): string | number {
    const averageSales = this.calculateAverageSales(totalSales, avgDays);
    
    if (averageSales === 0) {
      return 'Stock not decreasing';
    }
    
    const estimatedDays = currentStock / averageSales;
    return Math.round(estimatedDays * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Transform products with sales data to restock recommendation items
   */
  private transformToRestockRecommendations(products: ProductWithSales[], avgDays: number): RestockRecommendationItem[] {
    return products.map(product => ({
      product_name: product.product_name,
      category_name: product.category_name,
      unit: product.unit,
      current_stock: product.current_stock,
      estimated_days_left: this.calculateEstimatedDaysLeft(
        product.current_stock,
        product.total_sales,
        avgDays
      )
    }));
  }

  /**
   * Sort products based on specified criteria
   */
  private sortProducts(products: RestockRecommendationItem[], sortBy?: string, order?: string): RestockRecommendationItem[] {
    const sortOrder = order === 'desc' ? -1 : 1;
    
    return products.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'estimated_days_left':
          comparison = this.compareEstimatedDaysLeft(a.estimated_days_left, b.estimated_days_left);
          break;
        case 'current_stock':
          comparison = a.current_stock - b.current_stock;
          break;
        case 'product_name':
          comparison = a.product_name.localeCompare(b.product_name);
          break;
        default:
          // Default sort by estimated_days_left ascending
          comparison = this.compareEstimatedDaysLeft(a.estimated_days_left, b.estimated_days_left);
          break;
      }
      
      return comparison * sortOrder;
    });
  }

  /**
   * Compare estimated days left values, handling string and number types
   */
  private compareEstimatedDaysLeft(a: string | number, b: string | number): number {
    // If both are strings (no sales), they're equal
    if (typeof a === 'string' && typeof b === 'string') {
      return 0;
    }
    
    // If one is string (no sales), it should come last
    if (typeof a === 'string') {
      return 1;
    }
    if (typeof b === 'string') {
      return -1;
    }
    
    // Both are numbers, compare normally
    return a - b;
  }

  /**
   * Get restock recommendations with optional search and sorting
   */
  async getRestockRecommendations(options: RestockRecommendationOptions = {}): Promise<RestockRecommendationItem[]> {
    try {
      const avgDays = this.getAverageDays();
      const { search, sort_by, order } = options;

      // Step 1: Fetch all active products
      const activeProducts = await this.fetchActiveProducts(search);

      // Step 2: Add stock information to each product
      const productsWithStock = await this.addStockToProducts(activeProducts);

      // Step 3: Add sales information to each product
      const productsWithSales = await this.addSalesToProducts(productsWithStock, avgDays);

      // Step 4: Transform to restock recommendation items
      const restockRecommendations = this.transformToRestockRecommendations(productsWithSales, avgDays);

      // Step 5: Sort the recommendations
      const sortedRecommendations = this.sortProducts(restockRecommendations, sort_by, order);

      return sortedRecommendations;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error fetching restock recommendations:', error);
      throw new HttpException(500, 'Failed to fetch restock recommendations');
    }
  }
} 