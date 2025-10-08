import React, { useState } from 'react';
import { ArrowLeft, AlertCircle, MapPin, Phone, User } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import api from '../services/api';
import toast from 'react-hot-toast';

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
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.phoneNumber.trim()) e.phoneNumber = 'Phone number is required';
    else if (!/^\+?[\d\s\-\(\)]+$/.test(form.phoneNumber)) e.phoneNumber = 'Invalid phone number';
    if (!form.addressLine1.trim()) e.addressLine1 = 'Address is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.postalCode.trim()) e.postalCode = 'Postal code is required';
    setErrors(e);
    return Object.values(e).every(v => v === '');
  };

  const save = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to save address');
        return;
      }
      const res = await api.addAddress(token, form);
      if (res.success) {
        toast.success('Address added successfully!');
        onSuccess();
      } else {
        toast.error(res.message || 'Failed to add address');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add address');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/70 border-b border-gray-100">
        <div className="flex items-center p-4 max-w-md mx-auto">
          <button
            onClick={onCancel}
            className="mr-3 w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Add New Address</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 max-w-md mx-auto">
        <div className="rounded-2xl shadow-lg border border-gray-100 bg-white/80 backdrop-blur-lg">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-6 rounded-t-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_70%)]" />
            <div className="relative">
              <h2 className="text-white font-semibold text-lg">Shipping Details</h2>
              <p className="text-blue-100 text-sm">We’ll use this for your delivery</p>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 space-y-4">
            {/* Full Name */}
            <div>
              <Label className="mb-1 inline-block text-gray-700">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Enter your full name"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="pl-9 h-11 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" /> {errors.fullName}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <Label className="mb-1 inline-block text-gray-700">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Enter your phone number"
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  className="pl-9 h-11 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {errors.phoneNumber && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" /> {errors.phoneNumber}
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <Label className="mb-1 inline-block text-gray-700">Street Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Enter your street address"
                  value={form.addressLine1}
                  onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                  className="pl-9 h-11 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {errors.addressLine1 && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" /> {errors.addressLine1}
                </p>
              )}
            </div>

            {/* City & Postal Code */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 inline-block text-gray-700">City</Label>
                <Input
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="h-11 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.city && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" /> {errors.city}
                  </p>
                )}
              </div>
              <div>
                <Label className="mb-1 inline-block text-gray-700">Postal Code</Label>
                <Input
                  placeholder="12345"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  className="h-11 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.postalCode && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" /> {errors.postalCode}
                  </p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                className="flex-1 h-11 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all"
                onClick={save}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Add Address'}
              </Button>
            </div>

            <p className="text-[11px] text-gray-500 text-center pt-1">
              Your information is encrypted and used only for delivery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAddressScreen;
