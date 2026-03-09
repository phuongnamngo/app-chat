import express, { Application } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import connectDB from './config/db';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import messageRoutes from './routes/messages';
import conversationRoutes from './routes/conversations';
import notificationRoutes from './routes/notification';
import chatHandler from './socket/chatHandler';
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from './types';

// Load env
dotenv.config();

// Khởi tạo app
const app: Application = express();
const server = http.createServer(app);

// Socket.IO với TypeScript
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ======= MIDDLEWARE =======
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ======= DATABASE =======
connectDB();

// ======= ROUTES =======
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ======= SOCKET HANDLER =======
chatHandler(io);

// ======= START SERVER =======
const PORT: number = parseInt(process.env.PORT || '3000', 10);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket ready`);
  console.log(`🔗 http://localhost:${PORT}`);
});

export default app;