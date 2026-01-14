import { Home, FileText, ShoppingBag, HelpCircle, User, Wallet, Gift, Star, Settings, Bell, CreditCard, History, Package, MessageCircle, LucideIcon } from "lucide-react";

// ============================================
// TAB CONFIGURATION - EASY TO CUSTOMIZE
// ============================================
// Thay đổi các tab ở đây để customize cho từng domain/client
// Change tabs here to customize for each domain/client

export interface TabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  enabled: boolean;
}

// Available icons for reference:
// Home, FileText, ShoppingBag, HelpCircle, User, Wallet, Gift, Star, 
// Settings, Bell, CreditCard, History, Package, MessageCircle

// ============================================
// MAIN TAB CONFIGURATION
// ============================================
export const TABS_CONFIG: TabConfig[] = [
  { id: 'home', label: 'Home', icon: Home, enabled: true },
  { id: 'record', label: 'Record', icon: FileText, enabled: true },
  { id: 'orders', label: 'Orders', icon: ShoppingBag, enabled: true },
  { id: 'help', label: 'Help', icon: HelpCircle, enabled: true },
  { id: 'my', label: 'My', icon: User, enabled: true },
];

// ============================================
// ALTERNATIVE CONFIGURATIONS (Examples)
// ============================================

// E-commerce style
export const ECOMMERCE_TABS: TabConfig[] = [
  { id: 'home', label: 'Shop', icon: Home, enabled: true },
  { id: 'orders', label: 'Orders', icon: Package, enabled: true },
  { id: 'wallet', label: 'Wallet', icon: Wallet, enabled: true },
  { id: 'help', label: 'Support', icon: MessageCircle, enabled: true },
  { id: 'my', label: 'Account', icon: User, enabled: true },
];

// Finance/Trading style
export const FINANCE_TABS: TabConfig[] = [
  { id: 'home', label: 'Home', icon: Home, enabled: true },
  { id: 'record', label: 'History', icon: History, enabled: true },
  { id: 'orders', label: 'Trade', icon: CreditCard, enabled: true },
  { id: 'help', label: 'Help', icon: HelpCircle, enabled: true },
  { id: 'my', label: 'Profile', icon: User, enabled: true },
];

// VIP/Rewards style
export const VIP_TABS: TabConfig[] = [
  { id: 'home', label: 'Home', icon: Home, enabled: true },
  { id: 'record', label: 'Record', icon: FileText, enabled: true },
  { id: 'orders', label: 'Orders', icon: ShoppingBag, enabled: true },
  { id: 'rewards', label: 'Rewards', icon: Gift, enabled: true },
  { id: 'my', label: 'VIP', icon: Star, enabled: true },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get only enabled tabs
export const getEnabledTabs = (config: TabConfig[] = TABS_CONFIG): TabConfig[] => {
  return config.filter(tab => tab.enabled);
};

// Get default tab (first enabled tab)
export const getDefaultTab = (config: TabConfig[] = TABS_CONFIG): string => {
  const enabled = getEnabledTabs(config);
  return enabled.length > 0 ? enabled[0].id : 'home';
};

// Check if tab exists
export const isValidTab = (tabId: string, config: TabConfig[] = TABS_CONFIG): boolean => {
  return config.some(tab => tab.id === tabId && tab.enabled);
};
