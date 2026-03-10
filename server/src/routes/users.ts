import { Router, Response } from 'express';
import User from '../models/User';
import authMiddleware from '../middleware/auth';
import { AuthRequest, ApiResponse, UserPayload, UserProfilePayload } from '../types';

const router = Router();

// Lấy thông tin user đang đăng nhập (phải đặt trước /search và /)
router.get(
  '/me',
  authMiddleware,
  async (
    req: AuthRequest,
    res: Response<ApiResponse<UserProfilePayload>>
  ): Promise<void> => {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const user = await User.findById(userId).select('-password').lean();
      if (!user) {
        res.status(401).json({ success: false, error: 'User not found' });
        return;
      }
      const profile: UserProfilePayload = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt
          ? new Date(user.createdAt).toISOString()
          : undefined,
      };
      res.json({ success: true, data: profile });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Server error';
      res.status(500).json({ success: false, error: message });
    }
  }
);

// Lấy danh sách tất cả users
router.get(
  '/',
  authMiddleware,
  async (
    _req: AuthRequest,
    res: Response<ApiResponse<UserPayload[]>>
  ): Promise<void> => {
    try {
      const users = await User.find()
        .select('-password')
        .sort({ name: 1 })
        .lean();

      const userList: UserPayload[] = users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        avatar: u.avatar,
      }));

      res.json({
        success: true,
        data: userList,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Server error';
      res.status(500).json({ success: false, error: message });
    }
  }
);

// Tìm kiếm user theo tên hoặc email
router.get(
  '/search',
  authMiddleware,
  async (
    req: AuthRequest,
    res: Response<ApiResponse<UserPayload[]>>
  ): Promise<void> => {
    try {
      const query = (req.query.q as string) || '';

      if (!query.trim()) {
        res.json({ success: true, data: [] });
        return;
      }

      const users = await User.find({
        $and: [
          { _id: { $ne: req.userId } }, // loại trừ chính mình
          {
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { email: { $regex: query, $options: 'i' } },
            ],
          },
        ],
      })
        .select('-password')
        .limit(20)
        .lean();

      const userList: UserPayload[] = users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        avatar: u.avatar,
      }));

      res.json({
        success: true,
        data: userList,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Server error';
      res.status(500).json({ success: false, error: message });
    }
  }
);

// Lấy thông tin user theo id (đặt sau /me và /search để tránh match nhầm)
router.get(
  '/:id',
  authMiddleware,
  async (
    req: AuthRequest,
    res: Response<ApiResponse<UserPayload>>
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await User.findById(id).select('-password -fcmTokens').lean();
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }
      const payload: UserPayload = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      };
      res.json({ success: true, data: payload });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Server error';
      res.status(500).json({ success: false, error: message });
    }
  }
);

export default router;