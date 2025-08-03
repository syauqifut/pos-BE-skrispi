import { HttpException } from '../../exceptions/HttpException';
import pool from '../../db';
import { reportQueries } from './report.sql';

export interface DashboardData {
  revenue: {
    current: number;
    before: number;
    growth_percentage: number;
  };
  transaction: {
    current: number;
    before: number;
    growth_percentage: number;
  };
  profit: {
    current: number;
    before: number;
    growth_percentage: number;
  };
  top_products_current: Array<{
    name: string;
    image: string;
    sold: number;
  }>;
}

export interface SalesData {
  sales: {
    current: number;
    before: number;
    growth_percentage: number;
  };
  transaction: {
    current: number;
    before: number;
    growth_percentage: number;
  };
  avg_sales: {
    current: number;
    before: number;
    growth_percentage: number;
  };
  payment_method: Array<{
    method: string;
    total: number;
    percent: number;
  }>;
}

export interface ProfitReportData {
  profit: {
    current: number;
    before: number;
    growth_percentage: number;
  };
  profit_margin: {
    percentage: number;
    revenue: number;
    cost: number;
  };
  sales_history: Array<{
    transaction_id: string;
    revenue: number;
    profit: number;
  }>;
}

export interface SalesProductsData {
  top_products: Array<{
    rank: number;
    product_id: string;
    product_name: string;
    image_url: string;
    quantity: number;
    trend: 'up' | 'down';
  }>;
  sales_by_category: {
    total_sales: number;
    categories: Array<{
      category_name: string;
      quantity: number;
      color: string;
    }>;
  };
  inventories: Array<{
    product_id: string;
    product_name: string;
    image_url: string;
    stock: number;
    unit: string;
    threshold: number;
    is_below_threshold: boolean;
  }>;
}

export interface RestockReportData {
  summary: {
    total_cost: {
      current: number;
      before: number;
      growth_percentage: number;
    };
    total_restock: {
      current: number;
      before: number;
      growth_percentage: number;
    };
    average_cost_per_product: {
      current: number;
      before: number;
      growth_percentage: number;
    };
  };
  restock_items: Array<{
    product_id: string;
    product_name: string;
    product_image: string;
    qty: number;
    price: number;
    total: number;
  }>;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface DashboardOptions {
  startDate?: string;
  endDate?: string;
}

export interface TopProduct {
  name: string;
  image: string;
  sold: number;
}

export class ReportService {
  /**
   * Calculate growth percentage between two values
   */
  private calculateGrowthPercentage(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }

  /**
   * Parse and validate date range
   */
  private parseDateRange(options: DashboardOptions): DateRange {
    let startDate: string;
    let endDate: string;

    if (options.startDate && options.endDate) {
      // Custom date range provided
      startDate = options.startDate;
      endDate = options.endDate;
    } else {
      // Default to today only
      const today = new Date().toISOString().split('T')[0];
      startDate = today;
      endDate = today;
    }

    return { startDate, endDate };
  }

  /**
   * Calculate comparison date range (previous period of same length)
   */
  private calculateComparisonDateRange(startDate: string, endDate: string): DateRange {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const comparisonStart = new Date(start);
    comparisonStart.setDate(start.getDate() - daysDiff);
    
    const comparisonEnd = new Date(start);
    comparisonEnd.setDate(start.getDate() - 1);

    return {
      startDate: comparisonStart.toISOString().split('T')[0],
      endDate: comparisonEnd.toISOString().split('T')[0]
    };
  }

  /**
   * Get revenue data for date range and comparison period
   */
  private async getRevenueData(dateRange: DateRange, comparisonRange: DateRange): Promise<{ current: number; before: number }> {
    try {
      const [currentResult, beforeResult] = await Promise.all([
        pool.query(reportQueries.getRevenue, [dateRange.startDate, dateRange.endDate]),
        pool.query(reportQueries.getRevenueComparison, [comparisonRange.startDate, comparisonRange.endDate])
      ]);

      const current = parseFloat(currentResult.rows[0]?.revenue || '0');
      const before = parseFloat(beforeResult.rows[0]?.revenue || '0');

      return { current, before };
    } catch (error) {
      throw new HttpException(500, 'Failed to fetch revenue data');
    }
  }

