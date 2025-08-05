/**
 * SQL queries for product operations
 */

export const inventoryQueries = {
  // Get all products with pagination, search, filter, and sort
  findAll: `
    SELECT 
      p.id,
      p.name,
      p.barcode,
      p.image_url,
      p.is_active,
      p.category_id,
      p.unit_id,
      p.created_at,
      p.updated_at,
      p.created_by,
      p.updated_by,
      (
        SELECT SUM(s.qty) 
        FROM stocks s 
        WHERE s.product_id = p.id
      ) AS stock_qty,
      (
        SELECT pr.purchase_price 
        FROM prices pr 
        WHERE pr.product_id = p.id 
        ORDER BY pr.updated_at DESC 
        LIMIT 1
      ) AS purchase_price,
      (
        SELECT pr.selling_price 
        FROM prices pr 
        WHERE pr.product_id = p.id 
        ORDER BY pr.updated_at DESC 
        LIMIT 1
      ) AS selling_price
    FROM products p
    WHERE p.is_active = true
    GROUP BY p.id, p.name, p.barcode, p.image_url, p.is_active, p.category_id, p.unit_id, p.created_at, p.updated_at, p.created_by, p.updated_by
  `,

  // Get product by ID with subqueries for better performance
  findById: `
    SELECT 
      p.id,
      p.name,
      p.barcode,
      p.image_url,
      p.is_active,
      p.category_id,
      p.unit_id,
      p.created_at,
      p.updated_at,
      p.created_by,
      p.updated_by,
      (
        SELECT SUM(s.qty) 
        FROM stocks s 
        WHERE s.product_id = p.id
      ) AS stock_qty,
      (
        SELECT pr.purchase_price 
        FROM prices pr 
        WHERE pr.product_id = p.id 
        ORDER BY pr.updated_at DESC 
        LIMIT 1
      ) AS purchase_price,
      (
        SELECT pr.selling_price 
        FROM prices pr 
        WHERE pr.product_id = p.id 
        ORDER BY pr.updated_at DESC 
        LIMIT 1
      ) AS selling_price
    FROM products p
    WHERE p.id = $1 AND p.is_active = true
  `,

  // Create new product
  create: `
    INSERT INTO products (
      name, 
      barcode, 
      image_url, 
      category_id, 
      unit_id, 
      created_by, 
      updated_by
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7) 
    RETURNING id
  `,

  // Insert price
  insertPrice: `
    INSERT INTO prices (product_id, purchase_price, selling_price, created_by, updated_by) 
    VALUES ($1, $2, $3, $4, $5) 
    RETURNING id
  `,

  // Update price
  updatePrice: `
    UPDATE prices 
    SET 
      purchase_price = $2,
      selling_price = $3,
      updated_by = $4,
      updated_at = NOW()
    WHERE product_id = $1
    RETURNING id
  `,

  // Insert transaction
  insertTransaction: `
    INSERT INTO transactions (no, type, date, description, created_by, created_at) 
    VALUES ($1, $2, $3, $4, $5, NOW()) 
    RETURNING id
  `,

  // Insert transaction item
  insertTransactionItem: `
    INSERT INTO transaction_items (transaction_id, product_id, unit_id, qty, description) 
    VALUES ($1, $2, $3, $4, $5) 
    RETURNING id
  `,

  // Insert stock
  insertStock: `
    INSERT INTO stocks (product_id, transaction_id, type, qty, unit_id, description, created_by) 
    VALUES ($1, $2, $3, $4, $5, $6, $7) 
    RETURNING id
  `,

  // Update product
  update: `
    UPDATE products 
    SET 
      name = $2,
      barcode = $3,
      image_url = $4,
      category_id = $5,
      unit_id = $6,
      updated_at = NOW(),
      updated_by = $7
    WHERE id = $1 AND is_active = true
    RETURNING id
  `,

  // Soft delete product
  softDelete: `
    UPDATE products 
    SET 
      is_active = false,
      updated_at = NOW(),
      updated_by = $2
    WHERE id = $1 AND is_active = true
    RETURNING id
  `,

  // Count total for pagination
  countAll: `
    SELECT COUNT(*) as total
    FROM products p
    WHERE p.is_active = true
  `,

  // Find stock history by product ID
  findStockHistoryByProductId: `
    SELECT 
      s.id,
      s.product_id,
      s.transaction_id,
      s.type,
      s.qty,
      s.unit_id,
      s.description,
      s.created_at,
      s.created_by,
      t.no,
      t.type,
      t.date,
      t.description
    FROM stocks s
    LEFT JOIN transactions t ON s.transaction_id = t.id
    WHERE s.product_id = $1
    ORDER BY s.created_at DESC
  `,

  // Find transaction by product ID
  findTransactionByProductId: `
    SELECT * FROM stocks WHERE product_id = $1
  `,

  // Find price by product ID
  findPriceByProductId: `
    SELECT * FROM prices WHERE product_id = $1
  `,

  // Purchase transaction
  purchaseTransaction: `
    INSERT INTO stocks (product_id, transaction_id, type, qty, unit_id, description, created_by) 
    VALUES ($1, $2, $3, $4, $5, $6, $7) 
    RETURNING id
  `,

  // Find transaction list
  findTransactionList: `
    SELECT 
      t.id,
      t.no,
      STRING_AGG(p.name, ', ') as product_name,
      (
        SELECT p2.image_url
        FROM transaction_items ti2
        LEFT JOIN products p2 ON ti2.product_id = p2.id
        WHERE ti2.transaction_id = t.id
        ORDER BY ti2.id ASC
        LIMIT 1
      ) as image_url,
      CASE 
        WHEN t.type = 'sale' THEN (
          SELECT COALESCE(SUM(ti2.qty * prc.selling_price), 0)
          FROM transaction_items ti2
          LEFT JOIN prices prc ON ti2.product_id = prc.product_id
          WHERE ti2.transaction_id = t.id
        )
        ELSE NULL
      END as total_price,
      t.type,
      t.date
    FROM transactions t
    LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
    LEFT JOIN products p ON ti.product_id = p.id
    GROUP BY t.id, t.no, t.type, t.date
  `,

  // Count total transactions for pagination
  countAllTransactions: `
    SELECT COUNT(DISTINCT t.id) as total
    FROM transactions t
    LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
    LEFT JOIN products p ON ti.product_id = p.id
  `,

  // Find transaction detail
  findTransactionDetail: `
    SELECT 
      t.id,
      t.no,
      t.type,
      t.date,
      t.description,
      t.created_at,
      t.created_by,
      t.updated_at,
      t.updated_by,
      t.payment_type,
      t.total_amount
    FROM transactions t
    WHERE t.id = $1
  `,

  // Find transaction items
  findTransactionItems: `
    SELECT 
      ti.id,
      ti.product_id,
      p.name as product_name,
      p.image_url,
      ti.unit_id,
      ti.qty,
      ti.description,
      pr.selling_price as price
    FROM transaction_items ti
    LEFT JOIN products p ON ti.product_id = p.id
    LEFT JOIN prices pr ON ti.product_id = pr.product_id
    WHERE ti.transaction_id = $1
  `,
}; 