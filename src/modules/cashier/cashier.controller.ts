import { Request, Response, NextFunction } from 'express';
import { CashierService } from './cashier.service';
import { reviewOrderSchema, checkoutSchema } from './validators/cashier.schema';

export class CashierController {
  private cashierService: CashierService;

  constructor() {
    this.cashierService = new CashierService();
  }

  /**
   * Show QRIS image path
   */
  public showQris = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const qrisPath = this.cashierService.getQrisPath();
      res.status(200).json({
        success: true,
        message: 'QRIS path retrieved successfully',
        data: {
          qrisPath
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Review order before checkout
   */
  public reviewOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body using Zod schema
      const validatedData = reviewOrderSchema.parse(req.body);
      const { products } = validatedData;
      
      const reviewResult = await this.cashierService.reviewOrder(products);
      
      res.status(200).json({
        success: true,
        message: 'Order reviewed successfully',
        data: reviewResult
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Process checkout and save transaction
   */
  public checkout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body using Zod schema
      const validatedData = checkoutSchema.parse(req.body);
      
      // Get user ID from authenticated request
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }
      
      const checkoutResult = await this.cashierService.checkout(validatedData, userId);
      
      res.status(200).json({
        success: true,
        message: 'Checkout processed successfully',
        data: checkoutResult
      });
    } catch (error) {
      next(error);
    }
  };
}
