import admin from './firebase';
import { FcmService } from '../modules/fcm/fcm.service';
import { HttpException } from '../exceptions/HttpException';

type NotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

export const sendPushNotification = async ({ title, body, data }: NotificationPayload) => {
  try {
    const fcmService = new FcmService();
    
    // Get token from database
    const token = await fcmService.getFcmToken();
    if (!token) {
      throw new HttpException(404, 'No FCM token found in database');
    }
    
    const message = {
      token,
      notification: { title, body },
      data: data || {},
    };

    //save to database
    await fcmService.saveNotification({ title, body, is_read: false });

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

// Export the FCM service for external use
export { FcmService } from '../modules/fcm/fcm.service';

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