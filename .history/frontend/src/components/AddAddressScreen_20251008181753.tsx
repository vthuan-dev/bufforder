import React, { useState } from 'react';
import { ArrowLeft, AlertCircle, MapPin, Phone, User, Home, Building2, Shield } from 'lucide-react';

type Props = {
  onCancel: () => void;
  onSuccess: () => void;
};

const AddAddressScreen: React.FC<Props> = ({ onCancel, onSuccess }) => {
  const [form, setForm] = useState({
    fullName: '',
    phoneNumber: '',
    addressLine1: '',
    city: '',
    postalCode: ''
  });
  const [errors, setErrors] = useState({
    fullName: '',
    phoneNumber: '',
    addressLine1: '',
    city: '',
    postalCode: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const validate = () => {
    const e = { fullName: '', phoneNumber: '', addressLine1: '', city: '', postalCode: '' };
    if (!form.fullName.trim()) e.fullName = 'Họ và tên là bắt buộc';
    if (!form.phoneNumber.trim()) e.phoneNumber = 'Số điện thoại là bắt buộc';
    else if (!/^\+?[\d\s\-\(\)]+$/.test(form.phoneNumber)) e.phoneNumber = 'Số điện thoại không hợp lệ';
    if (!form.addressLine1.trim()) e.addressLine1 = 'Địa chỉ là bắt buộc';
    if (!form.city.trim()) e.city = 'Thành phố là bắt buộc';
    if (!form.postalCode.trim()) e.postalCode = 'Mã bưu điện là bắt buộc';
    setErrors(e);
    return Object.values(e).every(v => v === '');
  };

  const save = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Address saved:', form);
      onSuccess();
    } catch (err: any) {
      console.error('Failed to save address:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Modern Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.05) 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, rgba(99, 102, 241, 0.05) 0%, transparent 50%)`
        }} />
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-400/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Enhanced Header */}
      <div className="relative z-10 sticky top-0 backdrop-blur-lg bg-white/90 border-b border-gray-100/50 shadow-sm">
        <div className="flex items-center p-4 max-w-md mx-auto">
          <button
            onClick={onCancel}
            className="mr-3 w-10 h-10 bg-white rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all duration-200 shadow-md border border-gray-100 hover:shadow-lg active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-gray-900 text-lg font-semibold">Thêm Địa Chỉ Mới</h1>
            <p className="text-gray-500 text-sm">Điền thông tin giao hàng</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-4 max-w-md mx-auto">
        <div className="mt-4 rounded-2xl shadow-xl border border-white/50 bg-white/95 backdrop-blur-xl overflow-hidden">
          {/* Clean Header Card */}
          <div className="relative p-6 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-white text-lg font-semibold">Thông Tin Giao Hàng</h2>
                <p className="text-blue-100 text-sm">Chúng tôi sẽ sử dụng cho việc giao hàng</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-gray-700 flex items-center gap-2 text-sm font-medium">
                <User className="w-4 h-4 text-blue-500" />
                Họ và Tên
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nhập họ và tên của bạn"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 pl-4 pr-4 outline-none text-gray-900 placeholder-gray-400"
                />
              </div>
              {errors.fullName && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                  <AlertCircle className="w-4 h-4" />
                  {errors.fullName}
                </div>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-gray-700 flex items-center gap-2 text-sm font-medium">
                <Phone className="w-4 h-4 text-blue-500" />
                Số Điện Thoại
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="Nhập số điện thoại của bạn"
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 pl-4 pr-4 outline-none text-gray-900 placeholder-gray-400"
                />
              </div>
              {errors.phoneNumber && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                  <AlertCircle className="w-4 h-4" />
                  {errors.phoneNumber}
                </div>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="text-gray-700 flex items-center gap-2 text-sm font-medium">
                <Home className="w-4 h-4 text-blue-500" />
                Địa Chỉ Đường
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nhập địa chỉ đường của bạn"
                  value={form.addressLine1}
                  onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                  className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 pl-4 pr-4 outline-none text-gray-900 placeholder-gray-400"
                />
              </div>
              {errors.addressLine1 && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                  <AlertCircle className="w-4 h-4" />
                  {errors.addressLine1}
                </div>
              )}
            </div>

            {/* City & Postal Code */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-slate-700 flex items-center gap-2 text-sm font-medium">
                  <Building2 className="w-4 h-4 text-violet-500" />
                  Thành Phố
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Thành phố"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-300 pl-4 pr-4 outline-none"
                  />
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${form.city ? 'opacity-100' : ''}`} />
                </div>
                {errors.city && (
                  <div className="flex items-center gap-1 text-red-500 text-xs bg-red-50 p-2 rounded-lg border border-red-100">
                    <AlertCircle className="w-3 h-3" />
                    {errors.city}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-slate-700 flex items-center gap-2 text-sm font-medium">
                  <MapPin className="w-4 h-4 text-violet-500" />
                  Mã Bưu Điện
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="12345"
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-300 pl-4 pr-4 outline-none"
                  />
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${form.postalCode ? 'opacity-100' : ''}`} />
                </div>
                {errors.postalCode && (
                  <div className="flex items-center gap-1 text-red-500 text-xs bg-red-50 p-2 rounded-lg border border-red-100">
                    <AlertCircle className="w-3 h-3" />
                    {errors.postalCode}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6">
              {/* Cancel Button */}
              <button 
                type="button"
                className="group relative flex-1 h-14 rounded-[20px] bg-gradient-to-b from-gray-50 to-white border border-gray-200/80 hover:border-gray-300/80 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden outline-none focus:ring-2 focus:ring-gray-300/50"
                onClick={onCancel}
              >
                {/* Button background effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.02),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Button content */}
                <div className="relative flex items-center justify-center w-full h-full">
                  <span className="text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
                    Hủy
                  </span>
                </div>
                
                {/* Subtle shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              </button>

              {/* Submit Button */}
              <button
                type="button"
                className="group relative flex-1 h-14 rounded-[20px] bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 hover:from-violet-600 hover:via-purple-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg outline-none focus:ring-2 focus:ring-violet-300/50 overflow-hidden"
                onClick={save}
                disabled={isSaving}
              >
                {/* Gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/10" />
                
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                
                {/* Button content */}
                <div className="relative flex items-center justify-center w-full h-full text-white">
                  {isSaving ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="relative">
                        <div className="w-5 h-5 border-2 border-white/30 rounded-full" />
                        <div className="absolute top-0 left-0 w-5 h-5 border-2 border-transparent border-t-white rounded-full animate-spin" />
                      </div>
                      <span className="font-medium">Đang lưu...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-medium">Thêm Địa Chỉ</span>
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Bottom glow effect */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-violet-500/30 blur-xl rounded-full opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
              </button>
            </div>

            {/* Security Note */}
            <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 p-4 rounded-2xl border border-emerald-100">
              <p className="text-emerald-700 text-sm text-center flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Thông tin của bạn được mã hóa và chỉ sử dụng cho việc giao hàng.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAddressScreen;