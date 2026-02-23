import { Server, Socket } from 'socket.io';
import Message from '../models/Message';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  SendMessageData,
  TypingData,
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
      } catch (error) {
        console.error('❌ Error saving message:', error);
      }

      // Broadcast đến room
      io.to(roomId).emit('receive_message', msgData);
      console.log(`💬 [${roomId}] ${senderName}: ${message}`);
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