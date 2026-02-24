import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import {
  RegisterBody,
  LoginBody,
  AuthResponse,
  ApiResponse,
} from '../types';

const router = Router();
const JWT_SECRET: string = process.env.JWT_SECRET || '3a6b5d2b9f8f536613f3d451d7f771c0ffdb620851e2b23db25c22a0a16445ad';

// ============ ĐĂNG KÝ ============
router.post(
  '/register',
  async (
    req: Request<{}, {}, RegisterBody>,
    res: Response<ApiResponse<AuthResponse>>
  ): Promise<void> => {
    try {
      const { name, email, password } = req.body;

      // Validate
      if (!name || !email || !password) {
        res.status(400).json({
          success: false,
          error: 'Vui lòng điền đầy đủ thông tin',
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          error: 'Mật khẩu phải có ít nhất 6 ký tự',
        });
        return;
      }

      // Kiểm tra email tồn tại
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({
          success: false,
          error: 'Email đã tồn tại',
        });
        return;
      }

      // Tạo user mới
      const user = new User({ name, email, password });
      await user.save();

      // Tạo token
      const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, {
        expiresIn: '7d',
      });

      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
          },
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Server error';
      res.status(500).json({ success: false, error: message });
    }
  }
);

// ============ ĐĂNG NHẬP ============
router.post(
  '/login',
  async (
    req: Request<{}, {}, LoginBody>,
    res: Response<ApiResponse<AuthResponse>>
  ): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Vui lòng điền email và mật khẩu',
        });
        return;
      }

      // Tìm user
      const user = await User.findOne({ email });
      if (!user) {
        res.status(400).json({
          success: false,
          error: 'Email không tồn tại',
        });
        return;
      }

      // So sánh password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(400).json({
          success: false,
          error: 'Mật khẩu không đúng',
        });
        return;
      }

      // Tạo token
      const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, {
        expiresIn: '7d',
      });

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            avatar: user.avatar,
          },
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Server error';
      res.status(500).json({ success: false, error: message });
    }
  }
);

export default router;