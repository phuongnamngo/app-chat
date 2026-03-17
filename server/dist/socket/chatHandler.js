"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Message_1 = __importDefault(require("../models/Message"));
const Conversation_1 = __importDefault(require("../models/Conversation"));
const notificationService_1 = __importDefault(require("../services/notificationService"));
// Lưu trạng thái online: userId -> socketId
const onlineUsers = new Map();
const chatHandler = (io) => {
    io.on('connection', (socket) => {
        console.log(`🟢 User connected: ${socket.id}`);
        // ======= USER ONLINE =======
        socket.on('user_online', (userId) => {
            onlineUsers.set(userId, socket.id);
            // Broadcast danh sách online
            io.emit('online_users', Array.from(onlineUsers.keys()));
            console.log(`👤 User ${userId} is online (${onlineUsers.size} total)`);
        });
        // ======= JOIN ROOM =======
        socket.on('join_room', (roomId) => {
            socket.join(roomId);
            console.log(`📌 Socket ${socket.id} joined room: ${roomId}`);
        });
        // ======= SEND MESSAGE =======
        socket.on('send_message', async (data) => {
            const { roomId, senderId, senderName, message, messageType } = data;
            const msgData = {
                roomId,
                senderId,
                senderName,
                message,
                messageType: messageType || 'text',
                timestamp: new Date(),
            };
            // Lưu vào MongoDB
            try {
                const newMessage = new Message_1.default(msgData);
                await newMessage.save();
                // Cập nhật Conversation (lastMessage, lastMessageAt) cho GET /api/conversations
                const ids = roomId.replace('room_', '').split('_').sort();
                if (ids.length === 2) {
                    const participantIds = ids.map((id) => new mongoose_1.default.Types.ObjectId(id));
                    const existing = await Conversation_1.default.findOne({
                        participants: { $all: participantIds },
                    });
                    if (existing) {
                        existing.lastMessage = message;
                        existing.lastMessageAt = msgData.timestamp;
                        await existing.save();
                    }
                    else {
                        await Conversation_1.default.create({
                            participants: participantIds,
                            lastMessage: message,
                            lastMessageAt: msgData.timestamp,
                        });
                    }
                }
            }
            catch (error) {
                console.error('❌ Error saving message:', error);
            }
            // Broadcast đến room
            io.to(roomId).emit('receive_message', msgData);
            console.log(`💬 [${roomId}] ${senderName}: ${message}`);
            // =============================================
            // 3) GỬI PUSH NOTIFICATION CHO USER OFFLINE
            // =============================================
            try {
                // Lấy danh sách userId trong room
                // Room format: room_{id1}_{id2}
                const userIdsInRoom = roomId
                    .replace('room_', '')
                    .split('_');
                // Lọc ra những user KHÔNG online hoặc KHÔNG ở trong room
                const offlineRecipients = userIdsInRoom.filter((uid) => {
                    // Bỏ qua người gửi
                    if (uid === senderId)
                        return false;
                    // Kiểm tra user có đang online không
                    const recipientSocketId = onlineUsers.get(uid);
                    if (!recipientSocketId)
                        return true; // offline → gửi push
                    // Kiểm tra user online nhưng có đang ở room này không
                    const recipientSocket = io.sockets.sockets.get(recipientSocketId);
                    if (!recipientSocket)
                        return true;
                    const isInRoom = recipientSocket.rooms.has(roomId);
                    return !isInRoom; // không ở room → gửi push
                });
                if (offlineRecipients.length > 0) {
                    // Cắt ngắn message cho notification
                    const truncatedMessage = message.length > 100
                        ? message.substring(0, 100) + '...'
                        : message;
                    const notificationData = {
                        roomId,
                        senderId,
                        senderName,
                        message: truncatedMessage,
                        messageType: messageType || 'text',
                        timestamp: msgData.timestamp.toISOString(),
                    };
                    await notificationService_1.default.sendToUsers(offlineRecipients, senderName, truncatedMessage, notificationData);
                    console.log(`📤 Push sent to ${offlineRecipients.length} offline user(s)`);
                }
            }
            catch (error) {
                console.error('❌ Error sending push notification:', error);
            }
        });
        // ======= TYPING =======
        socket.on('typing', (data) => {
            socket.to(data.roomId).emit('user_typing', {
                userId: data.userId,
                userName: data.userName,
            });
        });
        socket.on('stop_typing', (data) => {
            socket.to(data.roomId).emit('user_stop_typing', {
                userId: data.userId,
            });
        });
        // ======= DISCONNECT =======
        socket.on('disconnect', () => {
            // Tìm và xóa user khỏi online list
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    console.log(`🔴 User ${userId} disconnected`);
                    break;
                }
            }
            // Broadcast danh sách online mới
            io.emit('online_users', Array.from(onlineUsers.keys()));
            console.log(`📊 Online users: ${onlineUsers.size}`);
        });
    });
};
exports.default = chatHandler;
//# sourceMappingURL=chatHandler.js.map