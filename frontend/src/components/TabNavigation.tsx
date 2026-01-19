import { motion } from "motion/react";
import { CreditCard, Wallet } from "lucide-react";
import { TabType } from "../hooks/useTabState";

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { id: 'bank' as TabType, label: 'Bank Cards', icon: CreditCard },
    { id: 'usdt' as TabType, label: 'USDT Wallets', icon: Wallet },
  ];

  return (
    <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-transparent text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
