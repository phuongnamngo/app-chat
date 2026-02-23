import { io, Socket } from 'socket.io-client';
import { SendMessageData, TypingData, Message } from '../types';

const SERVER_URL = 'http://192.168.100.142:3000';

// Định nghĩa Socket events
interface ServerToClientEvents {
  receive_message: (data: Message) => void;
  online_users: (userIds: string[]) => void;
  user_typing: (data: { userId: string; userName: string }) => void;
  user_stop_typing: (data: { userId: string }) => void;
}

interface ClientToServerEvents {
  user_online: (userId: string) => void;
  join_room: (roomId: string) => void;
  send_message: (data: SendMessageData) => void;
  typing: (data: TypingData) => void;
  stop_typing: (data: { roomId: string; userId: string }) => void;
}

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

export const connectSocket = (userId: string): TypedSocket => {
  socket = io(SERVER_URL, {
    transports: ['websocket'],
    autoConnect: true,
  }) as TypedSocket;

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket?.id);
    socket?.emit('user_online', userId);
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected');
  });

  socket.on('connect_error', (error: Error) => {
    console.error('❌ Socket connection error:', error.message);
  });

  return socket;
};

export const getSocket = (): TypedSocket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};