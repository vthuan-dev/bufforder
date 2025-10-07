import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const membershipTiers = [
  {
    id: 'royal-vip',
    name: 'ROYAL VIP',
    amountRequired: 320000,
    commissionRate: 2.5,
    numberOfOrders: 330,
    gradient: 'from-purple-600 to-pink-600',
    crown: '👑',
    description: 'Royal member'
  },
  {
    id: 'svip',
    name: 'SVIP',
    amountRequired: 260000,
    commissionRate: 2.0,
    numberOfOrders: 280,
    gradient: 'from-black to-amber-600',
    crown: '👑',
    description: 'Super member'
  },
  {
    id: 'vip-7',
    name: 'VIP 7',
    amountRequired: 200000,
    commissionRate: 1.8,
    numberOfOrders: 250,
    gradient: 'from-amber-600 to-red-600',
    crown: '👑',
    description: 'Sapphire member'
  },
  {
    id: 'vip-6',
    name: 'VIP 6',
    amountRequired: 120000,
    commissionRate: 1.5,
    numberOfOrders: 220,
    gradient: 'from-red-600 to-pink-600',
    crown: '👑',
    description: 'Emerald member'
  },
  {
    id: 'vip-5',
    name: 'VIP 5',
    amountRequired: 80000,
    commissionRate: 1.2,
    numberOfOrders: 180,
    gradient: 'from-blue-600 to-purple-600',
    crown: '👑',
    description: 'Ruby member'
  },
  {
    id: 'vip-4',
    name: 'VIP 4',
    amountRequired: 60000,
    commissionRate: 0.9,
    numberOfOrders: 150,
    gradient: 'from-green-600 to-blue-600',
    crown: '👑',
    description: 'Platinum member'
  },
  {
    id: 'vip-3',
    name: 'VIP 3',
    amountRequired: 30000,
    commissionRate: 0.7,
    numberOfOrders: 120,
    gradient: 'from-yellow-600 to-green-600',
    crown: '👑',
    description: 'Diamond member'
  },
  {
    id: 'vip-2',
    name: 'VIP 2',
    amountRequired: 10000,
    commissionRate: 0.6,
    numberOfOrders: 100,
    gradient: 'from-orange-600 to-yellow-600',
    crown: '👑',
    description: 'Gold member'
  },
  {
    id: 'vip-1',
    name: 'VIP 1',
    amountRequired: 5000,
    commissionRate: 0.5,
    numberOfOrders: 80,
    gradient: 'from-gray-600 to-orange-600',
    crown: '👑',
    description: 'Silver member'
  },
  {
    id: 'vip-0',
    name: 'VIP 0',
    amountRequired: 0,
    commissionRate: 0,
    numberOfOrders: 0,
    gradient: 'from-gray-400 to-gray-600',
    crown: '👤',
    description: 'New member'
  }
];

interface VipStatus {
  currentLevel: any;
  nextLevel: any;
  progress: {
    progress: number;
    remaining: number;
  };
  totalDeposited: number;
  balance: number;
}

interface MembershipLevelsProps {
  onNavigateToMy: () => void;
}

