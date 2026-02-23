// ==================
// USER
// ==================
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// ==================
// MESSAGE
// ==================
export type MessageType = 'text' | 'image' | 'file';

export interface Message {
  roomId: string;
  senderId: string;
  senderName: string;
  message: string;
  messageType?: MessageType;
  timestamp: Date | string;
  read?: boolean;
}

export interface SendMessageData {
  roomId: string;
  senderId: string;
  senderName: string;
  message: string;
  messageType?: MessageType;
}

// ==================
// AUTH
// ==================
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ==================
// CONVERSATION
// ==================
export interface Conversation {
  id: string;
  participants: User[];
  lastMessage: string;
  lastMessageAt: string;
}

// ==================
// SOCKET EVENTS
// ==================
export interface TypingData {
  roomId: string;
  userId: string;
  userName: string;
}

// ==================
// NAVIGATION
// ==================
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ChatList: undefined;
  Chat: {
    roomId: string;
    userId: string;
    userName: string;
    otherUserName?: string;
  };
};