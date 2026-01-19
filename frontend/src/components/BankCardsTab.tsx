import React, { useState, useEffect, useRef } from "react";
import { CreditCard, Plus, Trash2, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { useBankCards, BankCardInput } from "../hooks/useBankCards";
import { internationalBanks } from "../data/banks";

interface BankCardsTabProps {
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export function BankCardsTab({ onShowToast }: BankCardsTabProps) {
  const { t } = useTranslation(['common', 'withdrawalMethods']);
  const { cards, isLoading, addCard, deleteCard, setDefault } = useBankCards();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCard, setNewCard] = useState({
    bankName: '',
    cardNumber: '',
    holderName: ''
  });
  const [filteredBanks, setFilteredBanks] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBankNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewCard({ ...newCard, bankName: value });

    if (value.trim()) {
      const filtered = internationalBanks.filter(bank =>
        bank.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredBanks(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectBank = (bankName: string) => {
    setNewCard({ ...newCard, bankName });
    setShowSuggestions(false);
  };

  const handleAddCard = async () => {
    if (!newCard.bankName || !newCard.cardNumber || !newCard.holderName) {
      onShowToast(t('withdrawalMethods:bankCards.toasts.fillAllFields'), 'error');
      return;
    }

    const result = await addCard({
      bankName: newCard.bankName,
      cardNumber: newCard.cardNumber,
      accountName: newCard.holderName,
    });

    if (result.success) {
      setNewCard({ bankName: '', cardNumber: '', holderName: '' });
      setShowAddForm(false);
      onShowToast(t('withdrawalMethods:bankCards.toasts.addSuccess'), 'success');
    } else {
      onShowToast(result.error || t('withdrawalMethods:bankCards.toasts.addError'), 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('withdrawalMethods:bankCards.toasts.deleteConfirm'))) return;

    const result = await deleteCard(id);
    if (result.success) {
      onShowToast(t('withdrawalMethods:bankCards.toasts.deleteSuccess'), 'success');
    } else {
      onShowToast(result.error || t('withdrawalMethods:bankCards.toasts.deleteError'), 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Card Button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowAddForm(!showAddForm)}
        className="w-full bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-200 flex items-center justify-center gap-2 text-blue-600 hover:bg-blue-50 transition-colors"
      >
        <Plus className="w-5 h-5" />
        <span className="text-sm">{t('withdrawalMethods:bankCards.addNew')}</span>
      </motion.button>

      {/* Add Card Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 overflow-hidden"
          >
            <h3 className="text-gray-800 mb-5 text-base">{t('withdrawalMethods:bankCards.form.title')}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">{t('withdrawalMethods:bankCards.form.bankName')}</label>
                <div className="relative" ref={suggestionRef}>
                  <input
                    type="text"
                    value={newCard.bankName}
                    onChange={handleBankNameChange}
                    onFocus={() => {
                      if (newCard.bankName) setShowSuggestions(true);
                    }}
                    placeholder={t('withdrawalMethods:bankCards.form.placeholders.bankName')}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />

                  <AnimatePresence>
                    {showSuggestions && filteredBanks.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                      >
                        {filteredBanks.map((bank, index) => (
                          <button
                            key={index}
                            onClick={() => handleSelectBank(bank)}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                          >
                            {bank}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">{t('withdrawalMethods:bankCards.form.cardNumber')}</label>
                <input
                  type="text"
                  value={newCard.cardNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setNewCard({ ...newCard, cardNumber: value });
                  }}
                  placeholder={t('withdrawalMethods:bankCards.form.placeholders.cardNumber')}
                  maxLength={19}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">{t('withdrawalMethods:bankCards.form.accountName')}</label>
                <input
                  type="text"
                  value={newCard.holderName}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z\s]/g, '').toUpperCase();
                    setNewCard({ ...newCard, holderName: value });
                  }}
                  placeholder={t('withdrawalMethods:bankCards.form.placeholders.accountName')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddForm(false)}
                disabled={isLoading}
                className="px-8 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {t('common:buttons.cancel')}
              </motion.button>
              <motion.button
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.95 }}
                onClick={handleAddCard}
                disabled={isLoading}
                className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('common:messages.loading')}</span>
                  </>
                ) : (
                  t('common:buttons.add')
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card List */}
      <div className="space-y-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full -mr-24 -mt-24" />
              <div className="absolute bottom-0 left-0 w-36 h-36 bg-white rounded-full -ml-18 -mb-18" />
            </div>

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-10">
                <div>
                  <p className="text-sm opacity-90 mb-3">{card.bankName}</p>
                  <p className="text-xl font-mono tracking-widest">{card.cardNumber}</p>
                </div>
                <CreditCard className="w-10 h-10 opacity-80" strokeWidth={1.5} />
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs opacity-75 mb-1">{t('withdrawalMethods:bankCards.form.accountName')}</p>
                  <p className="text-sm">{card.holderName}</p>
                </div>

                <div className="flex items-center gap-2">
                  {card.isDefault ? (
                    <span className="bg-white/25 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                      {t('withdrawalMethods:usdtWallets.actions.default')}
                    </span>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDefault(card.id)}
                      className="bg-white/20 backdrop-blur-sm hover:bg-white/30 px-3 py-1.5 rounded-full text-xs transition-colors"
                    >
                      {t('withdrawalMethods:bankCards.actions.setDefault')}
                    </motion.button>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(card.id)}
                    className="bg-red-500 hover:bg-red-600 p-2 rounded-full transition-colors shadow-md"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={2} />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {cards.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-600 mb-1">{t('withdrawalMethods:bankCards.noBankCard')}</p>
          <p className="text-sm text-gray-400">{t('withdrawalMethods:bankCards.addBankCardDesc')}</p>
        </motion.div>
      )}
    </div>
  );
}
