import { Request, Response, NextFunction } from 'express';
import { FcmService } from './fcm.service';
import { validateRequiredFields } from '../../utils/helpers';

export class FcmController {
  private fcmService: FcmService;

  constructor() {
    this.fcmService = new FcmService();
  }

  /**
   * Handle GET /fcm/notification-list
   */
  getNotificationList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.fcmService.getNotificationList();
      res.status(200).json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: data
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle POST /fcm/save-token
   */
  saveFcmToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.body;

      // Validate required fields
      const { isValid, missingFields } = validateRequiredFields(req.body, ['token']);

      if (!isValid) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Additional validation
      if (typeof token !== 'string') {
        throw new Error('Token must be a string');
      }

      if (token.trim().length === 0) {
        throw new Error('Token cannot be empty');
      }

      const result = await this.fcmService.saveFcmToken(token.trim());
      
      res.status(200).json({
        success: true,
        message: 'FCM token saved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle GET /fcm/token
   */
  getFcmToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = await this.fcmService.getFcmToken();
      
      res.status(200).json({
        success: true,
        message: 'FCM token retrieved successfully',
        data: { token }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle POST /fcm/read-notification
   */
  readNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.fcmService.readNotification(id);
      res.status(200).json({
        success: true,
        message: 'Notification read successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}
