import { Router, Response } from 'express';
import authMiddleware from '../middleware/auth';
import notificationService from '../services/notificationService';
import { AuthRequest, ApiResponse } from '../types';

const router = Router();

// ======= LƯU FCM TOKEN =======
router.post(
  '/token',
  authMiddleware,
  async (
    req: AuthRequest,
    res: Response<ApiResponse>
  ): Promise<void> => {
    try {
      const { fcmToken } = req.body as { fcmToken: string };
      const userId = req.userId!;

      if (!fcmToken) {
        res.status(400).json({
          success: false,
          error: 'FCM token is required',
        });
        return;
      }

      await notificationService.saveToken(userId, fcmToken);

      res.json({
        success: true,
        message: 'FCM token saved successfully',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Server error';
      res.status(500).json({ success: false, error: message });
    }
  }
);

// ======= XÓA FCM TOKEN (khi logout) =======
router.delete(
  '/token',
  authMiddleware,
  async (
    req: AuthRequest,
    res: Response<ApiResponse>
  ): Promise<void> => {
    try {
      const { fcmToken } = req.body as { fcmToken: string };
      const userId = req.userId!;

      if (!fcmToken) {
        res.status(400).json({
          success: false,
          error: 'FCM token is required',
        });
        return;
      }

      await notificationService.removeToken(userId, fcmToken);

      res.json({
        success: true,
        message: 'FCM token removed successfully',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Server error';
      res.status(500).json({ success: false, error: message });
    }
  }
);

export default router;