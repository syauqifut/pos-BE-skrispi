import { Router } from 'express';
import { FcmController } from './fcm.controller';

const router = Router();
const fcmController = new FcmController();

/**
 * @route   GET /fcm/notification-list
 * @desc    Get list of notifications
 * @access  Public
 */
router.get('/notificationList', fcmController.getNotificationList);

/**
 * @route   POST /fcm/save-token
 * @desc    Save FCM token to database
 * @access  Public
 */
router.post('/saveToken', fcmController.saveFcmToken);

/**
 * @route   GET /fcm/token
 * @desc    Get current FCM token from database
 * @access  Public
 */
router.get('/token', fcmController.getFcmToken);

/**
 * @route   PUT /fcm/read-notification/:id
 * @desc    Update notification as read
 * @access  Public
 */
router.put('/readNotification/:id', fcmController.readNotification);

export default router; 