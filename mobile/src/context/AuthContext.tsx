import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { authAPI, notificationAPI } from '../services/api';
import {
  requestNotificationPermission,
  getFCMToken,
  onFCMTokenRefresh,
} from '../services/firebaseMessaging';
import { connectSocket, disconnectSocket } from '../services/socket';
import { User, LoginData, RegisterData } from '../types';
import { storage } from '@/App';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (partial: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Kiểm tra token khi app khởi động
  useEffect(() => {
    const loadStoredAuth = async (): Promise<void> => {
      try {
        const storedToken = await storage.getString('token');
        const storedUser = await storage.getString('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          const parsedUser: User = JSON.parse(storedUser);
          setUser(parsedUser);
          connectSocket(parsedUser.id);
        }
      } catch (error) {
        console.error('Error loading auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  // FCM token refresh: cập nhật token lên server khi đổi
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onFCMTokenRefresh(async (newToken) => {
      try {
        await notificationAPI.saveToken(newToken);
      } catch {
        // ignore
      }
    });
    return () => unsubscribe();
  }, [user]);

  const registerFCMToken = useCallback(async (authToken: string): Promise<void> => {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;
    const fcmToken = await getFCMToken();
    if (!fcmToken) return;
    try {
      await notificationAPI.saveToken(fcmToken);
    } catch {
      // ignore
    }
  }, []);

  // Login
  const login = useCallback(async (data: LoginData): Promise<void> => {
    const response = await authAPI.login(data);

    if (response.success && response.data) {
      const { token: newToken, user: newUser } = response.data;

      await storage.set('token', newToken);
      await storage.set('user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
      connectSocket(newUser.id);
      await registerFCMToken(newToken);
    } else {
      throw new Error(response.error || 'Login failed');
    }
  }, [registerFCMToken]);

  // Register
  const register = useCallback(async (data: RegisterData): Promise<void> => {
    const response = await authAPI.register(data);
    if (response.success && response.data) {
      const { token: newToken, user: newUser } = response.data;

      await storage.set('token', newToken);
      await storage.set('user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
      connectSocket(newUser.id);
      await registerFCMToken(newToken);
    } else {
      throw new Error(response.error || 'Register failed');
    }
  }, [registerFCMToken]);

  // Logout
  const logout = useCallback(async (): Promise<void> => {
    try {
      const fcmToken = await getFCMToken();
      if (fcmToken) {
        await notificationAPI.removeToken(fcmToken);
      }
    } catch {
      // ignore
    }
    await storage.delete('token');
    await storage.delete('user');
    disconnectSocket();
    setToken(null);
    setUser(null);
  }, []);

  // Cập nhật user (sau khi PATCH /me hoặc upload avatar) và persist storage
  const updateUser = useCallback(async (partial: Partial<User>): Promise<void> => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      void storage.set('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
