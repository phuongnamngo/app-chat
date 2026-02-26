import { Request } from 'express';
import { Document, Types } from 'mongoose';

// ==================
// USER TYPES
// ==================
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatar: string;
  createdAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

export interface UserPayload {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// ==================
// MESSAGE TYPES
// ==================
export type MessageType = 'text' | 'image' | 'file';

export interface IMessage extends Document {
  _id: Types.ObjectId;
  roomId: string;
  senderId: string;
  senderName: string;
  message: string;
  messageType: MessageType;
  timestamp: Date;
  read: boolean;
}

export interface SendMessageData {
  roomId: string;
  senderId: string;
  senderName: string;
  message: string;
  messageType?: MessageType;
}

export interface ReceiveMessageData extends SendMessageData {
  timestamp: Date;
}

// ==================
// CONVERSATION TYPES
// ==================
export interface IConversation extends Document {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  lastMessage: string;
  lastMessageAt: Date;
  createdAt: Date;
}

// ==================
// AUTH TYPES
// ==================
export interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserPayload;
}

export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  userId?: string;
}

// ==================
// SOCKET TYPES
// ==================
export interface TypingData {
  roomId: string;
  userId: string;
  userName: string;
}

export interface ServerToClientEvents {
  receive_message: (data: ReceiveMessageData) => void;
  online_users: (userIds: string[]) => void;
  user_typing: (data: { userId: string; userName: string }) => void;
  user_stop_typing: (data: { userId: string }) => void;
}

export interface ClientToServerEvents {
  user_online: (userId: string) => void;
  join_room: (roomId: string) => void;
  send_message: (data: SendMessageData) => void;
  typing: (data: TypingData) => void;
  stop_typing: (data: { roomId: string; userId: string }) => void;
}

// ==================
// API RESPONSE TYPES
// ==================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ==================
// DEVICE TOKEN
// ==================
export interface IDeviceToken extends Document {
  userId: string;
  token: string;
  platform: 'ios' | 'android';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==================
// NOTIFICATION
// ==================
export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushNotificationData {
  roomId: string;
  senderId: string;
  senderName: string;
  message: string;
  messageType: string;
  timestamp: string;
}

// ==================
// USER (cập nhật thêm fcmTokens)
// ==================
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatar: string;
  fcmTokens: string[];       // ← THÊM MỚI
  createdAt: Date;
  comparePassword(password: string): Promise<boolean>;
}