import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Phone, Lock, User, Mail } from 'lucide-react';

interface RegisterPageProps {
  onRegister: (userData: { phoneNumber: string; password: string; fullName: string; email: string }) => Promise<void>;
  onSwitchToLogin: () => void;
  onBack: () => void;
}

export function RegisterPage({ onRegister, onSwitchToLogin, onBack }: RegisterPageProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePhoneNumber = (phone: string) => {
    // Vietnamese phone number validation
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(''); // Clear error when user starts typing
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.fullName.trim()) {
      setError('Vui lòng nhập họ và tên');
      return;
    }

    if (!formData.phoneNumber.trim()) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }

    if (!validatePhoneNumber(formData.phoneNumber)) {
      setError('Số điện thoại không hợp lệ');
      return;
    }

    if (!formData.email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Email không hợp lệ');
      return;
    }

    if (!formData.password.trim()) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);

    try {
      await onRegister({
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        fullName: formData.fullName,
        email: formData.email
      });
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
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
            <h1 className="text-lg font-medium text-gray-900">Đăng ký</h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Welcome Message */}
          <div className="text-center mb-8 mt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tạo tài khoản mới</h2>
            <p className="text-gray-600">Điền thông tin để tạo tài khoản</p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleRegister} className="space-y-6">
            {/* Full Name Input */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Họ và tên</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Nhập họ và tên"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="h-12 text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            {/* Phone Number Input */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Số điện thoại</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Nhập số điện thoại"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className="h-12 text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Nhập email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
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
                placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="h-12 text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
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

            {/* Register Button */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-gray-900 text-white text-base font-medium rounded-lg hover:bg-gray-800 transition-colors" 
              disabled={isLoading}
            >
              {isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
            </Button>
          </form>

          {/* Switch to Login */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:text-blue-800 font-medium underline"
              >
                Đăng nhập ngay
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