  /**
   * Get transaction count data for date range and comparison period
   */
  private async getTransactionData(dateRange: DateRange, comparisonRange: DateRange): Promise<{ current: number; before: number }> {
    try {
      const [currentResult, beforeResult] = await Promise.all([
        pool.query(reportQueries.getTransactions, [dateRange.startDate, dateRange.endDate]),
        pool.query(reportQueries.getTransactionsComparison, [comparisonRange.startDate, comparisonRange.endDate])
      ]);

      const current = parseInt(currentResult.rows[0]?.count || '0');
      const before = parseInt(beforeResult.rows[0]?.count || '0');

      return { current, before };
    } catch (error) {
      throw new HttpException(500, 'Failed to fetch transaction data');
    }
  }

  /**
   * Get profit data for date range and comparison period
   */
  private async getProfitData(dateRange: DateRange, comparisonRange: DateRange): Promise<{ current: number; before: number }> {
    try {
      const [currentResult, beforeResult] = await Promise.all([
        pool.query(reportQueries.getProfit, [dateRange.startDate, dateRange.endDate]),
        pool.query(reportQueries.getProfitComparison, [comparisonRange.startDate, comparisonRange.endDate])
      ]);

      const current = parseFloat(currentResult.rows[0]?.profit || '0');
      const before = parseFloat(beforeResult.rows[0]?.profit || '0');

      return { current, before };
    } catch (error) {
      throw new HttpException(500, 'Failed to fetch profit data');
    }
  }

  /**
   * Get top selling products for date range
   */
  private async getTopProducts(dateRange: DateRange): Promise<TopProduct[]> {
    try {
      const result = await pool.query(reportQueries.getTopProducts, [dateRange.startDate, dateRange.endDate]);
      
      return result.rows.map((row: any) => ({
        name: row.name || 'Unknown Product',
        image: row.image || '/img/default-product.png',
        sold: parseInt(row.sold || '0')
      }));
    } catch (error) {
      throw new HttpException(500, 'Failed to fetch top products data');
    }
  }

  /**
   * Get sales data for date range and comparison period
   */
  private async getSalesDataForRange(dateRange: DateRange, comparisonRange: DateRange): Promise<{ current: number; before: number }> {
    try {
      const [currentResult, beforeResult] = await Promise.all([
        pool.query(reportQueries.getSales, [dateRange.startDate, dateRange.endDate]),
        pool.query(reportQueries.getSalesComparison, [comparisonRange.startDate, comparisonRange.endDate])
      ]);

      const current = parseFloat(currentResult.rows[0]?.sales || '0');
      const before = parseFloat(beforeResult.rows[0]?.sales || '0');

      return { current, before };
    } catch (error) {
      throw new HttpException(500, 'Failed to fetch sales data');
    }
  }

  /**
   * Get average sales data for date range and comparison period
   */
  private async getAvgSalesData(dateRange: DateRange, comparisonRange: DateRange): Promise<{ current: number; before: number }> {
    try {
      const [currentResult, beforeResult] = await Promise.all([
        pool.query(reportQueries.getAvgSales, [dateRange.startDate, dateRange.endDate]),
        pool.query(reportQueries.getAvgSalesComparison, [comparisonRange.startDate, comparisonRange.endDate])
      ]);

      const current = parseFloat(currentResult.rows[0]?.avg_sales || '0');
      const before = parseFloat(beforeResult.rows[0]?.avg_sales || '0');

      return { current, before };
    } catch (error) {
      throw new HttpException(500, 'Failed to fetch average sales data');
    }
  }

  /**
   * Get payment method breakdown for date range
   */
  private async getPaymentMethods(dateRange: DateRange): Promise<Array<{ method: string; total: number; percent: number }>> {
    try {
      const result = await pool.query(reportQueries.getPaymentMethods, [dateRange.startDate, dateRange.endDate]);
      
      const paymentMethods = result.rows.map((row: any) => ({
        method: row.method || 'cash',
        total: parseFloat(row.total || '0'),
        percent: 0 // Will be calculated below
      }));

      // Calculate total for percentage calculation
      const totalAmount = paymentMethods.reduce((sum, method) => sum + method.total, 0);

      // Calculate percentages
      if (totalAmount > 0) {
        paymentMethods.forEach(method => {
          method.percent = Math.round((method.total / totalAmount) * 100);
        });
      }

      // Ensure we have both Cash and QRIS methods
      const methods = ['cash', 'qris'];
      const finalMethods = methods.map(methodName => {
        const existing = paymentMethods.find(pm => pm.method === methodName);
        return existing || { method: methodName, total: 0, percent: 0 };
      });

      return finalMethods;
    } catch (error) {
      throw new HttpException(500, 'Failed to fetch payment methods data');
    }
  }

