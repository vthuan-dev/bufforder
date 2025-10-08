import React, { useState, useEffect } from 'react';
import {
  MapPin,
  DollarSign,
  Minus,
  FileText,
  CreditCard,
  Shield,
  Settings,
  ChevronRight,
  Star,
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  LogOut,
  Crown,
  TrendingUp,
  Sparkles,
  User,
  Phone,
  Home
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export function MyPage() {
  const { user, logout } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('main');
  const [vipStatus, setVipStatus] = useState(null);
  const [isLoadingVip, setIsLoadingVip] = useState(false);

  const navigateToScreen = (screen: string) => {
    setCurrentScreen(screen);
  };

  const navigateBack = () => {
    setCurrentScreen('main');
  };

  // Fetch VIP status when component mounts
  useEffect(() => {
    if (user) {
      fetchVipStatus();
    }
  }, [user]);

  const fetchVipStatus = async () => {
    try {
      setIsLoadingVip(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.getVipStatus(token);
      if (response.success) {
        setVipStatus(response.data);
      }
    } catch (error) {
      console.error('Error fetching VIP status:', error);
    } finally {
      setIsLoadingVip(false);
    }
  };

  // Modern Profile Header Component
  const ModernProfileHeader = () => {
    const isVip0 = !vipStatus?.currentLevel || vipStatus.currentLevel.id === 'vip-0';
    const currentLevel = vipStatus?.currentLevel;
    const nextLevel = vipStatus?.nextLevel;
    const progress = vipStatus?.progress || { progress: 0, remaining: 0 };
    const balance = vipStatus?.balance || user?.balance || 0;

    return (
      <div className="relative mb-6 overflow-hidden">
        {/* Modern Header Card with Gradient Background */}
        <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 rounded-3xl p-6 shadow-2xl">
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-3xl"></div>

          {/* Decorative elements */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/5 rounded-full blur-lg"></div>

          <div className="relative z-10">
            {/* Profile Avatar and Title */}
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-4 shadow-lg border border-white/30">
                <Star className="w-8 h-8 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-white text-2xl font-bold mb-1">
                  {isLoadingVip ? 'Loading...' : 'Thành viên mới'}
                </h1>
                <p className="text-white/80 text-sm">
                  Thành viên mới
                </p>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-white/20">
              <p className="text-white font-medium text-lg">
                welcome: {user?.phoneNumber || '0706871283'}
              </p>
              <p className="text-white/70 text-sm mt-1">ID: ****</p>
            </div>

            {/* Balance Cards with Glassmorphism */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-lg">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mr-2">
                    <TrendingUp className="w-4 h-4 text-green-300" />
                  </div>
                  <p className="text-white/80 text-sm font-medium">Available balance</p>
                </div>
                <p className="text-white text-2xl font-bold">{balance.toFixed(2)}$</p>
              </div>

              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-lg">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-2">
                    <Shield className="w-4 h-4 text-blue-300" />
                  </div>
                  <p className="text-white/80 text-sm font-medium">Freeze Balance</p>
                </div>
                <p className="text-white text-2xl font-bold">{user?.freezeBalance?.toFixed(2) || '0.00'}$</p>
              </div>
            </div>

            {/* Progress Bar for VIP levels */}
            {!isVip0 && nextLevel && (
              <div className="mt-6 bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-white font-medium">Progress to {nextLevel.name}</span>
                  <span className="text-white font-bold">{progress.progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 mb-3">
                  <div
                    className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${progress.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-white/70">
                    Remaining: <span className="font-bold text-white">{progress.remaining.toLocaleString()} USD</span>
                  </p>
                  <div className="flex items-center text-xs text-white/70">
                    <Sparkles className="w-3 h-3 mr-1" />
                    <span>Upgrade VIP</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Withdrawal Screen
  const WithdrawalScreen = () => {
    const [amount, setAmount] = useState('');
    const [selectedBankCard, setSelectedBankCard] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [bankCards, setBankCards] = useState([]);

    // Load bank cards on component mount
    useEffect(() => {
      fetchBankCards();
    }, []);

    const fetchBankCards = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await api.getBankCards(token);
        if (response.success) {
          setBankCards(response.data.bankCards);
        } else {
          // Fallback to mock data if API fails
          setBankCards([
            { id: '1', bankName: 'Vietcombank', cardNumber: '****1234', isDefault: true },
            { id: '2', bankName: 'Techcombank', cardNumber: '****5678', isDefault: false },
            { id: '3', bankName: 'BIDV', cardNumber: '****9012', isDefault: false }
          ]);
        }
      } catch (error) {
        console.error('Error fetching bank cards:', error);
        // Fallback to mock data
        setBankCards([
          { id: '1', bankName: 'Vietcombank', cardNumber: '****1234', isDefault: true },
          { id: '2', bankName: 'Techcombank', cardNumber: '****5678', isDefault: false },
          { id: '3', bankName: 'BIDV', cardNumber: '****9012', isDefault: false }
        ]);
      }
    };

    const handleWithdrawal = async () => {
      if (!amount || parseFloat(amount) <= 0 || isNaN(parseFloat(amount))) {
        toast.error('Please enter a valid amount');
        return;
      }

      if (!selectedBankCard) {
        toast.error('Please select a bank card');
        return;
      }

      const withdrawalAmount = parseFloat(amount);
      const availableBalance = vipStatus?.balance || user?.balance || 0;

      if (withdrawalAmount > availableBalance) {
        toast.error('Insufficient balance to withdraw');
        return;
      }

      setIsProcessing(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please login to withdraw');
          return;
        }

        const response = await api.withdrawal(token, withdrawalAmount, selectedBankCard);
        if (response.success) {
          toast.success('Withdrawal request submitted! Admin will contact you to confirm and transfer.');
          setAmount('');
          setSelectedBankCard('');
          await fetchVipStatus(); // Refresh VIP status
          navigateBack(); // Go back to main screen
        } else {
          toast.error(response.message || 'Failed to submit withdrawal request');
        }
      } catch (error) {
        toast.error(error.message || 'Withdrawal failed');
      } finally {
        setIsProcessing(false);
      }
    };

    const handleContactSupport = () => {
      navigateToScreen('chat');
    };

    const availableBalance = vipStatus?.balance || user?.balance || 0;

    return (
      <div className="bg-gray-50 min-h-screen">
        <ScreenHeader title="Withdrawal" />
        <div className="p-4 space-y-6">
          {/* Available Balance */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Available Balance</span>
              <span className="text-green-600 text-xl font-bold">${availableBalance.toFixed(2)}</span>
            </div>
          </div>

          {/* Withdrawal Amount */}
          <div>
            <Label htmlFor="withdrawal-amount">Withdrawal Amount</Label>
            <Input 
              id="withdrawal-amount" 
              placeholder="Enter amount" 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1"
            />
          </div>
          
          {/* Quick Select Amounts */}
          <div>
            <Label>Quick Select</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {['100', '500', '1000', '2000'].map((quickAmount) => (
                <Button 
                  key={quickAmount} 
                  variant="outline" 
                  className="h-12"
                  onClick={() => setAmount(quickAmount)}
                >
                  ${parseInt(quickAmount).toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          {/* Bank Card Selection */}
          <div>
            <Label htmlFor="bank-card">Bank Card</Label>
            <Select value={selectedBankCard} onValueChange={setSelectedBankCard}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select bank card" />
              </SelectTrigger>
              <SelectContent>
                {bankCards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{card.bankName} {card.cardNumber}</span>
                      {card.isDefault && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Withdrawal Button */}
          <Button 
            className="w-full h-12 text-lg font-medium"
            onClick={handleWithdrawal}
            disabled={isProcessing || !amount || !selectedBankCard}
          >
            {isProcessing ? 'Processing...' : 'Confirm Withdrawal'}
          </Button>

          {/* Customer Support Notice */}
          {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm"></span>
                </div> */}
              {/* </div> */}
              {/* <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800 mb-1">
                  Cần hỗ trợ rút tiền?
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  Liên hệ với bộ phận chăm sóc khách hàng để được hướng dẫn chi tiết về cách rút tiền.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleContactSupport}
                  className="text-blue-600 border-blue-300 hover:bg-blue-100"
                >
                  Liên hệ hỗ trợ
                </Button>
              </div> */}
            {/* </div>
          </div> */}

          {/* Withdrawal Info */}
         
        </div>
      </div>
    );
  };

  // Modern Header with back button
  const ScreenHeader = ({ title }: { title: string }) => (
    <div className="flex items-center p-4 bg-white shadow-sm">
      <button
        onClick={navigateBack}
        className="mr-4 w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-gray-700" />
      </button>
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
    </div>
  );

  // Modern Shipping Address Screen
  const ShippingAddressScreen = () => {
    const [addresses, setAddresses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [addressData, setAddressData] = useState({
      fullName: '',
      phoneNumber: '',
      addressLine1: '',
      city: '',
      postalCode: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    // Load addresses on component mount
    useEffect(() => {
      fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await api.getAddresses(token);
        if (response.success) {
          setAddresses(response.data.addresses);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleCloseForm = () => {
      setIsClosing(true);
      setTimeout(() => {
        setShowAddForm(false);
        setIsClosing(false);
        setAddressData({
          fullName: '',
          phoneNumber: '',
          addressLine1: '',
          city: '',
          postalCode: ''
        });
      }, 500);
    };

    const handleAddAddress = async () => {
      if (!addressData.fullName || !addressData.phoneNumber || !addressData.addressLine1 || !addressData.city || !addressData.postalCode) {
        toast.error('Vui lòng điền đầy đủ thông tin');
        return;
      }

      setIsSaving(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Vui lòng đăng nhập để lưu địa chỉ');
          return;
        }

        const response = await api.addAddress(token, addressData);
        if (response.success) {
          toast.success('Thêm địa chỉ thành công!');
          setAddresses(response.data.addresses);
          handleCloseForm();
        } else {
          toast.error(response.message || 'Thêm địa chỉ thất bại');
        }
      } catch (error) {
        toast.error(error.message || 'Thêm địa chỉ thất bại');
      } finally {
        setIsSaving(false);
      }
    };

    const handleDeleteAddress = async (addressId) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await api.deleteAddress(token, addressId);
        if (response.success) {
          toast.success('Xóa địa chỉ thành công!');
          setAddresses(response.data.addresses);
        } else {
          toast.error(response.message || 'Xóa địa chỉ thất bại');
        }
      } catch (error) {
        toast.error(error.message || 'Xóa địa chỉ thất bại');
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <ScreenHeader title="Shipping Address" />

        <div className="p-4 space-y-4 max-w-sm mx-auto">
          {/* Existing Addresses */}
          {isLoading ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-3 text-gray-600 font-medium text-sm">Loading addresses...</p>
              </div>
            </div>
          ) : addresses.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
                <h2 className="text-lg font-bold text-white mb-1">Saved Addresses</h2>
                <p className="text-blue-100 text-sm">Manage your delivery addresses</p>
              </div>

              <div className="p-4 space-y-3">
                {addresses.map((address, index) => (
                  <div key={address._id || index} className="bg-gray-50 rounded-xl p-3 border border-gray-200 hover:shadow-md transition-all duration-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-blue-600" />
                          </div>
                          <h3 className="font-bold text-gray-900 text-sm">{address.fullName}</h3>
                          {address.isDefault && (
                            <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAddress(address._id)}
                        className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </button>
                    </div>

                    <div className="space-y-1 ml-8">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Phone className="w-3 h-3" />
                        <span className="text-xs">{address.phoneNumber}</span>
                      </div>
                      <div className="flex items-start space-x-2 text-gray-600">
                        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <div className="text-xs">
                          <p>{address.addressLine1}</p>
                          <p>{address.city}, {address.postalCode}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium text-sm">No saved addresses yet</p>
                <p className="text-gray-400 text-xs mt-1">Add your first address below</p>
              </div>
            </div>
          )}

          {/* Add Address Button */}
          {addresses.length < 3 && (
            <button
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2 text-sm active:scale-95"
              onClick={() => setShowAddForm(true)}
              disabled={isLoading}
            >
              <Plus className="w-4 h-4" />
              <span>Add New Address ({addresses.length}/3)</span>
            </button>
          )}

          {/* Modern Mobile-First Bottom Sheet Modal */}
          {showAddForm && (
            <div
              className={`fixed inset-0 bg-black/60 z-50 transition-all duration-300 ease-out ${
                isClosing ? 'opacity-0' : 'opacity-100'
              }`}
              onClick={handleCloseForm}
            >
              {/* Bottom Sheet Container */}
              <div
                className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transform transition-all duration-300 ease-out ${
                  isClosing
                    ? 'translate-y-full opacity-0'
                    : 'translate-y-0 opacity-100'
                } mx-4 sm:mx-auto sm:max-w-lg sm:left-1/2 sm:-translate-x-1/2 sm:bottom-8 sm:rounded-3xl`}
                onClick={(e) => e.stopPropagation()}
                style={{ maxHeight: '90vh' }}
              >
                {/* Drag Handle */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                </div>

                {/* Header with Purple Gradient */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-5 py-5 rounded-t-3xl -mt-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-white text-xl font-bold leading-tight">Add New Address</h2>
                      <p className="text-white/80 text-base mt-1">Fill in your shipping details below</p>
                    </div>
                    <button
                      onClick={handleCloseForm}
                      className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors ml-3 mt-1"
                      aria-label="Close modal"
                    >
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Mobile-Optimized Form */}
                <div className="px-5 py-6 space-y-4 max-h-[50vh] overflow-y-auto">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-800 mb-1">Full Name</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={addressData.fullName}
                        onChange={(e) => setAddressData({...addressData, fullName: e.target.value})}
                        className="flex-1 h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-base placeholder-gray-400"
                        autoCapitalize="words"
                        autoComplete="name"
                      />
                      <div className="w-6 h-6 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-800 mb-1">Phone Number</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="tel"
                        placeholder="Enter your phone number"
                        value={addressData.phoneNumber}
                        onChange={(e) => setAddressData({...addressData, phoneNumber: e.target.value})}
                        className="flex-1 h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-base placeholder-gray-400"
                        inputMode="tel"
                        autoComplete="tel"
                      />
                      <div className="w-6 h-6 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Address Line 1 */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-800 mb-1">Address Line 1</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="text"
                        placeholder="Enter your street address"
                        value={addressData.addressLine1}
                        onChange={(e) => setAddressData({...addressData, addressLine1: e.target.value})}
                        className="flex-1 h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-base placeholder-gray-400"
                        autoComplete="address-line1"
                      />
                      <div className="w-6 h-6 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* City and Postal Code Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-800 mb-1">City</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Enter city"
                          value={addressData.city}
                          onChange={(e) => setAddressData({...addressData, city: e.target.value})}
                          className="flex-1 h-12 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-base placeholder-gray-400"
                          autoComplete="address-level2"
                        />
                        <div className="w-5 h-5 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-800 mb-1">Postal Code</label>
                      <input
                        type="text"
                        placeholder="Enter postal code"
                        value={addressData.postalCode}
                        onChange={(e) => setAddressData({...addressData, postalCode: e.target.value})}
                        className="w-full h-12 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-base placeholder-gray-400"
                        autoComplete="postal-code"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                </div>

                {/* Mobile-First Action Buttons */}
                <div className="px-5 py-6 bg-white border-t border-gray-100 rounded-b-3xl safe-area-bottom">
                  <div className="space-y-3">
                    {/* Cancel Button - Ghost Style */}
                    <button
                      className="w-full h-12 text-gray-600 font-medium text-base hover:text-gray-800 transition-colors duration-200 flex items-center justify-center"
                      onClick={handleCloseForm}
                      type="button"
                    >
                      Cancel
                    </button>

                    {/* Primary Add Address Button */}
                    <button
                      className="w-full h-13 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold text-base rounded-xl hover:from-purple-700 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-98 flex items-center justify-center"
                      onClick={handleAddAddress}
                      disabled={isSaving}
                      type="submit"
                      style={{ minHeight: '52px' }}
                    >
                      {isSaving ? (
                        <div className="flex items-center justify-center space-x-3">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Adding Address...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Add Address</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Top Up Screen
  const TopUpScreen = () => {
    const [amount, setAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [depositRequests, setDepositRequests] = useState([]);

    const fetchDepositRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await api.getDepositRequests(token);
        if (response.success) {
          setDepositRequests(response.data.requests);
        }
      } catch (error) {
        console.error('Error fetching deposit requests:', error);
      }
    };

    useEffect(() => {
      fetchDepositRequests();
    }, []);

    const handleTopUp = async () => {
      if (!amount || parseFloat(amount) <= 0 || isNaN(parseFloat(amount))) {
        toast.error('Please enter a valid amount');
        return;
      }

      setIsProcessing(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please login to request deposit');
          return;
        }

        const usdAmount = parseFloat(amount);
        
        console.log('Frontend - amount input:', amount);
        console.log('Frontend - parsed amount:', usdAmount);
        console.log('Frontend - isNaN:', isNaN(usdAmount));

        const response = await api.deposit(token, usdAmount);
        if (response.success) {
          toast.success('Deposit request submitted successfully! Please wait for admin approval.');
          setAmount('');
          await fetchDepositRequests(); // Refresh deposit requests
        } else {
          toast.error(response.message || 'Failed to submit deposit request');
        }
      } catch (error) {
        toast.error(error.message || 'Failed to submit deposit request');
      } finally {
        setIsProcessing(false);
      }
    };

    const handleContactSupport = () => {
      navigateToScreen('chat');
    };

    return (
      <div className="bg-gray-50 min-h-screen">
        <ScreenHeader title="Top up" />
        <div className="p-4 space-y-6">
          <div>
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input 
              id="amount" 
              placeholder="Enter deposit amount" 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          
          <div>
            <Label>Quick Select</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {['3000', '5000', '10000', '20000'].map((quickAmount) => (
                <Button 
                  key={quickAmount} 
                  variant="outline" 
                  className="h-12"
                  onClick={() => setAmount(quickAmount)}
                >
                  ${parseInt(quickAmount).toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          {/* Customer Support Notice */}
          {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">💬</span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800 mb-1">
                  Need deposit support?
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  Contact customer service for detailed instructions on how to deposit money.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleContactSupport}
                  className="text-blue-600 border-blue-300 hover:bg-blue-100"
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </div> */}

          <Button 
            className="w-full mt-8" 
            onClick={handleTopUp}
            disabled={isProcessing || !amount}
          >
            {isProcessing ? 'Processing...' : 'Submit Deposit Request'}
          </Button>

          {/* Deposit Request Status */}
          {depositRequests.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Deposit Request Status</h3>
              <div className="space-y-3">
                {depositRequests.slice(0, 5).map((request) => (
                  <div key={request._id} className="bg-white border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">${request.amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(request.requestDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        {request.status === 'pending' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                        {request.status === 'approved' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Approved
                          </span>
                        )}
                        {request.status === 'rejected' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Rejected
                          </span>
                        )}
                        {request.rejectionReason && (
                          <p className="text-xs text-red-600 mt-1">{request.rejectionReason}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };


  // Transaction History Screen
  const TransactionHistoryScreen = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [deposits, setDeposits] = useState<any[]>([]);

    useEffect(() => {
      const load = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
          const ordersRes = await api.getOrderHistory(token, { page: 1, limit: 50 });
          if (ordersRes.success) setOrders(ordersRes.data.orders);
          const depRes = await api.getDepositRequests(token);
          if (depRes.success) setDeposits(depRes.data.requests);
        } catch (e) {
          setOrders([]);
          setDeposits([]);
        }
      };
      load();
    }, []);

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'Completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
        case 'Pending': return <Clock className="w-4 h-4 text-yellow-600" />;
        case 'Failed': return <AlertCircle className="w-4 h-4 text-red-600" />;
        default: return null;
      }
    };

    return (
      <div className="bg-gray-50 min-h-screen">
        <ScreenHeader title="Transaction History" />
        <div className="p-4">
          <div className="bg-white rounded-xl overflow-hidden">
            {deposits.length === 0 && orders.length === 0 && (
              <div className="p-8 text-center text-gray-500">No transactions yet</div>
            )}
            {deposits.map((d, index) => (
              <div key={d._id || index}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Deposit</p>
                    <p className="text-sm text-gray-600">{new Date(d.requestDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className={`font-semibold text-green-600`}>+${Number(d.amount).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(d.status === 'approved' ? 'Completed' : d.status === 'pending' ? 'Pending' : 'Failed')}
                  </div>
                </div>
                <div className="border-b border-gray-100" />
              </div>
            ))}
            {orders.map((o, index) => (
              <div key={o._id || index}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Order completed</p>
                    <p className="text-sm text-gray-600">{new Date(o.completedAt || o.orderDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className={`font-semibold text-green-600`}>
                      +${Number(o.commissionAmount).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon('Completed')}
                  </div>
                </div>
                <div className="border-b border-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Bank Card Management Screen
  const BankCardScreen = () => {
    const [bankCards, setBankCards] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [newCard, setNewCard] = useState({ bankName: '', cardNumber: '', accountName: '', isDefault: false });

    const loadCards = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await api.getBankCards(token);
        if (res.success) setBankCards(res.data.bankCards || []);
      } catch (e) {
        toast.error('Failed to load bank cards');
      } finally {
        setIsLoading(false);
      }
    };

    useEffect(() => { loadCards(); }, []);

    const addCard = async () => {
      if (!newCard.bankName || !newCard.cardNumber || !newCard.accountName) {
        toast.error('Please enter all card details');
        return;
        }
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await api.addBankCard(token, newCard);
        if (res.success) {
          toast.success('Card added');
          setShowAdd(false);
          setNewCard({ bankName: '', cardNumber: '', accountName: '', isDefault: false });
          setBankCards(res.data.bankCards);
        }
      } catch (e: any) {
        toast.error(e.message || 'Add card failed');
      }
    };

    const deleteCard = async (id: string) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await api.deleteBankCard(token, id);
        if (res.success) {
          toast.success('Card deleted');
          setBankCards(res.data.bankCards);
        }
      } catch (e: any) {
        toast.error(e.message || 'Delete card failed');
      }
    };

    return (
      <div className="bg-gray-50 min-h-screen">
        <ScreenHeader title="Withdrawal bank card" />
        <div className="p-4 space-y-4">
          <Button className="w-full" variant="outline" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm thẻ mới
          </Button>

          {isLoading ? (
            <div className="text-center py-8 text-gray-600">Đang tải...</div>
          ) : (
            <div className="bg-white rounded-xl overflow-hidden">
              {bankCards.length === 0 && <div className="p-4 text-gray-500">No bank card</div>}
              {bankCards.map((card, index) => (
                <div key={card.id}>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{card.bankName}</p>
                      <p className="text-sm text-gray-600">{card.accountName} •••• {String(card.cardNumber).slice(-4)}</p>
                    </div>
                    <div className="flex gap-2">
                      {card.isDefault && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Default</span>}
                      <Button size="sm" variant="ghost" onClick={() => deleteCard(card.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {index < bankCards.length - 1 && <div className="border-b border-gray-100" />}
                </div>
              ))}
            </div>
          )}

          {showAdd && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
              <div className="bg-white rounded-lg p-4 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-3">Add bank card</h3>
                <div className="space-y-3">
                  <Input placeholder="Bank" value={newCard.bankName} onChange={(e) => setNewCard({ ...newCard, bankName: e.target.value })} />
                  <Input placeholder="Card/Account Number" value={newCard.cardNumber} onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })} />
                  <Input placeholder="Account Name" value={newCard.accountName} onChange={(e) => setNewCard({ ...newCard, accountName: e.target.value })} />
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" checked={newCard.isDefault} onChange={(e) => setNewCard({ ...newCard, isDefault: e.target.checked })} />
                    <span>Đặt làm mặc định</span>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={addCard}>Lưu</Button>
                    <Button className="flex-1" variant="outline" onClick={() => setShowAdd(false)}>Hủy</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Change Password Screen
  const ChangePasswordScreen = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChangePassword = async () => {
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast.error('Vui lòng điền đầy đủ thông tin');
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp');
        return;
      }

      if (newPassword.length < 6) {
        toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
        return;
      }

      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Vui lòng đăng nhập để thay đổi mật khẩu');
          return;
        }

        const response = await api.changePassword(token, currentPassword, newPassword);
        if (response.success) {
          toast.success('Thay đổi mật khẩu thành công!');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          navigateBack();
        } else {
          toast.error(response.message || 'Thay đổi mật khẩu thất bại');
        }
      } catch (error) {
        toast.error(error.message || 'Thay đổi mật khẩu thất bại');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="bg-gray-50 min-h-screen">
        <ScreenHeader title="Change Password" />
        <div className="p-4 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Thay đổi mật khẩu</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Nhập mật khẩu hiện tại"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="new-password">Mật khẩu mới</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button
                className="w-full"
                onClick={handleChangePassword}
                disabled={isLoading}
              >
                {isLoading ? 'Đang xử lý...' : 'Thay đổi mật khẩu'}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={navigateBack}
              >
                Hủy
              </Button>
            </div>
          </div>

          {/* Security Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Mẹo bảo mật:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Sử dụng ít nhất 6 ký tự</li>
              <li>• Kết hợp chữ cái, số và ký tự đặc biệt</li>
              <li>• Không sử dụng thông tin cá nhân</li>
              <li>• Thay đổi mật khẩu định kỳ</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // Security Center Screen
  const SecurityCenterScreen = () => (
    <div className="bg-gray-50 min-h-screen">
      <ScreenHeader title="Security Center" />
      <div className="p-4">
        <div className="bg-white rounded-xl overflow-hidden">
          <button 
            className="w-full p-4 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50"
            onClick={() => navigateToScreen('change-password')}
          >
            <span>Change Password</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          {/* <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <span>2-Factor Authentication</span>
              <Switch />
            </div>
          </div> */}
          {/* <div className="p-4">
            <div className="flex items-center justify-between">
              <span>Manage Trusted Devices</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );

  // Settings Screen
  const SettingsScreen = () => (
    <div className="bg-gray-50 min-h-screen">
      <ScreenHeader title="Settings" />
      <div className="p-4">
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <span>Notification Settings</span>
              <Switch />
            </div>
          </div>
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <span>Language</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          {/* <div className="p-4">
            <div className="flex items-center justify-between">
              <span>Dark Mode</span>
              <Switch />
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );

  // Modern Main Menu Screen
  const MainScreen = () => {
    const menuItems = [
      {
        icon: MapPin,
        label: 'Shipping Address',
        action: () => navigateToScreen('shipping'),
        color: 'from-blue-500 to-blue-600',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600'
      },
      {
        icon: DollarSign,
        label: 'Top up',
        action: () => navigateToScreen('topup'),
        color: 'from-green-500 to-green-600',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600'
      },
      {
        icon: Minus,
        label: 'Withdrawal',
        action: () => navigateToScreen('withdrawal'),
        color: 'from-orange-500 to-orange-600',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600'
      },
      {
        icon: FileText,
        label: 'Deposit and Withdrawal Records',
        action: () => navigateToScreen('history'),
        color: 'from-purple-500 to-purple-600',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600'
      },
      {
        icon: CreditCard,
        label: 'Withdrawal bank card',
        action: () => navigateToScreen('bankcard'),
        color: 'from-indigo-500 to-indigo-600',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600'
      },
      {
        icon: Shield,
        label: 'Security Center',
        action: () => navigateToScreen('security'),
        color: 'from-teal-500 to-teal-600',
        iconBg: 'bg-teal-100',
        iconColor: 'text-teal-600'
      },
      {
        icon: LogOut,
        label: 'Logout',
        action: logout,
        isLogout: true,
        color: 'from-red-500 to-red-600',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600'
      },
    ];

    return (
      <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <ModernProfileHeader />

        {/* Modern Action Menu */}
        <div className="space-y-3">
          {menuItems.map((item, index) => (
            <div
              key={index}
              className="group"
            >
              <button
                onClick={item.action}
                className={`w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:scale-[1.02] transition-all duration-200 ${
                  item.isLogout ? 'hover:bg-red-50 hover:border-red-200' : 'hover:bg-gray-50'
                }`}
                style={{ minHeight: '44px' }} // WCAG AA touch target
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 ${item.iconBg} rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200`}>
                      <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                    </div>
                    <div className="text-left">
                      <span className={`font-medium text-base ${item.isLogout ? 'text-red-600' : 'text-gray-900'}`}>
                        {item.label}
                      </span>
                    </div>
                  </div>
                  {!item.isLogout && (
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200" />
                  )}
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Modern Customer Service Chat Screen
  const ChatScreen = () => {
    const [messages, setMessages] = useState([
      {
        id: 1,
        text: "Hello! Welcome to Ashford Customer Service. How can I help you today?",
        sender: 'support',
        timestamp: '10:30 AM'
      }
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = (smooth = true) => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    };

    // Scroll on mount
    useEffect(() => {
      // small delay to ensure layout is painted
      setTimeout(() => scrollToBottom(false), 0);
    }, []);

    const handleSendMessage = () => {
      if (!newMessage.trim()) return;

      const userMessage = {
        id: messages.length + 1,
        text: newMessage,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      };

      setMessages([...messages, userMessage]);
      setNewMessage('');
      setIsTyping(true);
      // scroll after sending
      setTimeout(() => scrollToBottom(), 0);

      // Simulate support response
      setTimeout(() => {
        const supportMessage = {
          id: messages.length + 2,
          text: "Thank you for your message. Our support team will respond to you shortly. Is there anything specific you need help with?",
          sender: 'support',
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        };
        setMessages(prev => [...prev, supportMessage]);
        setIsTyping(false);
        setTimeout(() => scrollToBottom(), 0);
      }, 2000);
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        {/* Modern Header */}
        <div className="bg-white shadow-lg">
          <div className="flex items-center p-6">
            <button
              onClick={navigateBack}
              className="mr-4 w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>

            <div className="flex items-center flex-1">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mr-4">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

              <div>
                <h1 className="text-xl font-bold text-gray-900">Customer Service</h1>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm text-green-600 font-medium">Online • Typically replies instantly</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {message.sender === 'support' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={`px-4 py-3 rounded-2xl shadow-sm ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-md'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <p className={`text-xs mt-2 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp}
                  </p>
                </div>

                {message.sender === 'user' && (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-end space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white text-gray-800 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modern Input Area */}
        <div className="bg-white border-t border-gray-200 p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-12"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <div className="text-gray-400">💬</div>
              </div>
            </div>

            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <span className="text-lg">➤</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setNewMessage("I need help with my order")}
              className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
            >
              Order Help
            </button>
            <button
              onClick={() => setNewMessage("How do I make a deposit?")}
              className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
            >
              Deposit Help
            </button>
            <button
              onClick={() => setNewMessage("I have a technical issue")}
              className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
            >
              Technical Issue
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Modern Help & Support Screen
  const HelpScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <ScreenHeader title="Help & Support" />

      <div className="p-6 space-y-6">
        {/* Contact Customer Service */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <h2 className="text-xl font-bold text-white mb-2">Customer Service</h2>
            <p className="text-blue-100">Get help from our support team</p>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <p className="text-gray-600 leading-relaxed">
                If you have any questions or need help, please contact our online customer service team.
              </p>
            </div>

            <button
              onClick={() => setCurrentScreen('chat')}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
            >
              <span className="text-lg">💬</span>
              <span>Contact Customer Service</span>
            </button>
          </div>
        </div>

        {/* Contact Methods */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Contact Information</h3>
            <p className="text-gray-500 text-sm mt-1">Multiple ways to reach us</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mr-4">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">24/7 Hotline</p>
                <p className="text-sm text-gray-600">1900-xxxx (Available 24/7)</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-100">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mr-4">
                <span className="text-white text-lg">💬</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Live Chat</p>
                <p className="text-sm text-gray-600">Instant support via chat</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-white text-lg">📧</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Email Support</p>
                <p className="text-sm text-gray-600">support@ashford.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Deposit Guide */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Deposit Guide</h3>
            <p className="text-gray-500 text-sm mt-1">Step-by-step instructions</p>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Choose Amount</p>
                  <p className="text-sm text-gray-600">Select the amount you want to deposit (USD)</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Contact Support</p>
                  <p className="text-sm text-gray-600">Contact customer service for detailed instructions</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Complete Transaction</p>
                  <p className="text-sm text-gray-600">Confirm information and complete the transaction</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Balance Updated</p>
                  <p className="text-sm text-gray-600">Your balance will be updated immediately after successful deposit</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render based on current screen
  switch (currentScreen) {
    case 'shipping': return <ShippingAddressScreen />;
    case 'topup': return <TopUpScreen />;
    case 'withdrawal': return <WithdrawalScreen />;
    case 'history': return <TransactionHistoryScreen />;
    case 'bankcard': return <BankCardScreen />;
    case 'security': return <SecurityCenterScreen />;
    case 'change-password': return <ChangePasswordScreen />;
    case 'settings': return <SettingsScreen />;
    case 'chat': return <ChatScreen />;
    case 'help': return <HelpScreen />;
    default: return <MainScreen />;
  }
}