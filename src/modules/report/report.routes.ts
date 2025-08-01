import { Router } from 'express';
import { ReportController } from './report.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();
const reportController = new ReportController();

/**
 * @route   GET /report/dashboard
 * @desc    Get dashboard data including revenue, transactions, profit, and top products
 * @query   start_date (optional) - Start date in YYYY-MM-DD format
 * @query   end_date (optional) - End date in YYYY-MM-DD format
 * @access  Private (requires authentication)
 */
router.get('/dashboard', authenticateToken, reportController.getDashboard);

/**
 * @route   GET /report/sales
 * @desc    Get sales report data including sales, transactions, average sales, and payment methods
 * @query   start_date (optional) - Start date in YYYY-MM-DD format
 * @query   end_date (optional) - End date in YYYY-MM-DD format
 * @access  Private (requires authentication)
 */
router.get('/sales', authenticateToken, reportController.getSales);

/**
 * @route   GET /report/profit
 * @desc    Get daily profit report data including profit summary, profit margin, and sales history
 * @query   date (optional) - Date in YYYY-MM-DD format (defaults to today)
 * @access  Private (requires authentication)
 */
router.get('/profit', authenticateToken, reportController.getProfitReport);

/**
 * @route   GET /report/products
 * @desc    Get sales products report data including top products, sales by category, and inventory status
 * @query   start_date (optional) - Start date in YYYY-MM-DD format
 * @query   end_date (optional) - End date in YYYY-MM-DD format
 * @access  Private (requires authentication)
 */
router.get('/products', authenticateToken, reportController.getSalesProducts);

/**
 * @route   GET /report/restock
 * @desc    Get restock report data including summary statistics and list of restocked products
 * @query   start_date (optional) - Start date in YYYY-MM-DD format
 * @query   end_date (optional) - End date in YYYY-MM-DD format
 * @access  Private (requires authentication)
 */
router.get('/restock', authenticateToken, reportController.getRestock);

export default router; 