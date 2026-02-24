import { Router, Response } from 'express';
import User from '../models/User';
import authMiddleware from '../middleware/auth';
import { AuthRequest, ApiResponse, UserPayload } from '../types';

const router = Router();

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

export default router;