import { Home, FileText, ShoppingBag, HelpCircle, User, Wallet, Gift, Star, Settings, Bell, CreditCard, History, Package, MessageCircle, LucideIcon } from "lucide-react";

// ============================================
// TAB CONFIGURATION - EASY TO CUSTOMIZE
// ============================================
// Thay đổi các tab ở đây để customize cho từng domain/client
// Change tabs here to customize for each domain/client

export interface TabConfig {
  id: string;
  labelKey: string; // Translation key instead of hardcoded label
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
  { id: 'home', labelKey: 'common:nav.home', icon: Home, enabled: true },
  { id: 'record', labelKey: 'common:nav.record', icon: FileText, enabled: true },
  { id: 'orders', labelKey: 'common:nav.orders', icon: ShoppingBag, enabled: true },
  { id: 'help', labelKey: 'common:nav.help', icon: HelpCircle, enabled: true },
  { id: 'my', labelKey: 'common:nav.my', icon: User, enabled: true },
];

// ============================================
// ALTERNATIVE CONFIGURATIONS (Examples)
// ============================================

// E-commerce style
export const ECOMMERCE_TABS: TabConfig[] = [
  { id: 'home', labelKey: 'common:nav.home', icon: Home, enabled: true },
  { id: 'orders', labelKey: 'common:nav.orders', icon: Package, enabled: true },
  { id: 'wallet', labelKey: 'common:nav.wallet', icon: Wallet, enabled: true },
  { id: 'help', labelKey: 'common:nav.help', icon: MessageCircle, enabled: true },
  { id: 'my', labelKey: 'common:nav.my', icon: User, enabled: true },
];

// Finance/Trading style
export const FINANCE_TABS: TabConfig[] = [
  { id: 'home', labelKey: 'common:nav.home', icon: Home, enabled: true },
  { id: 'record', labelKey: 'common:nav.record', icon: History, enabled: true },
  { id: 'orders', labelKey: 'common:nav.orders', icon: CreditCard, enabled: true },
  { id: 'help', labelKey: 'common:nav.help', icon: HelpCircle, enabled: true },
  { id: 'my', labelKey: 'common:nav.my', icon: User, enabled: true },
];

// VIP/Rewards style
export const VIP_TABS: TabConfig[] = [
  { id: 'home', labelKey: 'common:nav.home', icon: Home, enabled: true },
  { id: 'record', labelKey: 'common:nav.record', icon: FileText, enabled: true },
  { id: 'orders', labelKey: 'common:nav.orders', icon: ShoppingBag, enabled: true },
  { id: 'rewards', labelKey: 'common:nav.rewards', icon: Gift, enabled: true },
  { id: 'my', labelKey: 'common:nav.my', icon: Star, enabled: true },
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
