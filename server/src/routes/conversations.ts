import { Router, Response } from 'express';
import Message from '../models/Message';
import User from '../models/User';
import ConversationRead from '../models/ConversationRead';
import authMiddleware from '../middleware/auth';
import { AuthRequest, ApiResponse, UserPayload } from '../types';

const router = Router();

/** Parse roomId "room_id1_id2" to [id1, id2] (sorted). Returns null if invalid. */
function parseRoomIds(roomId: string): string[] | null {
  if (!roomId.startsWith('room_')) return null;
  const parts = roomId.split('_').slice(1);
  if (parts.length !== 2) return null;
  return parts.sort();
}

/** GET /api/conversations - list rooms current user participates in, with unreadCount */
router.get(
  '/',
  authMiddleware,
  async (
    req: AuthRequest,
    res: Response<ApiResponse<Array<{ roomId: string; otherUser: UserPayload; lastMessage: string; lastMessageAt: string; unreadCount: number }>>>
  ): Promise<void> => {
    try {
      const userId = req.userId!;

      const allRoomIds = await Message.distinct('roomId');
      const myRoomIds = allRoomIds.filter((roomId) => {
        const ids = parseRoomIds(roomId);
        if (!ids) return false;
        return ids[0] === userId || ids[1] === userId;
      });

      const readMap = new Map<string, Date>();
      const readDocs = await ConversationRead.find({
        userId,
        roomId: { $in: myRoomIds },
      }).lean();
      readDocs.forEach((r) => readMap.set(r.roomId, r.lastReadAt));

      const results: Array<{
        roomId: string;
        otherUser: UserPayload;
        lastMessage: string;
        lastMessageAt: string;
        unreadCount: number;
      }> = [];

      for (const roomId of myRoomIds) {
        const lastMsg = await Message.findOne({ roomId })
          .sort({ timestamp: -1 })
          .lean();
        if (!lastMsg) continue;

        const ids = parseRoomIds(roomId)!;
        const otherUserId = ids[0] === userId ? ids[1] : ids[0];
        const otherUserDoc = await User.findById(otherUserId)
          .select('name email avatar')
          .lean();
        if (!otherUserDoc) continue;

        const lastReadAt = readMap.get(roomId) || new Date(0);
        const unreadCount = await Message.countDocuments({
          roomId,
          timestamp: { $gt: lastReadAt },
          senderId: { $ne: userId },
        });

        results.push({
          roomId,
          otherUser: {
            id: otherUserDoc._id.toString(),
            name: otherUserDoc.name,
            email: otherUserDoc.email,
            avatar: otherUserDoc.avatar,
          },
          lastMessage: lastMsg.message,
          lastMessageAt: lastMsg.timestamp.toISOString(),
          unreadCount,
        });
      }

      results.sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );

      res.json({ success: true, data: results });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Server error';
      res.status(500).json({ success: false, error: message });
    }
  }
);

/** POST /api/conversations/:roomId/read - mark room as read */
router.post(
  '/:roomId/read',
  authMiddleware,
  async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
    try {
      const userId = req.userId!;
      const roomId = typeof req.params.roomId === 'string' ? req.params.roomId : req.params.roomId?.[0] ?? '';

      const ids = parseRoomIds(roomId);
      if (!ids || (ids[0] !== userId && ids[1] !== userId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid room or not a participant',
        });
        return;
      }

      const lastMsg = await Message.findOne({ roomId })
        .sort({ timestamp: -1 })
        .select('timestamp')
        .lean();
      const lastReadAt = lastMsg ? lastMsg.timestamp : new Date();

      await ConversationRead.findOneAndUpdate(
        { userId, roomId },
        { $set: { lastReadAt } },
        { upsert: true, new: true }
      );

      res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Server error';
      res.status(500).json({ success: false, error: message });
    }
  }
);

export default router;
