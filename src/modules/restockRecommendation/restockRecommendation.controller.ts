import { Request, Response, NextFunction } from 'express';
import { RestockRecommendationService, RestockRecommendationOptions } from './restockRecommendation.service';
import { restockRecommendationQuerySchema } from './validators/restockRecommendation.schema';

export class RestockRecommendationController {
  private restockRecommendationService: RestockRecommendationService;

  constructor() {
    this.restockRecommendationService = new RestockRecommendationService();
  }

  /**
   * Handle GET /restock-recommendations/list
   */
  getRestockRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate query parameters with Zod
      const validatedQuery = restockRecommendationQuerySchema.parse(req.query);
      
      const options: RestockRecommendationOptions = {};
      
      if (validatedQuery.search) {
        options.search = validatedQuery.search;
      }
      
      if (validatedQuery.sort_by) {
        options.sort_by = validatedQuery.sort_by;
      }
      
      if (validatedQuery.order) {
        options.order = validatedQuery.order;
      }

      const restockRecommendations = await this.restockRecommendationService.getRestockRecommendations(options);

      res.status(200).json({
        success: true,
        message: 'Restock recommendations retrieved successfully',
        data: restockRecommendations
      });
    } catch (error) {
      next(error);
    }
  };
} 