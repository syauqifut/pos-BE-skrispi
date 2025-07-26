import { Request, Response, NextFunction } from 'express';
import { FindAllOptions, InventoryService } from './inventory.service';
import { HttpException } from '../../exceptions/HttpException';
import { 
  createProductSchema, 
  updateProductSchema, 
  productQuerySchema, 
  productParamsSchema,
  CreateProductRequest,
  UpdateProductRequest,
  purchaseTransactionSchema,
  adjustmentTransactionSchema
} from './validators/product.schema';

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  /**
   * Handle GET /setup/product
   */
  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate query parameters with Zod
      const validatedQuery = productQuerySchema.parse(req.query);

      // Build options object
      const options: FindAllOptions = {};

      if (validatedQuery.search) {
        options.search = validatedQuery.search;
      }

      if (validatedQuery.category_id) {
        options.category_id = validatedQuery.category_id;
      }

      if (validatedQuery.sort_by) {
        options.sort_by = validatedQuery.sort_by;
      }

      if (validatedQuery.sort_order) {
        options.sort_order = validatedQuery.sort_order as 'ASC' | 'DESC';
      }

      if (validatedQuery.page) {
        options.page = validatedQuery.page;
      }

      if (validatedQuery.limit) {
        options.limit = validatedQuery.limit;
      }

      const result = await this.inventoryService.findAll(options);

      res.status(200).json({
        success: true,
        message: 'Products retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle GET /setup/product/:id
   */
  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate path parameters with Zod
      const validatedParams = productParamsSchema.parse(req.params);

      const product = await this.inventoryService.findById(validatedParams.id);

      res.status(200).json({
        success: true,
        message: 'Product retrieved successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle POST /setup/product
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request body with Zod
      const validatedData = createProductSchema.parse(req.body);

      // Get user ID from auth middleware
      const userId = req.user?.userId;
      if (!userId) {
        throw new HttpException(401, 'User authentication required');
      }

      const product = await this.inventoryService.create(validatedData, userId);

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle PUT /setup/product/:id
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate path parameters with Zod
      const validatedParams = productParamsSchema.parse(req.params);
      
      // Validate request body with Zod
      const validatedData = updateProductSchema.parse(req.body);

      // Get user ID from auth middleware
      const userId = req.user?.userId;
      if (!userId) {
        throw new HttpException(401, 'User authentication required');
      }

      const product = await this.inventoryService.update(validatedParams.id, validatedData, userId);

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle DELETE /setup/product/:id
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate path parameters with Zod
      const validatedParams = productParamsSchema.parse(req.params);

      // Get user ID from auth middleware
      const userId = req.user?.userId;
      if (!userId) {
        throw new HttpException(401, 'User authentication required');
      }

      const product = await this.inventoryService.delete(validatedParams.id, userId);

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle GET /inventory/transactionList
   */
  findTransactionList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const transactions = await this.inventoryService.findTransactionList();

      res.status(200).json({
        success: true,
        message: 'Transactions retrieved successfully',
        data: transactions
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle POST /inventory/purchaseTransaction
   */
  purchaseTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = purchaseTransactionSchema.parse(req.body);

      // Get user ID from auth middleware
      const userId = req.user?.userId;
      if (!userId) {
        throw new HttpException(401, 'User authentication required');
      }

      const transactions = await this.inventoryService.purchaseTransaction(validatedData, userId);

      res.status(200).json({
        success: true,
        message: 'Transactions retrieved successfully',
        data: transactions
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle POST /inventory/adjustmentTransaction
   */
  adjustmentTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = adjustmentTransactionSchema.parse(req.body);

      // Get user ID from auth middleware
      const userId = req.user?.userId;
      if (!userId) {
        throw new HttpException(401, 'User authentication required');
      }

      const transactions = await this.inventoryService.adjustmentTransaction(validatedData, userId);

      res.status(200).json({
        success: true,
        message: 'Transactions retrieved successfully',
        data: transactions
      });
    } catch (error) {
      next(error);
    }
  };
} 