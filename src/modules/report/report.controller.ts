import { Request, Response, NextFunction } from 'express';
import { ReportService, DashboardOptions } from './report.service';
import { dashboardQuerySchema, profitReportQuerySchema } from './validators/report.schema';

export class ReportController {
  private reportService: ReportService;

  constructor() {
    this.reportService = new ReportService();
  }

  /**
   * Handle GET /report/dashboard
   */
  getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate query parameters with Zod
      const validatedQuery = dashboardQuerySchema.parse(req.query);
      
      const options: DashboardOptions = {};
      
      if (validatedQuery.start_date) {
        options.startDate = validatedQuery.start_date;
      }
      
      if (validatedQuery.end_date) {
        options.endDate = validatedQuery.end_date;
      }

      const dashboardData = await this.reportService.getDashboardData(options);

      res.status(200).json({
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: dashboardData
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle GET /report/sales
   */
  getSales = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate query parameters with Zod
      const validatedQuery = dashboardQuerySchema.parse(req.query);
      
      const options: DashboardOptions = {};
      
      if (validatedQuery.start_date) {
        options.startDate = validatedQuery.start_date;
      }
      
      if (validatedQuery.end_date) {
        options.endDate = validatedQuery.end_date;
      }

      const salesData = await this.reportService.getSalesData(options);

      res.status(200).json({
        success: true,
        message: 'Sales data retrieved successfully',
        data: salesData
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle GET /report/profit
   */
  getProfitReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate query parameters with Zod
      const validatedQuery = profitReportQuerySchema.parse(req.query);
      
      const date = validatedQuery.date;

      const profitReportData = await this.reportService.getProfitReport(date);

      res.status(200).json({
        success: true,
        message: 'Profit report data retrieved successfully',
        data: profitReportData
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle GET /report/products
   */
  getSalesProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate query parameters with Zod
      const validatedQuery = dashboardQuerySchema.parse(req.query);
      
      const options: DashboardOptions = {};
      
      if (validatedQuery.start_date) {
        options.startDate = validatedQuery.start_date;
      }
      
      if (validatedQuery.end_date) {
        options.endDate = validatedQuery.end_date;
      }

      const salesProductsData = await this.reportService.getSalesProductsData(options);

      res.status(200).json({
        success: true,
        message: 'Sales products data retrieved successfully',
        data: salesProductsData
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle GET /report/restock
   */
  getRestock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate query parameters with Zod
      const validatedQuery = dashboardQuerySchema.parse(req.query);
      
      const options: DashboardOptions = {};
      
      if (validatedQuery.start_date) {
        options.startDate = validatedQuery.start_date;
      }
      
      if (validatedQuery.end_date) {
        options.endDate = validatedQuery.end_date;
      }

      const restockData = await this.reportService.getRestockData(options);

      res.status(200).json({
        success: true,
        message: 'Restock report data retrieved successfully',
        data: restockData
      });
    } catch (error) {
      next(error);
    }
  };
} 