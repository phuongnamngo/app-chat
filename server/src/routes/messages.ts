import { Router, Response } from 'express';
import Message from '../models/Message';
import authMiddleware from '../middleware/auth';
import { AuthRequest, ApiResponse, IMessage } from '../types';

const router = Router();

// Lấy tin nhắn theo room (có phân trang)
router.get(
  '/:roomId',
  authMiddleware,
  async (
    req: AuthRequest,
    res: Response<ApiResponse<IMessage[]>>
  ): Promise<void> => {
    try {
      const { roomId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      const messages = await Message.find({ roomId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Trả về theo thứ tự cũ → mới
      res.json({
        success: true,
        data: messages.reverse() as IMessage[],
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Server error';
      res.status(500).json({ success: false, error: message });
    }
  }
);

export default router;