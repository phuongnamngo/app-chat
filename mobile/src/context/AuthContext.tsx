import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { authAPI } from '../services/api';
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
    } else {
      throw new Error(response.error || 'Login failed');
    }
  }, []);

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
    } else {
      throw new Error(response.error || 'Register failed');
    }
  }, []);

  // Logout
  const logout = useCallback(async (): Promise<void> => {
    await storage.delete('token');
    await storage.delete('user');
    disconnectSocket();
    setToken(null);
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
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
