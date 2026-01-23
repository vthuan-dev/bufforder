const VIP_LEVELS = [
  {
    id: 'royal-vip',
    name: 'VIP Hoàng Gia',
    amountRequired: 320000,
    commissionRate: 0.025, // 2.5% - Thực nhận: 2.25% sau khi khấu trừ 10%
    dailyTarget: 1320,
    numberOfOrders: 330,
    gradient: 'from-purple-600 to-pink-600',
    crown: '👑',
    description: 'Royal member'
  },
  {
    id: 'svip',
    name: 'SVIP (Siêu cấp)',
    amountRequired: 260000,
    commissionRate: 0.02, // 2.0% - Thực nhận: 1.80%
    dailyTarget: 1120,
    numberOfOrders: 280,
    gradient: 'from-black to-amber-600',
    crown: '👑',
    description: 'Super member'
  },
  {
    id: 'vip-7',
    name: 'VIP 7 (Sapphire)',
    amountRequired: 200000,
    commissionRate: 0.018, // 1.8% - Thực nhận: 1.62%
    dailyTarget: 1000,
    numberOfOrders: 250,
    gradient: 'from-amber-600 to-red-600',
    crown: '👑',
    description: 'Sapphire member'
  },
  {
    id: 'vip-6',
    name: 'VIP 6 (Emerald)',
    amountRequired: 120000,
    commissionRate: 0.015, // 1.5% - Thực nhận: 1.35%
    dailyTarget: 880,
    numberOfOrders: 220,
    gradient: 'from-red-600 to-pink-600',
    crown: '👑',
    description: 'Emerald member'
  },
  {
    id: 'vip-5',
    name: 'VIP 5 (Ruby)',
    amountRequired: 80000,
    commissionRate: 0.012, // 1.2% - Thực nhận: 1.08%
    dailyTarget: 720,
    numberOfOrders: 180,
    gradient: 'from-blue-600 to-purple-600',
    crown: '👑',
    description: 'Ruby member'
  },
  {
    id: 'vip-4',
    name: 'VIP 4 (Kim cương)',
    amountRequired: 60000,
    commissionRate: 0.009, // 0.9% - Thực nhận: 0.81%
    dailyTarget: 600,
    numberOfOrders: 150,
    gradient: 'from-green-600 to-blue-600',
    crown: '👑',
    description: 'Diamond member'
  },
  {
    id: 'vip-3',
    name: 'VIP 3 (Kim cương)',
    amountRequired: 30000,
    commissionRate: 0.007, // 0.7% - Thực nhận: 0.63%
    dailyTarget: 480,
    numberOfOrders: 120,
    gradient: 'from-yellow-600 to-green-600',
    crown: '👑',
    description: 'Diamond member'
  },
  {
    id: 'vip-2',
    name: 'VIP 2 (Vàng)',
    amountRequired: 10000,
    commissionRate: 0.006, // 0.6% - Thực nhận: 0.54%
    dailyTarget: 400,
    numberOfOrders: 100,
    gradient: 'from-orange-600 to-yellow-600',
    crown: '👑',
    description: 'Gold member'
  },
  {
    id: 'vip-1',
    name: 'VIP 1 (Bạc)',
    amountRequired: 5000,
    commissionRate: 0.005, // 0.5% - Thực nhận: 0.45%
    dailyTarget: 270,
    numberOfOrders: 60,
    gradient: 'from-gray-600 to-orange-600',
    crown: '👑',
    description: 'Silver member'
  },
  {
    id: 'vip-0',
    name: 'VIP 0',
    amountRequired: 0,
    commissionRate: 0,
    dailyTarget: 0,
    numberOfOrders: 0,
    gradient: 'from-gray-400 to-gray-600',
    crown: '👤',
    description: 'New member'
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
