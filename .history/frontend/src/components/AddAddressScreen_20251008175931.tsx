import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Phone, MapPin, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Props = {
  onCancel: () => void;
  onSuccess: () => void;
};

interface FormData {
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  city: string;
  postalCode: string;
}

interface FormErrors {
  fullName?: string;
  phoneNumber?: string;
  addressLine1?: string;
  city?: string;
  postalCode?: string;
}

const fakeAddAddress = (formData: FormData): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Address added:', formData);
      resolve();
    }, 800);
  });
};

const FormField: React.FC<{
  label: string;
  name: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  icon: React.ReactNode;
  autoComplete?: string;
  inputMode?: 'text' | 'tel' | 'numeric';
  disabled?: boolean;
}> = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  icon,
  autoComplete,
  inputMode,
  disabled
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {label}
      </Label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
          {icon}
        </div>
        <Input
          id={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-11 rounded-xl pl-10 pr-4 border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 dark:focus:ring-blue-400 ${
            error ? 'border-red-300 dark:border-red-600 focus:ring-red-500' : ''
          }`}
          autoComplete={autoComplete}
          inputMode={inputMode}
          aria-invalid={!!error}
          disabled={disabled}
        />
      </div>
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1 text-red-600 dark:text-red-400 text-sm"
          >
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AddAddressScreen: React.FC<Props> = ({ onCancel, onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phoneNumber: '',
    addressLine1: '',
    city: '',
    postalCode: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const formatPhoneNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return cleaned;
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[\d\s\-()]{7,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = 'Street address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required';
    } else if (formData.postalCode.length < 3 || formData.postalCode.length > 10) {
      newErrors.postalCode = 'Postal code must be 3-10 characters';
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSaving(true);
      try {
        await fakeAddAddress(formData);
        onSuccess();
      } catch (error) {
        console.error('Failed to add address:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleFieldChange = (field: keyof FormData, value: string) => {
    let processedValue = value;

    if (field === 'phoneNumber') {
      processedValue = formatPhoneNumber(value);
    } else if (field === 'postalCode') {
      processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    }

    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isSaving) {
      onCancel();
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onCancel, isSaving]);

  const isValid = Object.keys(validateForm()).length === 0 && 
                  Object.values(formData).every(value => value.trim() !== '');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-3 px-4 py-3 max-w-md mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="p-2 h-auto rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
            disabled={isSaving}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Add New Address
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto p-4" onKeyDown={handleKeyDown}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="rounded-2xl border border-white/50 dark:border-gray-700/50 shadow-[0_10px_30px_rgba(2,6,23,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] overflow-hidden"
        >
          {/* Gradient Header */}
          <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12px_12px,rgba(255,255,255,.35)_2px,transparent_2px)] bg-[length:22px_22px] opacity-40" />
            <div className="relative z-10">
              <h2 className="text-xl font-semibold text-white drop-shadow-sm">
                Shipping Details
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                We'll use this for your delivery
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-gray-800/70 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4" role="group" aria-live="polite">
                <FormField
                  label="Full Name"
                  name="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(value) => handleFieldChange('fullName', value)}
                  error={errors.fullName}
                  icon={<User className="w-4 h-4" />}
                  autoComplete="name"
                  disabled={isSaving}
                />

                <FormField
                  label="Phone Number"
                  name="phoneNumber"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phoneNumber}
                  onChange={(value) => handleFieldChange('phoneNumber', value)}
                  error={errors.phoneNumber}
                  icon={<Phone className="w-4 h-4" />}
                  autoComplete="tel"
                  inputMode="tel"
                  disabled={isSaving}
                />

                <FormField
                  label="Street Address"
                  name="addressLine1"
                  placeholder="Enter your street address"
                  value={formData.addressLine1}
                  onChange={(value) => handleFieldChange('addressLine1', value)}
                  error={errors.addressLine1}
                  icon={<MapPin className="w-4 h-4" />}
                  autoComplete="address-line1"
                  disabled={isSaving}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="City"
                    name="city"
                    placeholder="Enter city"
                    value={formData.city}
                    onChange={(value) => handleFieldChange('city', value)}
                    error={errors.city}
                    icon={<MapPin className="w-4 h-4" />}
                    autoComplete="address-level2"
                    disabled={isSaving}
                  />

                  <FormField
                    label="Postal Code"
                    name="postalCode"
                    placeholder="Enter postal code"
                    value={formData.postalCode}
                    onChange={(value) => handleFieldChange('postalCode', value)}
                    error={errors.postalCode}
                    icon={<MapPin className="w-4 h-4" />}
                    autoComplete="postal-code"
                    inputMode="numeric"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Security Note */}
              <p className="text-center text-xs text-gray-500 dark:text-gray-400 px-4">
                Your information is encrypted and used only for delivery.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSaving}
                  className="flex-1 h-11 rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-[0.98] transition-transform"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!isValid || isSaving}
                  className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Adding...
                    </div>
                  ) : (
                    'Add Address'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AddAddressScreen;