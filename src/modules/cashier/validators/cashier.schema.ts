import { z } from 'zod';

// Schema for review order request
export const reviewOrderSchema = z.object({
  products: z.array(z.object({
    id: z.number().int().positive('Product ID must be a positive number'),
    qty: z.number().int().positive('Quantity must be a positive number')
  })).min(1, 'At least one product is required')
});

// Schema for checkout request
export const checkoutSchema = z.object({
  products: z.array(z.object({
    id: z.number().int().positive('Product ID must be a positive number'),
    qty: z.number().int().positive('Quantity must be a positive number')
  })).min(1, 'At least one product is required'),
  total_price: z.number().positive('Total price must be a positive number'),
  payment_method: z.enum(['cash', 'qris'])
});

// Export types
export type ReviewOrderRequest = z.infer<typeof reviewOrderSchema>;
export type CheckoutRequest = z.infer<typeof checkoutSchema>; 