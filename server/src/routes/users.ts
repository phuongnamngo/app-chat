import path from 'path';
import fs from 'fs';
import { Router, Response } from 'express';
import User from '../models/User';
import Message from '../models/Message';
import ConversationRead from '../models/ConversationRead';
import authMiddleware from '../middleware/auth';
import uploadAvatar from '../middleware/uploadAvatar';
import {
  AuthRequest,
  ApiResponse,
  UserPayload,
  UserProfilePayload,
  PatchMeBody,
  ChangePasswordBody,
  DeleteMeBody,
} from '../types';

const DELETED_USER_DISPLAY_NAME = 'Tài khoản đã xóa';

const UPLOAD_AVATARS_DIR = path.join(__dirname, '..', '..', 'uploads', 'avatars');

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

// PATCH /me – cập nhật profile (name, email, avatar)
router.patch(
  '/me',
  authMiddleware,
  async (
    req: AuthRequest<{}, {}, PatchMeBody>,
    res: Response<ApiResponse<UserProfilePayload>>
  ): Promise<void> => {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const { name, email, avatar } = req.body || {};
      const user = await User.findById(userId);
      if (!user) {
        res.status(401).json({ success: false, error: 'User not found' });
        return;
      }
      if (name !== undefined) {
        const trimmed = name.trim();
        if (trimmed.length < 2 || trimmed.length > 50) {
          res.status(400).json({
            success: false,
            error: 'Tên phải từ 2 đến 50 ký tự',
          });
          return;
        }
        user.name = trimmed;
      }
      if (email !== undefined) {
        const trimmed = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
          res.status(400).json({
            success: false,
            error: 'Email không hợp lệ',
          });
          return;
        }
        const existing = await User.findOne({ email: trimmed, _id: { $ne: userId } });
        if (existing) {
          res.status(400).json({ success: false, error: 'Email đã tồn tại' });
          return;
        }
        user.email = trimmed;
      }
      if (avatar !== undefined) {
        user.avatar = typeof avatar === 'string' ? avatar : '';
      }
      await user.save();
      const updated = await User.findById(userId).select('-password').lean();
      if (!updated) {
        res.status(500).json({ success: false, error: 'Server error' });
        return;
      }
      const profile: UserProfilePayload = {
        id: updated._id.toString(),
        name: updated.name,
        email: updated.email,
        avatar: updated.avatar,
        createdAt: updated.createdAt
          ? new Date(updated.createdAt).toISOString()
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

// PATCH /me/password – đổi mật khẩu
router.patch(
  '/me/password',
  authMiddleware,
  async (
    req: AuthRequest<{}, {}, ChangePasswordBody>,
    res: Response<ApiResponse<{ message?: string }>>
  ): Promise<void> => {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const { currentPassword, newPassword } = req.body || {};
      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          error: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới',
        });
        return;
      }
      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          error: 'Mật khẩu mới phải có ít nhất 6 ký tự',
        });
        return;
      }
      const user = await User.findById(userId);
      if (!user) {
        res.status(401).json({ success: false, error: 'User not found' });
        return;
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          error: 'Mật khẩu hiện tại không đúng',
        });
        return;
      }
      user.password = newPassword;
      await user.save();
      res.json({ success: true, data: { message: 'Đổi mật khẩu thành công' } });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Server error';
      res.status(500).json({ success: false, error: message });
    }
  }
);

// POST /me/avatar – upload avatar, cập nhật user.avatar, trả UserProfilePayload
router.post(
  '/me/avatar',
  authMiddleware,
  (req, res, next) => {
    uploadAvatar.single('avatar')(req, res, (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : 'File không hợp lệ';
        return res.status(400).json({ success: false, error: message });
      }
      next();
    });
  },
  async (req: AuthRequest, res: Response<ApiResponse<UserProfilePayload>>): Promise<void> => {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const file = req.file;
      if (!file) {
        res.status(400).json({ success: false, error: 'Vui lòng chọn file ảnh' });
        return;
      }
      const user = await User.findById(userId);
      if (!user) {
        fs.unlink(file.path, () => {});
        res.status(401).json({ success: false, error: 'User not found' });
        return;
      }
      // Xóa file avatar cũ nếu là file local (path chứa /uploads/avatars/)
      const oldAvatar = user.avatar || '';
      if (oldAvatar && oldAvatar.includes('/uploads/avatars/')) {
        const oldFilename = oldAvatar.replace(/^.*\/uploads\/avatars\//, '');
        const oldPath = path.join(UPLOAD_AVATARS_DIR, oldFilename);
        if (fs.existsSync(oldPath)) {
          fs.unlink(oldPath, () => {});
        }
      }
      const avatarUrl = `/uploads/avatars/${file.filename}`;
      user.avatar = avatarUrl;
      await user.save();
      const updated = await User.findById(userId).select('-password').lean();
      if (!updated) {
        res.status(500).json({ success: false, error: 'Server error' });
        return;
      }
      const profile: UserProfilePayload = {
        id: updated._id.toString(),
        name: updated.name,
        email: updated.email,
        avatar: updated.avatar,
        createdAt: updated.createdAt
          ? new Date(updated.createdAt).toISOString()
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

// DELETE /me – xóa tài khoản (body password), anonymize messages, xóa ConversationRead, xóa User
router.delete(
  '/me',
  authMiddleware,
  async (
    req: AuthRequest<{}, {}, DeleteMeBody>,
    res: Response<ApiResponse<{ message?: string }>>
  ): Promise<void> => {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const password = req.body?.password;
      if (!password || typeof password !== 'string') {
        res.status(400).json({ success: false, error: 'Vui lòng nhập mật khẩu' });
        return;
      }
      const user = await User.findById(userId);
      if (!user) {
        res.status(401).json({ success: false, error: 'User not found' });
        return;
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({ success: false, error: 'Mật khẩu không đúng' });
        return;
      }
      // 1. Anonymize messages
      await Message.updateMany(
        { senderId: userId },
        { $set: { senderName: DELETED_USER_DISPLAY_NAME } }
      );
      // 2. Xóa ConversationRead của user
      await ConversationRead.deleteMany({ userId });
      // 3. Xóa User
      await User.findByIdAndDelete(userId);
      res.json({ success: true, data: { message: 'Tài khoản đã được xóa' } });
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