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
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white/95 backdrop-blur-lg border-t border-gray-200/50 px-4 py-3 z-50 shadow-lg">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={`relative flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              style={{ minHeight: '44px', minWidth: '44px' }} // WCAG AA touch target
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-blue-600 rounded-full"></div>
              )}

              <Icon
                className={`w-6 h-6 transition-all duration-200 ${
                  isActive ? 'fill-blue-600 scale-110' : ''
                }`}
              />
              <span className={`text-xs font-medium transition-all duration-200 ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}