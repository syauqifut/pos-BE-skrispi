/**
 * SQL queries for FCM operations
 */

export const fcmQueries = {
  // Get notification list
  getNotificationList: `
    SELECT * FROM notifications 
    ORDER BY created_at DESC 
    LIMIT 100
  `,

  // Update FCM token
  updateFcmToken: `
    UPDATE device_tokens 
    SET token = $1, updated_at = NOW() 
    WHERE id = 1 
    RETURNING *
  `,

  // Get FCM token
  getFcmToken: `
    SELECT token FROM device_tokens WHERE id = 1
  `,

  // Update notification as read
  readNotification: `
    UPDATE notifications 
    SET is_read = TRUE 
    WHERE id = $1
    RETURNING *
  `,

  // Save notification
  saveNotification: `
    INSERT INTO notifications (title, body, is_read) 
    VALUES ($1, $2, $3) 
    RETURNING *
  `
} as const; 