const VIP_LEVELS = [
  {
    id: 'royal-vip',
    name: 'ROYAL VIP',
    amountRequired: 320000,
    commissionRate: 2.5,
    numberOfOrders: 330,
    gradient: 'from-purple-600 to-pink-600',
    crown: '👑',
    description: 'Thành viên hoàng gia'
  },
  {
    id: 'svip',
    name: 'SVIP',
    amountRequired: 260000,
    commissionRate: 2.0,
    numberOfOrders: 280,
    gradient: 'from-black to-amber-600',
    crown: '👑',
    description: 'Thành viên super'
  },
  {
    id: 'vip-7',
    name: 'VIP 7',
    amountRequired: 200000,
    commissionRate: 1.8,
    numberOfOrders: 250,
    gradient: 'from-amber-600 to-red-600',
    crown: '👑',
    description: 'Thành viên sapphire'
  },
  {
    id: 'vip-6',
    name: 'VIP 6',
    amountRequired: 120000,
    commissionRate: 1.5,
    numberOfOrders: 220,
    gradient: 'from-red-600 to-pink-600',
    crown: '👑',
    description: 'Thành viên emerald'
  },
  {
    id: 'vip-5',
    name: 'VIP 5',
    amountRequired: 80000,
    commissionRate: 1.2,
    numberOfOrders: 180,
    gradient: 'from-blue-600 to-purple-600',
    crown: '👑',
    description: 'Thành viên ruby'
  },
  {
    id: 'vip-4',
    name: 'VIP 4',
    amountRequired: 60000,
    commissionRate: 0.9,
    numberOfOrders: 150,
    gradient: 'from-green-600 to-blue-600',
    crown: '👑',
    description: 'Thành viên bạch kim'
  },
  {
    id: 'vip-3',
    name: 'VIP 3',
    amountRequired: 30000,
    commissionRate: 0.7,
    numberOfOrders: 120,
    gradient: 'from-yellow-600 to-green-600',
    crown: '👑',
    description: 'Thành viên kim cương'
  },
  {
    id: 'vip-2',
    name: 'VIP 2',
    amountRequired: 10000,
    commissionRate: 0.6,
    numberOfOrders: 100,
    gradient: 'from-orange-600 to-yellow-600',
    crown: '👑',
    description: 'Thành viên vàng'
  },
  {
    id: 'vip-1',
    name: 'VIP 1',
    amountRequired: 5000,
    commissionRate: 0.5,
    numberOfOrders: 80,
    gradient: 'from-gray-600 to-orange-600',
    crown: '👑',
    description: 'Thành viên bạc'
  },
  {
    id: 'vip-0',
    name: 'VIP 0',
    amountRequired: 0,
    commissionRate: 0,
    numberOfOrders: 0,
    gradient: 'from-gray-400 to-gray-600',
    crown: '👤',
    description: 'Thành viên mới'
  }
];

// Function to get VIP level based on total amount
const getVipLevelByAmount = (totalAmount) => {
  // Sort by amount required (descending) to find the highest level user qualifies for
  const sortedLevels = [...VIP_LEVELS].sort((a, b) => b.amountRequired - a.amountRequired);
  
  for (const level of sortedLevels) {
    if (totalAmount >= level.amountRequired) {
      return level;
    }
  }
  
  // Return null if no level is found (user hasn't deposited enough for any VIP level)
  return null;
};

// Function to get next VIP level
const getNextVipLevel = (currentLevel) => {
  // Sort levels by amount required (ascending) to find next level
  const sortedLevels = [...VIP_LEVELS].sort((a, b) => a.amountRequired - b.amountRequired);
  const currentIndex = sortedLevels.findIndex(level => level.id === currentLevel.id);
  
  if (currentIndex < sortedLevels.length - 1) {
    return sortedLevels[currentIndex + 1];
  }
  return null; // Already at highest level
};

// Function to calculate progress to next level
const getProgressToNextLevel = (currentLevel, totalAmount) => {
  const nextLevel = getNextVipLevel(currentLevel);
  if (!nextLevel) {
    return { progress: 100, remaining: 0 };
  }
  
  const progress = ((totalAmount - currentLevel.amountRequired) / (nextLevel.amountRequired - currentLevel.amountRequired)) * 100;
  const remaining = nextLevel.amountRequired - totalAmount;
  
  return {
    progress: Math.min(Math.max(progress, 0), 100),
    remaining: Math.max(remaining, 0)
  };
};

module.exports = {
  VIP_LEVELS,
  getVipLevelByAmount,
  getNextVipLevel,
  getProgressToNextLevel
};
