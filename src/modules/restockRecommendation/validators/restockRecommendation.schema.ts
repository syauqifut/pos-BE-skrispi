import { z } from 'zod';

// Restock recommendation query parameters schema
export const restockRecommendationQuerySchema = z.object({
  search: z.string().optional(),
  sort_by: z.enum(['estimated_days_left', 'current_stock', 'product_name']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export type RestockRecommendationQueryRequest = z.infer<typeof restockRecommendationQuerySchema>; 