import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Phone, Lock } from 'lucide-react';

interface LoginPageProps {
  onLogin: (phoneNumber: string, password: string) => Promise<void>;
  onSwitchToRegister: () => void;
  onBack: () => void;
}

export function LoginPage({ onLogin, onSwitchToRegister, onBack }: LoginPageProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePhoneNumber = (phone: string) => {
    // Vietnamese phone number validation
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    return phoneRegex.test(phone);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber.trim()) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Số điện thoại không hợp lệ');
      return;
    }

    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setIsLoading(true);

    try {
      await onLogin(phoneNumber, password);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-sm bg-white min-h-screen shadow-lg relative">
        {/* Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="flex items-center p-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="mr-4">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Button>
            <h1 className="text-lg font-medium text-gray-900">Đăng nhập</h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Welcome Message */}
          <div className="text-center mb-8 mt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Chào mừng trở lại</h2>
            <p className="text-gray-600">Đăng nhập để tiếp tục sử dụng dịch vụ</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Phone Number Input */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Số điện thoại</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Nhập số điện thoại"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-12 text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-4 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {/* Login Button */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-gray-900 text-white text-base font-medium rounded-lg hover:bg-gray-800 transition-colors" 
              disabled={isLoading}
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>

          {/* Switch to Register */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-blue-600 hover:text-blue-800 font-medium underline"
              >
                Đăng ký ngay
              </button>
            </p>
          </div>

          {/* Demo Info */}
        
        </div>
      </div>
    </div>
  );
}