export function MembershipLevels({ onNavigateToMy }: MembershipLevelsProps) {
  const { user, isAuthenticated } = useAuth();
  const [vipStatus, setVipStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch VIP status when component mounts
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchVipStatus();
    }
  }, [isAuthenticated, user]);

  const fetchVipStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.getVipStatus(token);
      if (response.success) {
        setVipStatus(response.data);
      }
    } catch (error) {
      console.error('Error fetching VIP status:', error);
    }
  };


  const getCurrentUserLevel = () => {
    if (!vipStatus) return null;
    return membershipTiers.find(tier => tier.id === vipStatus.currentLevel.id);
  };

  const isCurrentLevel = (tierId: string) => {
    return vipStatus?.currentLevel?.id === tierId;
  };

  const isUnlocked = (tier: any) => {
    if (!vipStatus) return false; // Chưa nạp tiền thì không unlock VIP nào
    return vipStatus.totalDeposited >= tier.amountRequired;
  };

  return (
    <div className="px-4 pb-20">
      <h2 className="text-center text-2xl mb-6 text-gray-800">MEMBERSHIP LEVEL</h2>
      
      {/* Current VIP Status */}
      {isAuthenticated && vipStatus && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {vipStatus.currentLevel ? (
                <>
                  <span className="text-2xl">{getCurrentUserLevel()?.crown}</span>
                  <div>
                    <h3 className="text-lg font-bold">{vipStatus.currentLevel.name}</h3>
                    <p className="text-sm opacity-90">{getCurrentUserLevel()?.description}</p>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-2xl">👤</span>
                  <div>
                    <h3 className="text-lg font-bold">No VIP yet</h3>
                    <p className="text-sm opacity-90">Deposit to start your VIP journey</p>
                  </div>
                </>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm">Balance: ${vipStatus.balance.toLocaleString()}</p>
              <p className="text-sm">Deposited: ${vipStatus.totalDeposited.toLocaleString()}</p>
            </div>
          </div>
          
          {/* Progress to next level */}
          {(vipStatus.nextLevel || !vipStatus.currentLevel) && (
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span>
                  {vipStatus.currentLevel 
                    ? `Progress to ${vipStatus.nextLevel.name}` 
                    : 'Progress to VIP 1'
                  }
                </span>
                <span>{vipStatus.progress.progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${vipStatus.progress.progress}%` }}
                ></div>
              </div>
              <p className="text-xs mt-1">
                Remaining: ${vipStatus.progress.remaining.toLocaleString()}
              </p>
            </div>
            
          )}
        </div>
      )}


      {/* VIP Levels List */}
      <div className="space-y-3">
        {membershipTiers.map((tier) => {
          const unlocked = isUnlocked(tier);
          const isCurrent = isCurrentLevel(tier.id);
          
          // Hide VIP 0 completely
          if (tier.id === 'vip-0') {
            return null;
          }
          
          return (
            <div 
              key={tier.id}
              className={`bg-gradient-to-r ${tier.gradient} rounded-lg p-4 text-white shadow-lg relative ${
                !unlocked ? 'opacity-60' : ''
              } ${isCurrent ? 'ring-4 ring-yellow-400 ring-opacity-50' : ''} ${
                tier.id === 'vip-0' ? 'border-2 border-yellow-300 shadow-yellow-200/20' : ''
              }`}
            >
              {/* Current Level Badge */}
              {isCurrent && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold">
                  CURRENT
                </div>
              )}
              
              {/* Lock Icon for locked levels */}
              {!unlocked && (
                <div className="absolute top-2 right-2 text-white text-opacity-50">
                  🔒
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xl ${tier.id === 'vip-0' ? 'animate-pulse text-yellow-300' : ''}`}>
                    {tier.crown}
                  </span>
                  <div>
                    <h3 className={`text-lg ${tier.id === 'vip-0' ? 'text-yellow-200' : ''}`}>
                      {tier.name}
                    </h3>
                    <p className="text-xs opacity-80">{tier.description}</p>
                  </div>
                </div>
                <button 
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    unlocked 
                      ? 'bg-white bg-opacity-20 hover:bg-opacity-30 text-gray-800 font-medium' 
                      : 'bg-gray-500 bg-opacity-50 text-gray-300 cursor-not-allowed'
                  }`}
                  disabled={!unlocked}
                  onClick={() => {
                    if (unlocked) {
                      onNavigateToMy();
                    }
                  }}
                >
                  {unlocked ? 'Upgrade VIP →' : 'Locked'}
                </button>
              </div>
              
              <div className="space-y-1 text-sm">
                {tier.id !== 'vip-0' && (
                  <>
                    <p>Amount Required: ${tier.amountRequired.toLocaleString()}</p>
                    <p>Commission per order: {tier.commissionRate}%</p>
                    <p>Number of orders: {tier.numberOfOrders}</p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}