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
  Sparkles
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

  // Main VIP Status Component
  const VIPStatusCard = () => {
    const isVip0 = !vipStatus?.currentLevel || vipStatus.currentLevel.id === 'vip-0';
    const currentLevel = vipStatus?.currentLevel;
    const nextLevel = vipStatus?.nextLevel;
    const progress = vipStatus?.progress || { progress: 0, remaining: 0 };
    const totalDeposited = vipStatus?.totalDeposited || 0;
    const balance = vipStatus?.balance || user?.balance || 0;

    // Get VIP level colors and icons
    const getVipLevelStyle = (levelId) => {
      const styles = {
        'royal-vip': { gradient: 'from-purple-600 to-pink-600', icon: Crown, name: 'ROYAL VIP' },
        'svip': { gradient: 'from-black to-amber-600', icon: Crown, name: 'SVIP' },
        'vip-7': { gradient: 'from-amber-600 to-red-600', icon: Crown, name: 'VIP 7' },
        'vip-6': { gradient: 'from-red-600 to-pink-600', icon: Crown, name: 'VIP 6' },
        'vip-5': { gradient: 'from-blue-600 to-purple-600', icon: Crown, name: 'VIP 5' },
        'vip-4': { gradient: 'from-green-600 to-blue-600', icon: Crown, name: 'VIP 4' },
        'vip-3': { gradient: 'from-yellow-600 to-green-600', icon: Crown, name: 'VIP 3' },
        'vip-2': { gradient: 'from-orange-600 to-yellow-600', icon: Crown, name: 'VIP 2' },
        'vip-1': { gradient: 'from-gray-600 to-orange-600', icon: Crown, name: 'VIP 1' },
        'vip-0': { gradient: 'from-gray-400 to-gray-600', icon: Star, name: 'Thành viên mới' }
      };
      return styles[levelId] || styles['vip-0'];
    };

    const currentStyle = getVipLevelStyle(currentLevel?.id || 'vip-0');
    const CurrentIcon = currentStyle.icon;

    return (
      <div className="relative mb-6 rounded-2xl overflow-hidden">
        {/* Main VIP Card */}
        <div 
          className={`bg-gradient-to-br ${currentStyle.gradient} p-6 rounded-2xl shadow-xl border-2 border-white/30 relative overflow-hidden`}
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 20%, rgba(255,255,255,0.2) 2px, transparent 2px),
              radial-gradient(circle at 80% 80%, rgba(255,255,255,0.15) 1px, transparent 1px),
              radial-gradient(circle at 40% 60%, rgba(255,255,255,0.1) 1.5px, transparent 1.5px)
            `,
            backgroundSize: '30px 30px, 25px 25px, 35px 35px'
          }}
        >
          {/* Decorative border elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-white/40 to-transparent"></div>
          <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-white/40 to-transparent"></div>
          <div className="flex items-center mb-4 bg-yellow-100 backdrop-blur-sm rounded-xl p-4 border-2 border-yellow-200">
            <div className="bg-yellow-200 rounded-full p-3 mr-4 shadow-lg">
              <CurrentIcon className="w-5 h-5 text-amber-700 fill-amber-700" />
            </div>
            <div>
              <span className="text-amber-900 text-2xl font-bold">
                {isLoadingVip ? 'Loading...' : currentStyle.name}
              </span>
              <p className="text-amber-700 text-sm mt-1">
                {isVip0 ? 'Thành viên mới' : 'Thành viên VIP'}
              </p>
            </div>
          </div>

          <div className="mb-3 bg-yellow-50 backdrop-blur-sm rounded-lg p-3 border-2 border-yellow-200">
            <p className="text-amber-800 font-medium">welcome: {user?.phoneNumber || '13212578386'}</p>
            <p className="text-amber-700 text-sm mt-1">ID: ****</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-yellow-50 backdrop-blur-sm rounded-lg p-3 border-2 border-yellow-200">
              <p className="text-amber-700 text-xs font-medium mb-1">Available balance</p>
              <p className="text-amber-900 text-lg font-bold">{balance.toFixed(2)}$</p>
            </div>
            <div className="bg-yellow-50 backdrop-blur-sm rounded-lg p-3 border-2 border-yellow-200">
              <p className="text-amber-700 text-xs font-medium mb-1">Freeze Balance</p>
              <p className="text-amber-900 text-lg font-bold">{user?.freezeBalance?.toFixed(2) || '0.00'}$</p>
            </div>
          </div>

          {/* Progress Bar */}
          {!isVip0 && nextLevel && (
            <div className="mt-4 bg-yellow-50 backdrop-blur-sm rounded-xl p-4 border-2 border-yellow-200">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-amber-800 font-medium">Tiến độ lên {nextLevel.name}</span>
                <span className="text-amber-900 font-bold">{progress.progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-yellow-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${progress.progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-amber-700">
                  Còn thiếu: <span className="font-bold text-amber-900">{progress.remaining.toLocaleString()} USD</span>
                </p>
                <div className="flex items-center text-xs text-amber-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>Nâng cấp VIP</span>
                </div>
              </div>
            </div>
          )}
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
        toast.error('Vui lòng nhập số tiền hợp lệ');
        return;
      }

      if (!selectedBankCard) {
        toast.error('Vui lòng chọn thẻ ngân hàng');
        return;
      }

      const withdrawalAmount = parseFloat(amount);
      const availableBalance = vipStatus?.balance || user?.balance || 0;

      if (withdrawalAmount > availableBalance) {
        toast.error('Số dư không đủ để rút tiền');
        return;
      }

      setIsProcessing(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Vui lòng đăng nhập để rút tiền');
          return;
        }

        const response = await api.withdrawal(token, withdrawalAmount, selectedBankCard);
        if (response.success) {
          toast.success('Yêu cầu rút tiền đã được gửi! Admin sẽ liên hệ với bạn để xác nhận và chuyển tiền.');
          setAmount('');
          setSelectedBankCard('');
          await fetchVipStatus(); // Refresh VIP status
          navigateBack(); // Go back to main screen
        } else {
          toast.error(response.message || 'Gửi yêu cầu rút tiền thất bại');
        }
      } catch (error) {
        toast.error(error.message || 'Rút tiền thất bại');
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">💬</span>
                </div>
              </div>
              <div className="ml-3 flex-1">
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
              </div>
            </div>
          </div>

          {/* Withdrawal Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm">ℹ️</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 mb-1">
                  Thông tin rút tiền
                </h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Tạo yêu cầu rút tiền, admin sẽ liên hệ xác nhận</li>
                  <li>• Phí rút tiền: 2% (tối thiểu $5)</li>
                  <li>• Số tiền tối thiểu: $50</li>
                  <li>• Số tiền tối đa: $10,000/ngày</li>
                  <li>• Thời gian xử lý: 1-3 ngày làm việc sau khi xác nhận</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Header with back button
  const ScreenHeader = ({ title }: { title: string }) => (
    <div className="flex items-center p-4 border-b border-gray-100 bg-white">
      <Button variant="ghost" size="sm" onClick={navigateBack} className="mr-4">
        <ArrowLeft className="w-4 h-4" />
      </Button>
      <h1 className="text-lg font-medium">{title}</h1>
    </div>
  );

  // Shipping Address Screen
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
      postalCode: '',
      isDefault: false
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
          postalCode: '',
          isDefault: false
        });
      }, 300);
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
      <div className="bg-gray-50 min-h-screen">
        <ScreenHeader title="Shipping Address" />
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Address List */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : addresses.length > 0 ? (
            <div className="space-y-3 max-w-sm mx-auto">
              {addresses.map((address, index) => (
                <div key={address._id || index} className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 pr-2">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{address.fullName}</h3>
                      {address.isDefault && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteAddress(address._id)}
                      className="text-red-500 hover:text-red-700 p-2 flex-shrink-0 touch-manipulation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1 break-all">{address.phoneNumber}</p>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1 break-words">{address.addressLine1}</p>
                  <p className="text-xs sm:text-sm text-gray-600 break-words">{address.city}, {address.postalCode}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No addresses yet</p>
            </div>
          )}

          {/* Add Address Button */}
          {addresses.length < 3 && (
            <div className="max-w-sm mx-auto">
              <Button 
                className="w-full h-10 sm:h-11 text-sm sm:text-base touch-manipulation" 
                onClick={() => setShowAddForm(true)}
                disabled={isLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add new address ({addresses.length}/3)
              </Button>
            </div>
          )}

          {/* Add Address Form Modal */}
          {showAddForm && (
            <div 
              className={`fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 transition-all duration-300 ${isClosing ? 'animate-out fade-out' : 'animate-in fade-in'}`}
              onClick={handleCloseForm}
            >
              <div 
                className={`bg-white rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md max-h-[95vh] overflow-y-auto mx-2 sm:mx-0 transition-all duration-300 ${isClosing ? 'animate-out zoom-out-95 slide-out-to-bottom-2' : 'animate-in zoom-in-95 slide-in-from-bottom-2'}`}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-4">Add new address</h3>
                
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                    <Input 
                      id="fullName" 
                      placeholder="Enter your full name" 
                      value={addressData.fullName}
                      onChange={(e) => setAddressData({...addressData, fullName: e.target.value})}
                      className="mt-1 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                    <Input 
                      id="phone" 
                      placeholder="Enter your phone number" 
                      value={addressData.phoneNumber}
                      onChange={(e) => setAddressData({...addressData, phoneNumber: e.target.value})}
                      className="mt-1 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address" className="text-sm font-medium">Address Line 1</Label>
                    <Input 
                      id="address" 
                      placeholder="Enter your address" 
                      value={addressData.addressLine1}
                      onChange={(e) => setAddressData({...addressData, addressLine1: e.target.value})}
                      className="mt-1 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city" className="text-sm font-medium">City</Label>
                    <Input 
                      id="city" 
                      placeholder="Enter your city" 
                      value={addressData.city}
                      onChange={(e) => setAddressData({...addressData, city: e.target.value})}
                      className="mt-1 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal" className="text-sm font-medium">Postal Code</Label>
                    <Input 
                      id="postal" 
                      placeholder="Enter postal code" 
                      value={addressData.postalCode}
                      onChange={(e) => setAddressData({...addressData, postalCode: e.target.value})}
                      className="mt-1 text-base"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={addressData.isDefault}
                      onChange={(e) => setAddressData({...addressData, isDefault: e.target.checked})}
                      className="rounded w-4 h-4"
                    />
                    <Label htmlFor="isDefault" className="text-sm">Set as default</Label>
                  </div>
                </div>

                <div className="flex space-x-2 sm:space-x-3 mt-4 sm:mt-6">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-10 sm:h-11 text-sm sm:text-base touch-manipulation" 
                    onClick={handleCloseForm}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 h-10 sm:h-11 text-sm sm:text-base touch-manipulation" 
                    onClick={handleAddAddress}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Add address'}
                  </Button>
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
          </div>

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
              {bankCards.length === 0 && <div className="p-4 text-gray-500">Chưa có thẻ</div>}
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
                <h3 className="text-lg font-semibold mb-3">Thêm thẻ ngân hàng</h3>
                <div className="space-y-3">
                  <Input placeholder="Ngân hàng" value={newCard.bankName} onChange={(e) => setNewCard({ ...newCard, bankName: e.target.value })} />
                  <Input placeholder="Số thẻ/TK" value={newCard.cardNumber} onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })} />
                  <Input placeholder="Tên chủ tài khoản" value={newCard.accountName} onChange={(e) => setNewCard({ ...newCard, accountName: e.target.value })} />
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

  // Main Menu Screen
  const MainScreen = () => {
    const menuItems = [
      { icon: MapPin, label: 'Shipping Address', action: () => navigateToScreen('shipping') },
      { icon: DollarSign, label: 'Top up', action: () => navigateToScreen('topup') },
      { icon: Minus, label: 'Withdrawal', action: () => navigateToScreen('withdrawal') },
      { icon: FileText, label: 'Deposit and Withdrawal Records', action: () => navigateToScreen('history') },
      { icon: CreditCard, label: 'Withdrawal bank card', action: () => navigateToScreen('bankcard') },
      { icon: Shield, label: 'Security Center', action: () => navigateToScreen('security') },
      // { icon: Settings, label: 'Set up', action: () => navigateToScreen('settings') },
      { icon: LogOut, label: 'Đăng xuất', action: logout, isLogout: true },
    ];

    return (
      <div className="p-4 bg-gray-50 min-h-screen">
        <VIPStatusCard />
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          {menuItems.map((item, index) => (
            <div key={index}>
              <button
                onClick={item.action}
                className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                  item.isLogout ? 'text-red-600 hover:bg-red-50' : ''
                }`}
              >
                <div className="flex items-center">
                  <item.icon className={`w-5 h-5 mr-4 ${item.isLogout ? 'text-red-600' : 'text-gray-600'}`} />
                  <span className={item.isLogout ? 'text-red-600' : 'text-gray-800'}>{item.label}</span>
                </div>
                {!item.isLogout && <ChevronRight className="w-5 h-5 text-gray-400" />}
              </button>
              {index < menuItems.length - 1 && (
                <div className="border-b border-gray-100 ml-13" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Chat Screen
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
      <div className="bg-gray-50 min-h-screen flex flex-col">
        <div className="flex items-center p-4 border-b border-gray-100 bg-white">
          <Button variant="ghost" size="sm" onClick={navigateBack} className="mr-4">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-blue-600 text-sm">👤</span>
            </div>
            <div>
              <h1 className="text-lg font-medium">Live Support</h1>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-green-600">Online</span>
              </div>
            </div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="px-4"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Help Screen
  const HelpScreen = () => (
    <div className="bg-gray-50 min-h-screen">
      <ScreenHeader title="Help & Support" />
      <div className="p-4 space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Chăm sóc khách hàng</h2>
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-2xl mr-3">📞</span>
              <div>
                <p className="font-medium">Hotline hỗ trợ</p>
                <p className="text-sm text-gray-600">1900-xxxx (24/7)</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-2xl mr-3">💬</span>
              <div>
                <p className="font-medium">Chat trực tuyến</p>
                <p className="text-sm text-gray-600">Hỗ trợ trực tiếp qua chat</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-2xl mr-3">📧</span>
              <div>
                <p className="font-medium">Email hỗ trợ</p>
                <p className="text-sm text-gray-600">support@ashford.com</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Hướng dẫn nạp tiền</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <p>• Chọn số tiền muốn nạp (USD)</p>
            <p>• Liên hệ CSKH để được hướng dẫn chi tiết</p>
            <p>• Xác nhận thông tin và hoàn tất giao dịch</p>
            <p>• Số dư sẽ được cập nhật ngay sau khi nạp thành công</p>
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