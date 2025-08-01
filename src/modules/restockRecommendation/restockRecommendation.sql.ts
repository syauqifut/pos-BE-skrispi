/**
 * SQL queries for restock recommendation operations
 */

export const restockRecommendationQueries = {
  // Get all active products with basic info
  getActiveProducts: `
    SELECT 
      p.id as product_id,
      p.name as product_name,
      p.category_id as category_name,
      p.unit_id as unit
    FROM products p
    WHERE p.is_active = true
  `,

  // Get current stock for a product
  getProductStock: `
    SELECT COALESCE(SUM(s.qty), 0) as current_stock
    FROM stocks s
    WHERE s.product_id = $1
  `,

  // Get total sales for a product in date range
  getProductSales: `
    SELECT COALESCE(SUM(ti.qty), 0) as total_sales
    FROM transaction_items ti
    JOIN transactions t ON ti.transaction_id = t.id
    WHERE ti.product_id = $1 
    AND t.type = 'sale' 
    AND t.date >= CURRENT_DATE - INTERVAL '1 day' * $2
  `,

  // Get products with search filter
  getActiveProductsWithSearch: `
    SELECT 
      p.id as product_id,
      p.name as product_name,
      p.category_id as category_name,
      p.unit_id as unit
    FROM products p
    WHERE p.is_active = true 
    AND p.name ILIKE '%' || $1 || '%'
  `
}; 