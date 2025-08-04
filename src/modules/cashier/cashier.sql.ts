/**
 * SQL queries for cashier operations
 */

export const cashierQueries = {
  // Get products by IDs with prices
  getProductsByIds: `
    SELECT 
      p.id,
      p.name,
      p.barcode,
      p.unit_id,
      pr.selling_price
    FROM products p
    LEFT JOIN prices pr ON p.id = pr.product_id
    WHERE p.id = ANY($1) AND p.is_active = true
  `,

  // Get single product by ID with price
  getProductById: `
    SELECT 
      p.id,
      p.name,
      p.barcode,
      pr.selling_price
    FROM products p
    LEFT JOIN prices pr ON p.id = pr.product_id
    WHERE p.id = $1 AND p.is_active = true
  `,

  // Create transaction
  createTransaction: `
    INSERT INTO transactions (
      no, 
      type, 
      date, 
      description, 
      total_amount, 
      paid_amount, 
      payment_type, 
      created_by
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
    RETURNING id
  `,

  // Create transaction item
  createTransactionItem: `
    INSERT INTO transaction_items (
      transaction_id, 
      product_id, 
      unit_id, 
      qty,
      description
    ) 
    VALUES ($1, $2, $3, $4, $5) 
    RETURNING id
  `,

  // Create stock record for sale
  createStockRecord: `
    INSERT INTO stocks (
      product_id, 
      transaction_id, 
      type, 
      qty, 
      unit_id, 
      description, 
      created_by
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7) 
    RETURNING id
  `,

  // Get product stock
  getProductStock: `
    SELECT COALESCE(SUM(qty), 0) as qty
    FROM stocks
    WHERE product_id = $1
  `
};
