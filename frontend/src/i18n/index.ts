import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from './locales/en/common.json';
import viCommon from './locales/vi/common.json';
import enHome from './locales/en/home.json';
import viHome from './locales/vi/home.json';
import enOrders from './locales/en/orders.json';
import viOrders from './locales/vi/orders.json';
import enMy from './locales/en/my.json';
import viMy from './locales/vi/my.json';
import enAuth from './locales/en/auth.json';
import viAuth from './locales/vi/auth.json';
import enWithdrawal from './locales/en/withdrawal.json';
import viWithdrawal from './locales/vi/withdrawal.json';
import enWithdrawalMethods from './locales/en/withdrawalMethods.json';
import viWithdrawalMethods from './locales/vi/withdrawalMethods.json';
import enRecord from './locales/en/record.json';
import viRecord from './locales/vi/record.json';
import enHelp from './locales/en/help.json';
import viHelp from './locales/vi/help.json';
import enShippingAddress from './locales/en/shippingAddress.json';
import viShippingAddress from './locales/vi/shippingAddress.json';
import enTopUp from './locales/en/topUp.json';
import viTopUp from './locales/vi/topUp.json';
import enTransactionHistory from './locales/en/transactionHistory.json';
import viTransactionHistory from './locales/vi/transactionHistory.json';
import enSecurity from './locales/en/security.json';
import viSecurity from './locales/vi/security.json';

const resources = {
  en: {
    common: enCommon,
    home: enHome,
    orders: enOrders,
    my: enMy,
    auth: enAuth,
    withdrawal: enWithdrawal,
    withdrawalMethods: enWithdrawalMethods,
    record: enRecord,
    help: enHelp,
    shippingAddress: enShippingAddress,
    topUp: enTopUp,
    transactionHistory: enTransactionHistory,
    security: enSecurity,
  },
  vi: {
    common: viCommon,
    home: viHome,
    orders: viOrders,
    my: viMy,
    auth: viAuth,
    withdrawal: viWithdrawal,
    withdrawalMethods: viWithdrawalMethods,
    record: viRecord,
    help: viHelp,
    shippingAddress: viShippingAddress,
    topUp: viTopUp,
    transactionHistory: viTransactionHistory,
    security: viSecurity,
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'home', 'orders', 'my', 'auth', 'withdrawal', 'withdrawalMethods', 'record', 'help', 'shippingAddress', 'topUp', 'transactionHistory', 'security'],
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
