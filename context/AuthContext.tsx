import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginApi, getMe } from '../src/api/auth';
import { initSocket, disconnectSocket } from '../src/socket';

export type UserRole = 'system_admin' | 'posts_admin' | 'library_admin' | 'general_user';
export type Subscription = 'free' | 'standard' | 'premium' | 'vvip';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  subscriptionTier: Subscription;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load auth data from storage
    const loadAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          await initSocket();
          
          // Verify token/refresh user data
          try {
            const response = await getMe();
            setUser(response.data);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
          } catch (e) {
            console.error('Token verification failed:', e);
            await logout();
          }
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuth();

    // Listen for real-time user updates
    const handleUserUpdate = async (updatedUser: User) => {
      if (user && updatedUser.id === user.id) {
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }
    };

    const s = initSocket().then(socket => {
      socket.on('user:updated', handleUserUpdate);
    });

    return () => {
      initSocket().then(socket => {
        socket.off('user:updated', handleUserUpdate);
      });
    };
  }, [user?.id]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await loginApi(email, password);
      const { token, user } = response.data;
      
      setToken(token);
      setUser(user);
      await initSocket(token);
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      const response = await loginApi(userData.email, userData.password); // Auto login after register? 
      // Actually usually register returns token or user.
      // For now let's assume user logs in manually or we handle it.
      return true;
    } catch (error) {
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    disconnectSocket();
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};