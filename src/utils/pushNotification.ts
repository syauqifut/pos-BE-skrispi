import admin from './firebase';
import pool from '../db';
import { HttpException } from '../exceptions/HttpException';

type NotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

export const sendPushNotification = async ({ title, body, data }: NotificationPayload) => {
  try {
    // Get token from database
    const tokenResult = await pool.query('SELECT token FROM device_tokens WHERE id = 1');
    if (!tokenResult.rows[0]?.token) {
      throw new HttpException(404, 'No FCM token found in database');
    }
    
    const token = tokenResult.rows[0].token;
    const message = {
      token,
      notification: { title, body },
      data: data || {},
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Push notification sent:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Failed to send push notification:', error);
    
    if (error instanceof HttpException) {
      throw error;
    }
    
    // Handle Firebase-specific errors
    if (error.code === 'messaging/invalid-argument') {
      throw new HttpException(400, 'Invalid FCM token provided');
    }
    
    if (error.code === 'messaging/registration-token-not-registered') {
      throw new HttpException(400, 'FCM token is not registered');
    }
    
    if (error.code === 'messaging/quota-exceeded') {
      throw new HttpException(429, 'FCM quota exceeded');
    }
    
    // Generic Firebase error
    throw new HttpException(500, 'Failed to send push notification');
  }
};

export const saveFcmToken = async (token: string) => {
  if (!token) throw new HttpException(400, 'Token is required');
  
  try {
    // Always update the token for id = 1
    const result = await pool.query(
      `UPDATE device_tokens SET token = $1, updated_at = NOW() WHERE id = 1 RETURNING *`,
      [token]
    );
    
    if (!result.rows[0]) {
      throw new HttpException(404, 'Device token record not found');
    }
    
    return result.rows[0];
  } catch (error) {
    if (error instanceof HttpException) throw error;
    throw new HttpException(500, 'Failed to save FCM token');
  }
};

export async function test() {
  try {
      const res = await sendPushNotification({
        title: 'Test Notification',
        body: 'This is just a test from the CLI',
        data: { tested: 'yes' },
      });

      console.log('✅ Notification sent:', res);
  } catch (err) {
      console.error('❌ Failed to send notification:', err);
  }
}

if (require.main === module) {
  test();
}