import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';
import Message from '../models/Message';
import Conversation from '../models/Conversation';
import notificationService from '../services/notificationService';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  SendMessageData,
  TypingData,
  PushNotificationData,
} from '../types';

type TypedIO = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

// Lưu trạng thái online: userId -> socketId
const onlineUsers = new Map<string, string>();

const chatHandler = (io: TypedIO): void => {
  io.on('connection', (socket: TypedSocket) => {
    console.log(`🟢 User connected: ${socket.id}`);

    // ======= USER ONLINE =======
    socket.on('user_online', (userId: string) => {
      onlineUsers.set(userId, socket.id);

      // Broadcast danh sách online
      io.emit('online_users', Array.from(onlineUsers.keys()));
      console.log(`👤 User ${userId} is online (${onlineUsers.size} total)`);
    });

    // ======= JOIN ROOM =======
    socket.on('join_room', (roomId: string) => {
      socket.join(roomId);
      console.log(`📌 Socket ${socket.id} joined room: ${roomId}`);
    });

    // ======= SEND MESSAGE =======
    socket.on('send_message', async (data: SendMessageData) => {
      const { roomId, senderId, senderName, message, messageType } = data;

      const msgData = {
        roomId,
        senderId,
        senderName,
        message,
        messageType: messageType || 'text' as const,
        timestamp: new Date(),
      };

      // Lưu vào MongoDB
      try {
        const newMessage = new Message(msgData);
        await newMessage.save();

        // Cập nhật Conversation (lastMessage, lastMessageAt) cho GET /api/conversations
        const ids = roomId.replace('room_', '').split('_').sort();
        if (ids.length === 2) {
          const participantIds = ids.map((id) => new mongoose.Types.ObjectId(id));
          const existing = await Conversation.findOne({
            participants: { $all: participantIds },
          });
          if (existing) {
            existing.lastMessage = message;
            existing.lastMessageAt = msgData.timestamp;
            await existing.save();
          } else {
            await Conversation.create({
              participants: participantIds,
              lastMessage: message,
              lastMessageAt: msgData.timestamp,
            });
          }
        }
      } catch (error) {
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
          if (uid === senderId) return false;

          // Kiểm tra user có đang online không
          const recipientSocketId = onlineUsers.get(uid);
          if (!recipientSocketId) return true; // offline → gửi push

          // Kiểm tra user online nhưng có đang ở room này không
          const recipientSocket = io.sockets.sockets.get(recipientSocketId);
          if (!recipientSocket) return true;

          const isInRoom = recipientSocket.rooms.has(roomId);
          return !isInRoom; // không ở room → gửi push
        });

        if (offlineRecipients.length > 0) {
          // Cắt ngắn message cho notification
          const truncatedMessage =
            message.length > 100
              ? message.substring(0, 100) + '...'
              : message;

          const notificationData: PushNotificationData = {
            roomId,
            senderId,
            senderName,
            message: truncatedMessage,
            messageType: messageType || 'text',
            timestamp: msgData.timestamp.toISOString(),
          };

          await notificationService.sendToUsers(
            offlineRecipients,
            senderName,
            truncatedMessage,
            notificationData
          );

          console.log(
            `📤 Push sent to ${offlineRecipients.length} offline user(s)`
          );
        }
      } catch (error) {
        console.error('❌ Error sending push notification:', error);
      }
    });

    // ======= TYPING =======
    socket.on('typing', (data: TypingData) => {
      socket.to(data.roomId).emit('user_typing', {
        userId: data.userId,
        userName: data.userName,
      });
    });

    socket.on('stop_typing', (data: { roomId: string; userId: string }) => {
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

export default chatHandler;