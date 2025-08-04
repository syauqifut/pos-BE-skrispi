/**
 * SQL queries for report operations
 */

export const reportQueries = {
  // Get total revenue for date range
  getRevenue: `
    SELECT COALESCE(SUM(t.total_amount), 0) as revenue
    FROM transactions t
    WHERE t.type = 'sale' AND t.date BETWEEN $1 AND $2
  `,

  // Get total transactions count for date range
  getTransactions: `
    SELECT COUNT(*) as count
    FROM transactions t
    WHERE t.type = 'sale' AND t.date BETWEEN $1 AND $2
  `,

  // Get profit for date range (revenue - cost of goods sold)
  getProfit: `
    SELECT COALESCE(
      SUM(t.total_amount) - SUM(
        ti.qty * COALESCE(pr.purchase_price, 0)
      ), 0
    ) as profit
    FROM transactions t
    LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
    LEFT JOIN prices pr ON ti.product_id = pr.product_id
    WHERE t.type = 'sale' AND t.date BETWEEN $1 AND $2
  `,

  // Get top 10 best-selling products for date range
  getTopProducts: `
    SELECT 
      p.name,
      p.image_url as image,
      SUM(ti.qty) as sold
    FROM transactions t
    LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
    LEFT JOIN products p ON ti.product_id = p.id
    WHERE t.type = 'sale' AND t.date BETWEEN $1 AND $2
    GROUP BY p.id, p.name, p.image_url
    ORDER BY sold DESC
    LIMIT 10
  `,

  // Get daily sales data aggregated by date
  getDailySales: `
    SELECT 
      t.date as date,
      COALESCE(SUM(t.total_amount), 0) as total_sales,
      COUNT(*) as total_transactions
    FROM transactions t
    WHERE t.type = 'sale' AND t.date BETWEEN $1 AND $2
    GROUP BY t.date
    ORDER BY t.date ASC;
  `,

  // Get revenue for comparison period (previous period of same length)
  getRevenueComparison: `
    SELECT COALESCE(SUM(t.total_amount), 0) as revenue
    FROM transactions t
    WHERE t.type = 'sale' AND t.date BETWEEN $1 AND $2
  `,

  // Get transactions count for comparison period
  getTransactionsComparison: `
    SELECT COUNT(*) as count
    FROM transactions t
    WHERE t.type = 'sale' AND t.date BETWEEN $1 AND $2
  `,

  // Get profit for comparison period
  getProfitComparison: `
    SELECT COALESCE(
      SUM(t.total_amount) - SUM(
        ti.qty * COALESCE(pr.purchase_price, 0)
      ), 0
    ) as profit
    FROM transactions t
    LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
    LEFT JOIN prices pr ON ti.product_id = pr.product_id
    WHERE t.type = 'sale' AND t.date BETWEEN $1 AND $2
  `,

  // ============================================
  // Sales Report Queries
  // ============================================

  // Get total sales for date range
  getSales: `
    SELECT COALESCE(SUM(t.total_amount), 0) as sales
    FROM transactions t
    WHERE t.type = 'sale' AND t.date BETWEEN $1 AND $2
  `,

  // Get total sales for comparison period
  getSalesComparison: `
    SELECT COALESCE(SUM(t.total_amount), 0) as sales
    FROM transactions t
    WHERE t.type = 'sale' AND t.date BETWEEN $1 AND $2
  `,

  // Get average sales per transaction for date range
  getAvgSales: `
    SELECT COALESCE(AVG(t.total_amount), 0) as avg_sales
    FROM transactions t
    WHERE t.type = 'sale' AND t.date BETWEEN $1 AND $2
  `,

  // Get average sales per transaction for comparison period
  getAvgSalesComparison: `
    SELECT COALESCE(AVG(t.total_amount), 0) as avg_sales
    FROM transactions t
    WHERE t.type = 'sale' AND t.date BETWEEN $1 AND $2
  `,

  // Get payment method breakdown for date range
  getPaymentMethods: `
    SELECT 
      COALESCE(t.payment_type, 'Cash') as method,
      SUM(t.total_amount) as total
    FROM transactions t
    WHERE t.type = 'sale' AND t.date BETWEEN $1 AND $2
    GROUP BY t.payment_type
    ORDER BY total DESC
  `,

  // ============================================
  // Daily Profit Report Queries
  // ============================================

  // Get profit for specific date
  getProfitForDate: `
    SELECT COALESCE(
      SUM(t.total_amount) - SUM(
        ti.qty * COALESCE(pr.purchase_price, 0)
      ), 0
    ) as profit
    FROM transactions t
    LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
    LEFT JOIN prices pr ON ti.product_id = pr.product_id
    WHERE t.type = 'sale' AND t.date = $1
  `,

  // Get profit for previous day
  getProfitForPreviousDay: `
    SELECT COALESCE(
      SUM(t.total_amount) - SUM(
        ti.qty * COALESCE(pr.purchase_price, 0)
      ), 0
    ) as profit
    FROM transactions t
    LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
    LEFT JOIN prices pr ON ti.product_id = pr.product_id
    WHERE t.type = 'sale' AND t.date = $1 - INTERVAL '1 day'
  `,

  // Get revenue for specific date
  getRevenueForDate: `
    SELECT COALESCE(SUM(t.total_amount), 0) as revenue
    FROM transactions t
    WHERE t.type = 'sale' AND t.date = $1
  `,

  // Get cost (COGS) for specific date
  getCostForDate: `
    SELECT COALESCE(SUM(
      ti.qty * COALESCE(pr.purchase_price, 0)
    ), 0) as cost
    FROM transactions t
    LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
    LEFT JOIN prices pr ON ti.product_id = pr.product_id
    WHERE t.type = 'sale' AND t.date = $1
  `,

  // Get sales history for specific date
  getSalesHistoryForDate: `
    SELECT 
      t.no as transaction_id,
      t.total_amount as revenue,
      COALESCE(
        t.total_amount - SUM(
          ti.qty * COALESCE(pr.purchase_price, 0)
        ), 0
      ) as profit
    FROM transactions t
    LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
    LEFT JOIN prices pr ON ti.product_id = pr.product_id
    WHERE t.type = 'sale' AND t.date = $1
    GROUP BY t.id, t.no, t.total_amount
    ORDER BY t.created_at DESC
  `,

  // ============================================
  // Sales Products Report Queries
  // ============================================

  // Get top selling products for date range
  getTopProductsForRange: `
    SELECT 
      p.id as product_id,
      p.name as product_name,
      p.image_url,
      SUM(ti.qty) as quantity
    FROM transactions t
    LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
    LEFT JOIN products p ON ti.product_id = p.id
    WHERE t.type = 'sale' AND t.date BETWEEN $1 AND $2
    GROUP BY p.id, p.name, p.image_url
    ORDER BY quantity DESC
    LIMIT 10
  `,

  // Get top selling products for comparison period
  getTopProductsForComparison: `
    SELECT 
      p.id as product_id,
      SUM(ti.qty) as quantity
    FROM transactions t
    LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
    LEFT JOIN products p ON ti.product_id = p.id
    WHERE t.type = 'sale' AND t.date BETWEEN $1 AND $2
    GROUP BY p.id
    ORDER BY quantity DESC
    LIMIT 10
  `,

  // Get sales by category for date range
  getSalesByCategory: `
    SELECT 
      COALESCE(p.category_id, 'Uncategorized') as category_name,
      SUM(ti.qty) as quantity
    FROM transactions t
    LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
    LEFT JOIN products p ON ti.product_id = p.id
    WHERE t.type = 'sale' AND t.date BETWEEN $1 AND $2
    GROUP BY p.category_id
    ORDER BY quantity DESC
  `,

  // Get total sales count for date range
  getTotalSalesCount: `
    SELECT COUNT(DISTINCT t.id) as total_sales
    FROM transactions t
    WHERE t.type = 'sale' AND t.date BETWEEN $1 AND $2
  `,

  // Get products with low stock
  getLowStockProducts: `
    SELECT 
      p.id as product_id,
      p.name as product_name,
      p.image_url,
      COALESCE(SUM(s.qty), 0) as stock,
      p.unit_id as unit,
      15 as threshold
    FROM products p
    LEFT JOIN stocks s ON p.id = s.product_id
    WHERE p.is_active = true
    GROUP BY p.id, p.name, p.image_url, p.unit_id
    HAVING COALESCE(SUM(s.qty), 0) < 15
    ORDER BY stock ASC
  `,

  // ============================================
  // Restock Report Queries
  // ============================================

  // Get total restock cost for date range
  getRestockCost: `
    SELECT COALESCE(SUM(t.total_amount), 0) as total_cost
    FROM transactions t
    WHERE t.type = 'purchase' AND t.date BETWEEN $1 AND $2
  `,

  // Get total restock cost for comparison period
  getRestockCostComparison: `
    SELECT COALESCE(SUM(t.total_amount), 0) as total_cost
    FROM transactions t
    WHERE t.type = 'purchase' AND t.date BETWEEN $1 AND $2
  `,

  // Get total restock count for date range
  getRestockCount: `
    SELECT COUNT(*) as total_restock
    FROM transactions t
    WHERE t.type = 'purchase' AND t.date BETWEEN $1 AND $2
  `,

  // Get total restock count for comparison period
  getRestockCountComparison: `
    SELECT COUNT(*) as total_restock
    FROM transactions t
    WHERE t.type = 'purchase' AND t.date BETWEEN $1 AND $2
  `,

  // Get average cost per restock product for date range
  getAvgRestockCost: `
    SELECT COALESCE(AVG(t.total_amount), 0) as avg_cost
    FROM transactions t
    WHERE t.type = 'purchase' AND t.date BETWEEN $1 AND $2
  `,

  // Get average cost per restock product for comparison period
  getAvgRestockCostComparison: `
    SELECT COALESCE(AVG(t.total_amount), 0) as avg_cost
    FROM transactions t
    WHERE t.type = 'purchase' AND t.date BETWEEN $1 AND $2
  `,

  // Get restock items with product details for date range
  getRestockItems: `
    SELECT 
      p.id as product_id,
      p.name as product_name,
      p.image_url as product_image,
      ti.qty,
      COALESCE(pr.purchase_price, 0) as price,
      (ti.qty * COALESCE(pr.purchase_price, 0)) as total
    FROM transactions t
    LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
    LEFT JOIN products p ON ti.product_id = p.id
    LEFT JOIN prices pr ON ti.product_id = pr.product_id
    WHERE t.type = 'purchase' AND t.date BETWEEN $1 AND $2
    ORDER BY total DESC
  `
}; 