  /**
   * Get dashboard data including all metrics
   */
  async getDashboardData(options: DashboardOptions = {}): Promise<DashboardData> {
    try {
      // Parse date range
      const dateRange = this.parseDateRange(options);
      const comparisonRange = this.calculateComparisonDateRange(dateRange.startDate, dateRange.endDate);

      // Fetch all data in parallel for better performance
      const [revenueData, transactionData, profitData, topProducts] = await Promise.all([
        this.getRevenueData(dateRange, comparisonRange),
        this.getTransactionData(dateRange, comparisonRange),
        this.getProfitData(dateRange, comparisonRange),
        this.getTopProducts(dateRange)
      ]);

      // Calculate growth percentages
      const revenueGrowth = this.calculateGrowthPercentage(revenueData.current, revenueData.before);
      const transactionGrowth = this.calculateGrowthPercentage(transactionData.current, transactionData.before);
      const profitGrowth = this.calculateGrowthPercentage(profitData.current, profitData.before);

      return {
        revenue: {
          current: revenueData.current,
          before: revenueData.before,
          growth_percentage: revenueGrowth
        },
        transaction: {
          current: transactionData.current,
          before: transactionData.before,
          growth_percentage: transactionGrowth
        },
        profit: {
          current: profitData.current,
          before: profitData.before,
          growth_percentage: profitGrowth
        },
        top_products_current: topProducts
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(500, 'Failed to fetch dashboard data');
    }
  }

  /**
   * Get profit data for specific date
   */
  private async getProfitForDate(date: string): Promise<number> {
    try {
      const result = await pool.query(reportQueries.getProfitForDate, [date]);
      return parseFloat(result.rows[0]?.profit || '0');
    } catch (error) {
      console.error('Error fetching profit data:', error);
      return 0;
    }
  }

  /**
   * Get profit data for previous day
   */
  private async getProfitForPreviousDay(date: string): Promise<number> {
    try {
      const result = await pool.query(reportQueries.getProfitForPreviousDay, [date]);
      return parseFloat(result.rows[0]?.profit || '0');
    } catch (error) {
      console.error('Error fetching previous day profit data:', error);
      // Return 0 instead of throwing error to handle cases where there's no data
      return 0;
    }
  }

  /**
   * Get revenue for specific date
   */
  private async getRevenueForDate(date: string): Promise<number> {
    try {
      const result = await pool.query(reportQueries.getRevenueForDate, [date]);
      return parseFloat(result.rows[0]?.revenue || '0');
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      return 0;
    }
  }

  /**
   * Get cost (COGS) for specific date
   */
  private async getCostForDate(date: string): Promise<number> {
    try {
      const result = await pool.query(reportQueries.getCostForDate, [date]);
      return parseFloat(result.rows[0]?.cost || '0');
    } catch (error) {
      console.error('Error fetching cost data:', error);
      return 0;
    }
  }

  /**
   * Get sales history for specific date
   */
  private async getSalesHistoryForDate(date: string): Promise<Array<{ transaction_id: string; revenue: number; profit: number }>> {
    try {
      const result = await pool.query(reportQueries.getSalesHistoryForDate, [date]);
      
      return result.rows.map((row: any) => ({
        transaction_id: row.transaction_id || 'Unknown',
        revenue: parseFloat(row.revenue || '0'),
        profit: parseFloat(row.profit || '0')
      }));
    } catch (error) {
      console.error('Error fetching sales history data:', error);
      return [];
    }
  }

  /**
   * Calculate profit margin percentage
   */
  private calculateProfitMargin(revenue: number, cost: number): number {
    if (revenue === 0) return 0;
    return Math.round(((revenue - cost) / revenue) * 100 * 10) / 10;
  }

  /**
   * Get sales report data including all metrics
   */
  async getSalesData(options: DashboardOptions = {}): Promise<SalesData> {
    try {
      // Parse date range
      const dateRange = this.parseDateRange(options);
      const comparisonRange = this.calculateComparisonDateRange(dateRange.startDate, dateRange.endDate);

      // Fetch all data in parallel for better performance
      const [salesData, transactionData, avgSalesData, paymentMethods] = await Promise.all([
        this.getSalesDataForRange(dateRange, comparisonRange),
        this.getTransactionData(dateRange, comparisonRange),
        this.getAvgSalesData(dateRange, comparisonRange),
        this.getPaymentMethods(dateRange)
      ]);

      // Calculate growth percentages
      const salesGrowth = this.calculateGrowthPercentage(salesData.current, salesData.before);
      const transactionGrowth = this.calculateGrowthPercentage(transactionData.current, transactionData.before);
      const avgSalesGrowth = this.calculateGrowthPercentage(avgSalesData.current, avgSalesData.before);

      return {
        sales: {
          current: salesData.current,
          before: salesData.before,
          growth_percentage: salesGrowth
        },
        transaction: {
          current: transactionData.current,
          before: transactionData.before,
          growth_percentage: transactionGrowth
        },
        avg_sales: {
          current: avgSalesData.current,
          before: avgSalesData.before,
          growth_percentage: avgSalesGrowth
        },
        payment_method: paymentMethods
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(500, 'Failed to fetch sales data');
    }
  }

  /**
   * Get daily profit report data
   */
  async getProfitReport(date?: string): Promise<ProfitReportData> {
    try {
      // Use provided date or default to today
      const targetDate = date || new Date().toISOString().split('T')[0];

      // Fetch all data in parallel for better performance
      const [currentProfit, previousProfit, revenue, cost, salesHistory] = await Promise.all([
        this.getProfitForDate(targetDate),
        this.getProfitForPreviousDay(targetDate),
        this.getRevenueForDate(targetDate),
        this.getCostForDate(targetDate),
        this.getSalesHistoryForDate(targetDate)
      ]);

      // Calculate growth percentage
      const profitGrowth = this.calculateGrowthPercentage(currentProfit, previousProfit);

      // Calculate profit margin
      const profitMarginPercentage = this.calculateProfitMargin(revenue, cost);

      return {
        profit: {
          current: currentProfit,
          before: previousProfit,
          growth_percentage: profitGrowth
        },
        profit_margin: {
          percentage: profitMarginPercentage,
          revenue: revenue,
          cost: cost
        },
        sales_history: salesHistory
      };
    } catch (error) {
      console.error('Error in getProfitReport:', error);
      // Return default data structure instead of throwing error
      return {
        profit: {
          current: 0,
          before: 0,
          growth_percentage: 0
        },
        profit_margin: {
          percentage: 0,
          revenue: 0,
          cost: 0
        },
        sales_history: []
      };
    }
  }

  /**
   * Get top products for date range
   */
  private async getTopProductsForRange(dateRange: DateRange): Promise<Array<{ product_id: string; product_name: string; image_url: string; quantity: number }>> {
    try {
      const result = await pool.query(reportQueries.getTopProductsForRange, [dateRange.startDate, dateRange.endDate]);
      
      return result.rows.map((row: any) => ({
        product_id: row.product_id?.toString() || '',
        product_name: row.product_name || 'Unknown Product',
        image_url: row.image_url || '/img/default-product.png',
        quantity: parseInt(row.quantity || '0')
      }));
    } catch (error) {
      console.error('Error fetching top products:', error);
      return [];
    }
  }

  /**
   * Get top products for comparison period
   */
  private async getTopProductsForComparison(comparisonRange: DateRange): Promise<Array<{ product_id: string; quantity: number }>> {
    try {
      const result = await pool.query(reportQueries.getTopProductsForComparison, [comparisonRange.startDate, comparisonRange.endDate]);
      
      return result.rows.map((row: any) => ({
        product_id: row.product_id?.toString() || '',
        quantity: parseInt(row.quantity || '0')
      }));
    } catch (error) {
      console.error('Error fetching comparison top products:', error);
      return [];
    }
  }

  /**
   * Get sales by category for date range
   */
  private async getSalesByCategory(dateRange: DateRange): Promise<Array<{ category_name: string; quantity: number }>> {
    try {
      const result = await pool.query(reportQueries.getSalesByCategory, [dateRange.startDate, dateRange.endDate]);
      
      return result.rows.map((row: any) => ({
        category_name: row.category_name || 'Uncategorized',
        quantity: parseInt(row.quantity || '0')
      }));
    } catch (error) {
      console.error('Error fetching sales by category:', error);
      return [];
    }
  }

  /**
   * Get total sales count for date range
   */
  private async getTotalSalesCount(dateRange: DateRange): Promise<number> {
    try {
      const result = await pool.query(reportQueries.getTotalSalesCount, [dateRange.startDate, dateRange.endDate]);
      return parseInt(result.rows[0]?.total_sales || '0');
    } catch (error) {
      console.error('Error fetching total sales count:', error);
      return 0;
    }
  }

  /**
   * Get low stock products
   */
  private async getLowStockProducts(): Promise<Array<{ product_id: string; product_name: string; image_url: string; stock: number; unit: string; threshold: number; is_below_threshold: boolean }>> {
    try {
      const result = await pool.query(reportQueries.getLowStockProducts);
      
      return result.rows.map((row: any) => ({
        product_id: row.product_id?.toString() || '',
        product_name: row.product_name || 'Unknown Product',
        image_url: row.image_url || '/img/default-product.png',
        stock: parseInt(row.stock || '0'),
        unit: row.unit || 'pcs',
        threshold: parseInt(row.threshold || '15'),
        is_below_threshold: parseInt(row.stock || '0') < parseInt(row.threshold || '15')
      }));
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      return [];
    }
  }

  /**
   * Generate random color for category
   */
  private generateCategoryColor(categoryName: string): string {
    const colors = [
      '#5F6CFF', '#38D4FF', '#FF6B6B', '#4ECDC4', '#45B7D1',
      '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
    ];
    
    // Simple hash function to get consistent color for same category
    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      const char = categoryName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Get restock cost data for date range and comparison period
   */
  private async getRestockCostData(dateRange: DateRange, comparisonRange: DateRange): Promise<{ current: number; before: number }> {
    try {
      const [currentResult, beforeResult] = await Promise.all([
        pool.query(reportQueries.getRestockCost, [dateRange.startDate, dateRange.endDate]),
        pool.query(reportQueries.getRestockCostComparison, [comparisonRange.startDate, comparisonRange.endDate])
      ]);

      const current = parseFloat(currentResult.rows[0]?.total_cost || '0');
      const before = parseFloat(beforeResult.rows[0]?.total_cost || '0');

      return { current, before };
    } catch (error) {
      throw new HttpException(500, 'Failed to fetch restock cost data');
    }
  }

  /**
   * Get restock count data for date range and comparison period
   */
  private async getRestockCountData(dateRange: DateRange, comparisonRange: DateRange): Promise<{ current: number; before: number }> {
    try {
      const [currentResult, beforeResult] = await Promise.all([
        pool.query(reportQueries.getRestockCount, [dateRange.startDate, dateRange.endDate]),
        pool.query(reportQueries.getRestockCountComparison, [comparisonRange.startDate, comparisonRange.endDate])
      ]);

      const current = parseInt(currentResult.rows[0]?.total_restock || '0');
      const before = parseInt(beforeResult.rows[0]?.total_restock || '0');

      return { current, before };
    } catch (error) {
      throw new HttpException(500, 'Failed to fetch restock count data');
    }
  }

  /**
   * Get average restock cost data for date range and comparison period
   */
  private async getAvgRestockCostData(dateRange: DateRange, comparisonRange: DateRange): Promise<{ current: number; before: number }> {
    try {
      const [currentResult, beforeResult] = await Promise.all([
        pool.query(reportQueries.getAvgRestockCost, [dateRange.startDate, dateRange.endDate]),
        pool.query(reportQueries.getAvgRestockCostComparison, [comparisonRange.startDate, comparisonRange.endDate])
      ]);

      const current = parseFloat(currentResult.rows[0]?.avg_cost || '0');
      const before = parseFloat(beforeResult.rows[0]?.avg_cost || '0');

      return { current, before };
    } catch (error) {
      throw new HttpException(500, 'Failed to fetch average restock cost data');
    }
  }

  /**
   * Get restock items for date range
   */
  private async getRestockItems(dateRange: DateRange): Promise<Array<{ product_id: string; product_name: string; product_image: string; qty: number; price: number; total: number }>> {
    try {
      const result = await pool.query(reportQueries.getRestockItems, [dateRange.startDate, dateRange.endDate]);
      
      return result.rows.map((row: any) => ({
        product_id: row.product_id?.toString() || '',
        product_name: row.product_name || 'Unknown Product',
        product_image: row.product_image || '/img/default-product.png',
        qty: parseInt(row.qty || '0'),
        price: parseFloat(row.price || '0'),
        total: parseFloat(row.total || '0')
      }));
    } catch (error) {
      throw new HttpException(500, 'Failed to fetch restock items data');
    }
  }

  /**
   * Get restock report data including all metrics
   */
  async getRestockData(options: DashboardOptions = {}): Promise<RestockReportData> {
    try {
      // Parse date range
      const dateRange = this.parseDateRange(options);
      const comparisonRange = this.calculateComparisonDateRange(dateRange.startDate, dateRange.endDate);

      // Fetch all data in parallel for better performance
      const [restockCostData, restockCountData, avgRestockCostData, restockItems] = await Promise.all([
        this.getRestockCostData(dateRange, comparisonRange),
        this.getRestockCountData(dateRange, comparisonRange),
        this.getAvgRestockCostData(dateRange, comparisonRange),
        this.getRestockItems(dateRange)
      ]);

      // Calculate growth percentages
      const costGrowth = this.calculateGrowthPercentage(restockCostData.current, restockCostData.before);
      const countGrowth = this.calculateGrowthPercentage(restockCountData.current, restockCountData.before);
      const avgCostGrowth = this.calculateGrowthPercentage(avgRestockCostData.current, avgRestockCostData.before);

      return {
        summary: {
          total_cost: {
            current: restockCostData.current,
            before: restockCostData.before,
            growth_percentage: costGrowth
          },
          total_restock: {
            current: restockCountData.current,
            before: restockCountData.before,
            growth_percentage: countGrowth
          },
          average_cost_per_product: {
            current: avgRestockCostData.current,
            before: avgRestockCostData.before,
            growth_percentage: avgCostGrowth
          }
        },
        restock_items: restockItems
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(500, 'Failed to fetch restock data');
    }
  }

  /**
   * Get sales products report data
   */
  async getSalesProductsData(options: DashboardOptions = {}): Promise<SalesProductsData> {
    try {
      // Parse date range
      const dateRange = this.parseDateRange(options);
      const comparisonRange = this.calculateComparisonDateRange(dateRange.startDate, dateRange.endDate);

      // Fetch all data in parallel for better performance
      const [topProducts, comparisonProducts, salesByCategory, totalSales, lowStockProducts] = await Promise.all([
        this.getTopProductsForRange(dateRange),
        this.getTopProductsForComparison(comparisonRange),
        this.getSalesByCategory(dateRange),
        this.getTotalSalesCount(dateRange),
        this.getLowStockProducts()
      ]);

      // Calculate trends for top products
      const topProductsWithTrends = topProducts.map((product, index) => {
        const comparisonProduct = comparisonProducts.find(cp => cp.product_id === product.product_id);
        const previousQuantity = comparisonProduct?.quantity || 0;
        const trend: 'up' | 'down' = product.quantity > previousQuantity ? 'up' : 'down';
        
        return {
          rank: index + 1,
          product_id: product.product_id,
          product_name: product.product_name,
          image_url: product.image_url,
          quantity: product.quantity,
          trend
        };
      });

      // Add colors to categories
      const categoriesWithColors = salesByCategory.map(category => ({
        category_name: category.category_name,
        quantity: category.quantity,
        color: this.generateCategoryColor(category.category_name)
      }));

      return {
        top_products: topProductsWithTrends,
        sales_by_category: {
          total_sales: totalSales,
          categories: categoriesWithColors
        },
        inventories: lowStockProducts
      };
    } catch (error) {
      console.error('Error in getSalesProductsData:', error);
      // Return default data structure instead of throwing error
      return {
        top_products: [],
        sales_by_category: {
          total_sales: 0,
          categories: []
        },
        inventories: []
      };
    }
  }
} 