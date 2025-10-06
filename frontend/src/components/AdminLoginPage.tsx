import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AdminAuthContext';

export function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập');
      return;
    }

    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (!success) {
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-bounce"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-xl animate-bounce delay-1000"></div>
      <div className="absolute top-1/2 left-10 w-24 h-24 bg-pink-500/10 rounded-full blur-xl animate-bounce delay-500"></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mb-4 shadow-xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-2">
              Admin Portal
            </h1>
            <p className="text-white/70 text-sm">Đăng nhập để truy cập hệ thống quản trị</p>
          </div>

          {/* Login Form */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Username Input */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-semibold text-white/90">
                  Tên đăng nhập
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Nhập tên đăng nhập"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-10 bg-white/90 border-white/20 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 hover:bg-white text-sm"
                  disabled={isLoading}
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-semibold text-white/90">
                  Mật khẩu
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 bg-white/90 border-white/20 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 hover:bg-white text-sm"
                  disabled={isLoading}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-red-300 text-xs text-center bg-red-500/20 p-3 rounded-lg border border-red-500/30 backdrop-blur-sm">
                  {error}
                </div>
              )}

              {/* Login Button */}
              <Button 
                type="submit" 
                className="w-full h-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Đang đăng nhập...
                  </div>
                ) : (
                  'Đăng nhập'
                )}
              </Button>
            </form>

          </div>

          {/* Back to Main Site */}
          <div className="text-center mt-6">
            <a
              href="/"
              className="inline-flex items-center text-white/60 hover:text-white transition-all duration-300 hover:scale-105 text-sm"
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              Quay lại trang chủ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
