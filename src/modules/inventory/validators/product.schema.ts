import { z } from 'zod';

// Schema for creating a new product
export const createProductSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').trim(),
  barcode: z.string().optional(),
  image_url: z.string().optional(),
  category_id: z.string().optional(),
  unit_id: z.string().optional(),
  stock_qty: z.number().int().positive('Stock quantity must be a positive number').optional(),
  purchase_price: z.number().int().positive('Purchase price must be a positive number').optional(),
  selling_price: z.number().int().positive('Selling price must be a positive number').optional()
});

// Schema for updating a product
export const updateProductSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').trim().optional(),
  barcode: z.string().optional(),
  image_url: z.string().optional(),
  category_id: z.string().optional(),
  unit_id: z.string().optional(),
  stock_qty: z.number().int().positive('Stock quantity must be a positive number').optional(),
  purchase_price: z.number().int().positive('Purchase price must be a positive number').optional(),
  selling_price: z.number().int().positive('Selling price must be a positive number').optional()
});

// Schema for query parameters
export const productQuerySchema = z.object({
  search: z.string().optional(),
  category_id: z.string().transform((val) => parseInt(val)).pipe(z.number().int().positive()).optional(),
  stock_qty: z.string().transform((val) => parseInt(val)).pipe(z.number().int().positive()).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['ASC', 'DESC', 'asc', 'desc']).transform((val) => val.toUpperCase()).optional(),
  page: z.string().transform((val) => parseInt(val)).pipe(z.number().int().positive('Page must be a positive number')).optional(),
  limit: z.string().transform((val) => parseInt(val)).pipe(z.number().int().positive('Limit must be a positive number')).optional()
});

// Schema for path parameters
export const productParamsSchema = z.object({
  id: z.string().transform((val) => parseInt(val)).pipe(z.number().int().positive('Invalid product ID'))
});

// Schema for purchase transaction with multiple items
export const purchaseTransactionSchema = z.object({
  items: z.array(z.object({
    product_id: z.string().transform((val) => parseInt(val)).pipe(z.number().int().positive('Invalid product ID')),
    quantity: z.number().int().positive('Quantity must be a positive number'),
  }))
});

// Schema for adjustment transaction
export const adjustmentTransactionSchema = z.object({
  items: z.array(z.object({
    product_id: z.string().transform((val) => parseInt(val)).pipe(z.number().int().positive('Invalid product ID')),
    quantity: z.number().int().positive('Quantity must be a positive number'),
  })),
  description: z.string().min(1, 'Description cannot be empty').trim()
});

// Export types
export type CreateProductRequest = z.infer<typeof createProductSchema>;
export type UpdateProductRequest = z.infer<typeof updateProductSchema>;
export type ProductQueryRequest = z.infer<typeof productQuerySchema>;
export type ProductParamsRequest = z.infer<typeof productParamsSchema>;
export type PurchaseTransactionRequest = z.infer<typeof purchaseTransactionSchema>; 
export type AdjustmentTransactionRequest = z.infer<typeof adjustmentTransactionSchema>;