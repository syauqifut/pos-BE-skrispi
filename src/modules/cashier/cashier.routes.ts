import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { CashierController } from './cashier.controller';

const router = Router();
const cashierController = new CashierController();

/**
 * @route   GET /cashier/showQris
 * @desc    Show QRIS for payment
 * @access  Public
 */
router.get('/showQris', authenticateToken, cashierController.showQris);

/**
 * @route   POST /cashier/reviewOrder
 * @desc    Review order before checkout
 * @access  Private
 */
router.post('/reviewOrder', authenticateToken, cashierController.reviewOrder);

/**
 * @route   POST /cashier/checkout
 * @desc    Process checkout and save transaction
 * @access  Private
 */
router.post('/checkout', authenticateToken, cashierController.checkout);

export default router;