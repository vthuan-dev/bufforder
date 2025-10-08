import React, { useState } from 'react';
import { ArrowLeft, AlertCircle, MapPin, Phone, User, Home, Building2 } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';

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
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-violet-200/30 to-purple-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-cyan-200/20 to-blue-300/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 sticky top-0 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-sm">
        <div className="flex items-center p-4 max-w-lg mx-auto">
          <button
            onClick={onCancel}
            className="mr-4 w-11 h-11 bg-white/70 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white/90 transition-all duration-300 shadow-lg border border-white/30 hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-slate-800 text-xl">Add New Address</h1>
            <p className="text-slate-500 text-sm">Điền thông tin giao hàng</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-4 max-w-lg mx-auto">
        <div className="mt-6 rounded-3xl shadow-2xl border border-white/30 bg-white/70 backdrop-blur-2xl overflow-hidden">
          {/* Header Card */}
          <div className="relative p-8 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_50%)]" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
            
            <div className="relative flex items-center space-x-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-white text-xl">Shipping Details</h2>
                <p className="text-violet-100 text-sm">Chúng tôi sẽ sử dụng cho việc giao hàng</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-8 space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label className="text-slate-700 flex items-center gap-2">
                <User className="w-4 h-4 text-violet-500" />
                Full Name
              </Label>
              <div className="relative group">
                <Input
                  placeholder="Enter your full name"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-300 pl-4 pr-4"
                />
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${form.fullName ? 'opacity-100' : ''}`} />
              </div>
              {errors.fullName && (
                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
                  <AlertCircle className="w-4 h-4" />
                  {errors.fullName}
                </div>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label className="text-slate-700 flex items-center gap-2">
                <Phone className="w-4 h-4 text-violet-500" />
                Phone Number
              </Label>
              <div className="relative group">
                <Input
                  placeholder="Enter your phone number"
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-300 pl-4 pr-4"
                />
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${form.phoneNumber ? 'opacity-100' : ''}`} />
              </div>
              {errors.phoneNumber && (
                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
                  <AlertCircle className="w-4 h-4" />
                  {errors.phoneNumber}
                </div>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label className="text-slate-700 flex items-center gap-2">
                <Home className="w-4 h-4 text-violet-500" />
                Address Line 1
              </Label>
              <div className="relative group">
                <Input
                  placeholder="Enter your street address"
                  value={form.addressLine1}
                  onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-300 pl-4 pr-4"
                />
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${form.addressLine1 ? 'opacity-100' : ''}`} />
              </div>
              {errors.addressLine1 && (
                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
                  <AlertCircle className="w-4 h-4" />
                  {errors.addressLine1}
                </div>
              )}
            </div>

            {/* City & Postal Code */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-violet-500" />
                  City
                </Label>
                <div className="relative group">
                  <Input
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-300 pl-4 pr-4"
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
                <Label className="text-slate-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-violet-500" />
                  Postal Code
                </Label>
                <div className="relative group">
                  <Input
                      placeholder="Postal Code"
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-300 pl-4 pr-4"
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
            <div className="flex gap-4 pt-4">
              <Button 
                variant="outline" 
                className="flex-1 h-12 rounded-2xl border-slate-200 bg-white/50 hover:bg-white hover:shadow-lg transition-all duration-300"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                onClick={save}
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  'Add Address'
                )}
              </Button>
            </div>

            {/* Security Note */}
            <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 p-4 rounded-2xl border border-emerald-100">
              <p className="text-emerald-700 text-sm text-center flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Your information is encrypted and used only for delivery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAddressScreen;