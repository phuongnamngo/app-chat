// ==================
// USER
// ==================
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt?: string;
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
import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  // Chat tab stack (when inside Main)
  ChatList: undefined;
  Chat: {
    roomId: string;
    userId: string;
    userName: string;
    otherUserName?: string;
  };
  // Menu tab stack (when inside Main)
  Menu: undefined;
  Settings: undefined;
  // Legacy (used by commented-out Startup/Example; Paths enum uses lowercase)
  example?: undefined;
  startup?: undefined;
};

export type MainTabParamList = {
  Chat: NavigatorScreenParams<ChatStackParamList>;
  Menu: NavigatorScreenParams<MenuStackParamList>;
};

export type ChatStackParamList = {
  ChatList: undefined;
  Chat: {
    roomId: string;
    userId: string;
    userName: string;
    otherUserName?: string;
  };
};

export type MenuStackParamList = {
  Menu: undefined;
  Settings: undefined;
};