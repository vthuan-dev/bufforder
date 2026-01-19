import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { useTabState } from "../hooks/useTabState";
import { TabNavigation } from "./TabNavigation";
import { BankCardsTab } from "./BankCardsTab";
import { USDTWalletsTab } from "./USDTWalletsTab";

interface WithdrawalMethodsPageProps {
  onBack: () => void;
}

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

function Toast({ message, type, onClose }: ToastState & { onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3 ${
        type === 'success'
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle className="w-5 h-5" />
      ) : (
        <XCircle className="w-5 h-5" />
      )}
      <span className="text-sm font-medium">{message}</span>
    </motion.div>
  );
}

export function WithdrawalMethodsPage({ onBack }: WithdrawalMethodsPageProps) {
  const { t } = useTranslation(['common', 'withdrawalMethods']);
  const { activeTab, switchTab } = useTabState();
  const [toast, setToast] = useState<ToastState | null>(null);

  const handleShowToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-blue-600 text-white px-5 py-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <h1 className="text-lg">{t('withdrawalMethods:title')}</h1>
        </div>
      </div>

      <div className="px-5 py-6 max-w-md mx-auto">
        {/* Tab Navigation */}
        <div className="mb-6">
          <TabNavigation activeTab={activeTab} onTabChange={switchTab} />
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'bank' ? (
            <motion.div
              key="bank"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <BankCardsTab onShowToast={handleShowToast} />
            </motion.div>
          ) : (
            <motion.div
              key="usdt"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <USDTWalletsTab onShowToast={handleShowToast} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
