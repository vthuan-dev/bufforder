import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface AdminData {
  id: string;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  adminData: AdminData | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminData, setAdminData] = useState<AdminData | null>(null);

  const checkAuth = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.adminProfile();
      if (response.success) {
        setAdminData(response.data);
        setIsAuthenticated(true);
      } else {
        // Token invalid, clear storage
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        toast.error('Phiên đăng nhập đã hết hạn');
      }
    } catch (error) {
      // Token invalid or network error
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await api.adminLogin(username, password);
      
      if (response.success) {
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminData', JSON.stringify(response.data.admin));
        setAdminData(response.data.admin);
        setIsAuthenticated(true);
        toast.success('Đăng nhập thành công!');
        return true;
      } else {
        toast.error(response.message || 'Đăng nhập thất bại');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Lỗi kết nối. Vui lòng thử lại.';
      toast.error(errorMessage);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setAdminData(null);
    setIsAuthenticated(false);
    toast.success('Đăng xuất thành công!');
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    adminData,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
