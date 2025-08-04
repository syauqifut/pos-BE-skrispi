import { HttpException } from '../../exceptions/HttpException';
import pool from '../../db';
import { fcmQueries } from './fcm.sql';

export interface NotificationPayload {
  title: string;
  body: string;
  is_read?: boolean;
}

export interface FcmTokenResponse {
  id: number;
  token: string;
  updated_at: Date;
}

export class FcmService {
  /**
   * Get list of notifications
   */
  async getNotificationList() {
    try {
      const result = await pool.query(fcmQueries.getNotificationList);
      return result.rows;
    } catch (error) {
      throw new HttpException(500, 'Failed to get notification list');
    }
  }

  /**
   * Save FCM token to database
   */
  async saveFcmToken(token: string): Promise<FcmTokenResponse> {
    if (!token) {
      throw new HttpException(400, 'Token is required');
    }
    
    try {
      // Always update the token for id = 1
      const result = await pool.query(fcmQueries.updateFcmToken, [token]);
      
      if (!result.rows[0]) {
        throw new HttpException(404, 'Device token record not found');
      }
      
      return result.rows[0];
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('FCM service error - saveFcmToken:', error);
      throw new HttpException(500, 'Failed to save FCM token');
    }
  }

  /**
   * Get FCM token from database
   */
  async getFcmToken(): Promise<string | null> {
    try {
      const result = await pool.query(fcmQueries.getFcmToken);
      return result.rows[0]?.token || null;
    } catch (error) {
      console.error('FCM service error - getFcmToken:', error);
      throw new HttpException(500, 'Failed to get FCM token');
    }
  }

  /**
   * Update notification as read
   */
  async readNotification(id: string) {
    const result = await pool.query(fcmQueries.readNotification, [id]);
    return result.rows[0];
  }

  /**
   * Save notification to database
   */
  async saveNotification(notification: NotificationPayload) {
    const result = await pool.query(fcmQueries.saveNotification, [notification.title, notification.body, notification.is_read]);
    return result.rows[0];
  }
}
