import { Router } from 'express';
import { RestockRecommendationController } from './restockRecommendation.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();
const restockRecommendationController = new RestockRecommendationController();

/**
 * @route   GET /restock-recommendations/list
 * @desc    Get restock recommendations for products based on sales analysis
 * @query   search (optional) - Search by product name
 * @query   sort_by (optional) - Sort by field: estimated_days_left, current_stock, or product_name
 * @query   order (optional) - Sort order: asc or desc (defaults to asc for estimated_days_left)
 * @access  Private (requires authentication)
 */
router.get('/list', authenticateToken, restockRecommendationController.getRestockRecommendations);

export default router; 