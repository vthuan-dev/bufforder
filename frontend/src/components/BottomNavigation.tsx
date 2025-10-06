import React from 'react';
import { Home, FileText, ShoppingBag, HelpCircle, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const { isAuthenticated } = useAuth();
  
  const allNavItems = [
    { icon: Home, label: 'Home', key: 'home', requiresAuth: false },
    { icon: FileText, label: 'Record', key: 'record', requiresAuth: true },
    { icon: ShoppingBag, label: 'Orders', key: 'orders', requiresAuth: true },
    { icon: HelpCircle, label: 'Help', key: 'help', requiresAuth: false },
    { icon: User, label: 'My', key: 'my', requiresAuth: true }
  ];

  // Filter navigation items based on authentication status
  const navItems = allNavItems.filter(item => 
    !item.requiresAuth || isAuthenticated
  );

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={`flex flex-col items-center space-y-1 py-2 px-3 ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}