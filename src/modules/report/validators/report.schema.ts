import { z } from 'zod';

// Dashboard query parameters schema
export const dashboardQuerySchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
}).refine((data) => {
  // If one date is provided, both must be provided
  if ((data.start_date && !data.end_date) || (!data.start_date && data.end_date)) {
    return false;
  }
  
  // If both dates are provided, end_date must be >= start_date
  if (data.start_date && data.end_date) {
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    return endDate >= startDate;
  }
  
  return true;
}, {
  message: 'Both start_date and end_date must be provided together, and end_date must be >= start_date'
});

export type DashboardQueryRequest = z.infer<typeof dashboardQuerySchema>;

// Profit report query parameters schema
export const profitReportQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

export type ProfitReportQueryRequest = z.infer<typeof profitReportQuerySchema>; 