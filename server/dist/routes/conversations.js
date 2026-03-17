"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Message_1 = __importDefault(require("../models/Message"));
const User_1 = __importDefault(require("../models/User"));
const ConversationRead_1 = __importDefault(require("../models/ConversationRead"));
const auth_1 = __importDefault(require("../middleware/auth"));
const router = (0, express_1.Router)();
/** Parse roomId "room_id1_id2" to [id1, id2] (sorted). Returns null if invalid. */
function parseRoomIds(roomId) {
    if (!roomId.startsWith('room_'))
        return null;
    const parts = roomId.split('_').slice(1);
    if (parts.length !== 2)
        return null;
    return parts.sort();
}
/** GET /api/conversations - list rooms current user participates in, with unreadCount */
router.get('/', auth_1.default, async (req, res) => {
    try {
        const userId = req.userId;
        const allRoomIds = await Message_1.default.distinct('roomId');
        const myRoomIds = allRoomIds.filter((roomId) => {
            const ids = parseRoomIds(roomId);
            if (!ids)
                return false;
            return ids[0] === userId || ids[1] === userId;
        });
        const readMap = new Map();
        const readDocs = await ConversationRead_1.default.find({
            userId,
            roomId: { $in: myRoomIds },
        }).lean();
        readDocs.forEach((r) => readMap.set(r.roomId, r.lastReadAt));
        const results = [];
        for (const roomId of myRoomIds) {
            const lastMsg = await Message_1.default.findOne({ roomId })
                .sort({ timestamp: -1 })
                .lean();
            if (!lastMsg)
                continue;
            const ids = parseRoomIds(roomId);
            const otherUserId = ids[0] === userId ? ids[1] : ids[0];
            const otherUserDoc = await User_1.default.findById(otherUserId)
                .select('name email avatar')
                .lean();
            const otherUser = otherUserDoc
                ? {
                    id: otherUserDoc._id.toString(),
                    name: otherUserDoc.name,
                    email: otherUserDoc.email,
                    avatar: otherUserDoc.avatar,
                }
                : {
                    id: otherUserId,
                    name: 'Tài khoản đã xóa',
                    email: '',
                    avatar: '',
                };
            const lastReadAt = readMap.get(roomId) || new Date(0);
            const unreadCount = await Message_1.default.countDocuments({
                roomId,
                timestamp: { $gt: lastReadAt },
                senderId: { $ne: userId },
            });
            results.push({
                roomId,
                otherUser,
                lastMessage: lastMsg.message,
                lastMessageAt: lastMsg.timestamp.toISOString(),
                unreadCount,
            });
        }
        results.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
        res.json({ success: true, data: results });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Server error';
        res.status(500).json({ success: false, error: message });
    }
});
/** POST /api/conversations/:roomId/read - mark room as read */
router.post('/:roomId/read', auth_1.default, async (req, res) => {
    try {
        const userId = req.userId;
        const roomId = typeof req.params.roomId === 'string' ? req.params.roomId : req.params.roomId?.[0] ?? '';
        const ids = parseRoomIds(roomId);
        if (!ids || (ids[0] !== userId && ids[1] !== userId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid room or not a participant',
            });
            return;
        }
        const lastMsg = await Message_1.default.findOne({ roomId })
            .sort({ timestamp: -1 })
            .select('timestamp')
            .lean();
        const lastReadAt = lastMsg ? lastMsg.timestamp : new Date();
        await ConversationRead_1.default.findOneAndUpdate({ userId, roomId }, { $set: { lastReadAt } }, { upsert: true, new: true });
        res.json({ success: true, message: 'Marked as read' });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Server error';
        res.status(500).json({ success: false, error: message });
    }
});
exports.default = router;
//# sourceMappingURL=conversations.js.map