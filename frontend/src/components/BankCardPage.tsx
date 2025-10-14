import React, { useEffect, useState } from "react";
import { ArrowLeft, CreditCard, Plus, Trash2, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import api from "../services/api";

interface BankCard {
  id: string;
  bankName: string;
  cardNumber: string;
  holderName: string;
  isDefault: boolean;
}

interface BankCardPageProps {
  onBack: () => void;
}

export function BankCardPage({ onBack }: BankCardPageProps) {
  const [cards, setCards] = useState<BankCard[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCard, setNewCard] = useState({
    bankName: '',
    cardNumber: '',
    holderName: ''
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getBankCards();
        const list = (res?.data?.bankCards || []).map((c: any) => ({
          id: c.id,
          bankName: c.bankName,
          cardNumber: `**** **** **** ${String(c.cardNumber).slice(-4)}`,
          holderName: c.accountName,
          isDefault: !!c.isDefault,
        }));
        setCards(list);
      } catch {}
    })();
  }, []);

  const handleAddCard = async () => {
    if (!newCard.bankName || !newCard.cardNumber || !newCard.holderName) {
      alert("Please fill in all fields");
      return;
    }
    try {
      await api.addBankCard({
        bankName: newCard.bankName,
        cardNumber: newCard.cardNumber,
        accountName: newCard.holderName,
        isDefault: cards.length === 0,
      });
      const res = await api.getBankCards();
      const list = (res?.data?.bankCards || []).map((c: any) => ({
          id: c.id,
          bankName: c.bankName,
          cardNumber: `**** **** **** ${String(c.cardNumber).slice(-4)}`,
          holderName: c.accountName,
          isDefault: !!c.isDefault,
      }));
      setCards(list);
      setNewCard({ bankName: '', cardNumber: '', holderName: '' });
      setShowAddForm(false);
    } catch (e: any) {
      alert(e?.message || 'Failed to add card');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this card?")) return;
    try {
      await api.deleteBankCard(id);
      setCards(cards.filter(card => card.id !== id));
    } catch (e: any) {
      alert(e?.message || 'Failed to delete card');
    }
  };

  const handleSetDefault = (id: string) => {
    setCards(cards.map(card => ({
      ...card,
      isDefault: card.id === id
    })));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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
          <h1 className="text-lg">Bank Cards</h1>
        </div>
      </div>

      <div className="px-5 py-6 max-w-md mx-auto">
        {/* Add Card Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-200 mb-5 flex items-center justify-center gap-2 text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm">Add New Card</span>
        </motion.button>

        {/* Add Card Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 mb-5 overflow-hidden"
            >
              <h3 className="text-gray-800 mb-5 text-base">New Bank Card</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Bank Name</label>
                  <input
                    type="text"
                    value={newCard.bankName}
                    onChange={(e) => setNewCard({ ...newCard, bankName: e.target.value })}
                    placeholder="e.g. Chase Bank"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Card Number</label>
                  <input
                    type="text"
                    value={newCard.cardNumber}
                    onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Card Holder Name</label>
                  <input
                    type="text"
                    value={newCard.holderName}
                    onChange={(e) => setNewCard({ ...newCard, holderName: e.target.value })}
                    placeholder="Name on card"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddForm(false)}
                  className="px-8 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddCard}
                  className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Add Card
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
              {/* Card Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full -mr-24 -mt-24" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-white rounded-full -ml-18 -mb-18" />
              </div>

              <div className="relative z-10">
                {/* Bank Name & Icon */}
                <div className="flex items-start justify-between mb-10">
                  <div>
                    <p className="text-sm opacity-90 mb-3">{card.bankName}</p>
                    <p className="text-xl font-mono tracking-widest">{card.cardNumber}</p>
                  </div>
                  <CreditCard className="w-10 h-10 opacity-80" strokeWidth={1.5} />
                </div>

                {/* Card Holder & Actions */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs opacity-75 mb-1">Card Holder</p>
                    <p className="text-sm">{card.holderName}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {card.isDefault ? (
                      <span className="bg-white/25 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                        Default
                      </span>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSetDefault(card.id)}
                        className="bg-white/20 backdrop-blur-sm hover:bg-white/30 px-3 py-1.5 rounded-full text-xs transition-colors"
                      >
                        Set Default
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
            <p className="text-gray-600 mb-1">No bank card yet</p>
            <p className="text-sm text-gray-400">Add your bank card for withdrawal</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
