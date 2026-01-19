import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    setShowMenu(false);
  };

  const currentLanguage = i18n.language === 'vi' ? 'VI' : 'EN';

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 transition-all active:scale-95"
      >
        <Globe className="w-5 h-5" />
        <span className="text-sm font-medium">{currentLanguage}</span>
      </motion.button>

      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50"
            >
              <button
                onClick={() => changeLanguage('en')}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                  i18n.language === 'en' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                <span className="text-sm font-medium">{t('language.english')}</span>
                {i18n.language === 'en' && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                )}
              </button>
              <button
                onClick={() => changeLanguage('vi')}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                  i18n.language === 'vi' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                <span className="text-sm font-medium">{t('language.vietnamese')}</span>
                {i18n.language === 'vi' && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
