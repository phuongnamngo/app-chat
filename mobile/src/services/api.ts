import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import {
  LoginData,
  RegisterData,
  AuthResponse,
  ApiResponse,
  Message,
} from '../types';
import { storage } from '@/App';

const API_URL = 'http://192.168.19.105:3000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Interceptor: Thêm token vào mỗi request
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storage.getString('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ======= AUTH API =======
export const authAPI = {
  login: async (data: LoginData): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      data
    );
    return response.data;
  },

  register: async (
    data: RegisterData
  ): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post<ApiResponse<AuthResponse>>(
      '/auth/register',
      data
    );
    return response.data;
  },
};

// ======= MESSAGE API =======
export const messageAPI = {
  getMessages: async (
    roomId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<Message[]>> => {
    const response = await api.get<ApiResponse<Message[]>>(
      `/messages/${roomId}?page=${page}&limit=${limit}`
    );
    return response.data;
  },
};

// ======= NOTIFICATION API (FCM token) =======
export const notificationAPI = {
  saveToken: async (fcmToken: string): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>('/notifications/token', {
      fcmToken,
    });
    return response.data;
  },

  removeToken: async (fcmToken: string): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>('/notifications/token', {
      data: { fcmToken },
    });
    return response.data;
  },
};

// ======= CONVERSATIONS API (list + unread, mark read) =======
export interface ConversationItem {
  roomId: string;
  otherUser: { id: string; name: string; email: string; avatar?: string };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export const conversationAPI = {
  getList: async (): Promise<ApiResponse<ConversationItem[]>> => {
    const response = await api.get<ApiResponse<ConversationItem[]>>(
      '/conversations'
    );
    return response.data;
  },

  markAsRead: async (roomId: string): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>(
      `/conversations/${encodeURIComponent(roomId)}/read`
    );
    return response.data;
  },
};

export default api;