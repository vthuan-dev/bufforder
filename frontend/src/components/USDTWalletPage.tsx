import React, { useEffect, useState } from "react";
import { ArrowLeft, Wallet, Plus, Trash2, Check, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import api from "../services/api";

interface USDTWallet {
  id: string;
  walletAddress: string;
  walletName: string;
  network: string;
  isDefault: boolean;
}

interface USDTWalletPageProps {
  onBack: () => void;
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3 ${type === 'success'
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

export function USDTWalletPage({ onBack }: USDTWalletPageProps) {
  const [wallets, setWallets] = useState<USDTWallet[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [newWallet, setNewWallet] = useState({
    walletAddress: '',
    walletName: '',
    network: 'TRC20'
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getUsdtWallets();
        setWallets(res?.data?.usdtWallets || []);
      } catch { }
    })();
  }, []);

  const handleAddWallet = async () => {
    if (!newWallet.walletAddress || !newWallet.walletName || !newWallet.network) {
      setToast({ message: 'Please fill in all fields', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.addUsdtWallet({
        walletAddress: newWallet.walletAddress,
        walletName: newWallet.walletName,
        network: newWallet.network,
        isDefault: wallets.length === 0,
      });
      setWallets(res?.data?.usdtWallets || []);
      setNewWallet({ walletAddress: '', walletName: '', network: 'TRC20' });
      setShowAddForm(false);
      setToast({ message: 'Wallet added successfully!', type: 'success' });
    } catch (e: any) {
      setToast({ message: e?.message || 'Failed to add wallet', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this wallet?")) return;
    try {
      const res = await api.deleteUsdtWallet(id);
      setWallets(res?.data?.usdtWallets || []);
      setToast({ message: 'Wallet deleted successfully!', type: 'success' });
    } catch (e: any) {
      setToast({ message: e?.message || 'Failed to delete wallet', type: 'error' });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await api.setDefaultUsdtWallet(id);
      setWallets(res?.data?.usdtWallets || []);
    } catch (e: any) {
      setToast({ message: e?.message || 'Failed to set default', type: 'error' });
    }
  };

  const maskAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-56">
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
          <h1 className="text-lg">USDT Wallets</h1>
        </div>
      </div>

      <div className="px-5 py-6 max-w-md mx-auto">
        {/* Add Wallet Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-200 mb-5 flex items-center justify-center gap-2 text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm">Add New Wallet</span>
        </motion.button>

        {/* Add Wallet Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 mb-5 overflow-hidden"
            >
              <h3 className="text-gray-800 mb-5 text-base">New USDT Wallet</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Wallet Name</label>
                  <input
                    type="text"
                    value={newWallet.walletName}
                    onChange={(e) => setNewWallet({ ...newWallet, walletName: e.target.value })}
                    placeholder="e.g. My Main Wallet"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Network{newWallet.network && `: ${newWallet.network}`}
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      {['TRC20', 'ERC20', 'BEP20', 'Polygon'].map((network) => (
                        newWallet.network === network ? null : (
                          <button
                            key={network}
                            onClick={() => setNewWallet({ ...newWallet, network })}
                            className="flex-1 px-3 py-2 rounded-full text-xs font-semibold transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
                          >
                            {network}
                          </button>
                        )
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {['Arbitrum', 'Optimism', 'Avalanche', 'Solana'].map((network) => (
                        newWallet.network === network ? null : (
                          <button
                            key={network}
                            onClick={() => setNewWallet({ ...newWallet, network })}
                            className="flex-1 px-3 py-2 rounded-full text-xs font-semibold transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
                          >
                            {network}
                          </button>
                        )
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Wallet Address</label>
                  <input
                    type="text"
                    value={newWallet.walletAddress}
                    onChange={(e) => setNewWallet({ ...newWallet, walletAddress: e.target.value.trim() })}
                    placeholder={
                      newWallet.network === 'TRC20' ? 'T...' :
                      newWallet.network === 'Solana' ? 'Base58...' :
                      '0x...'
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {newWallet.network === 'TRC20' && 'Tron address (starts with T, 34 chars)'}
                    {newWallet.network === 'ERC20' && 'Ethereum address (starts with 0x, 42 chars)'}
                    {newWallet.network === 'BEP20' && 'BSC address (starts with 0x, 42 chars)'}
                    {newWallet.network === 'Polygon' && 'Polygon address (starts with 0x, 42 chars)'}
                    {newWallet.network === 'Arbitrum' && 'Arbitrum address (starts with 0x, 42 chars)'}
                    {newWallet.network === 'Optimism' && 'Optimism address (starts with 0x, 42 chars)'}
                    {newWallet.network === 'Avalanche' && 'Avalanche C-Chain address (starts with 0x, 42 chars)'}
                    {newWallet.network === 'Solana' && 'Solana address (Base58, 32-44 chars)'}
                  </p>
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
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.95 }}
                  onClick={handleAddWallet}
                  disabled={isLoading}
                  className="flex-1 py-3.5 bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 !text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin !text-white" />
                      <span className="!text-white font-semibold">Adding...</span>
                    </>
                  ) : (
                    <span className="!text-white font-semibold">Add Wallet</span>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wallet List */}
        <div className="space-y-4">
          {wallets.map((wallet, index) => (
            <motion.div
              key={wallet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full -mr-24 -mt-24" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-white rounded-full -ml-18 -mb-18" />
              </div>

              <div className="relative z-10">
                {/* Wallet Name & Network */}
                <div className="flex items-start justify-between mb-10">
                  <div>
                    <p className="text-sm opacity-90 mb-3">{wallet.walletName}</p>
                    <p className="text-lg font-mono tracking-wide">{maskAddress(wallet.walletAddress)}</p>
                  </div>
                  <Wallet className="w-10 h-10 opacity-80" strokeWidth={1.5} />
                </div>

                {/* Network & Actions */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs opacity-75 mb-1">Network</p>
                    <p className="text-sm font-medium">{wallet.network}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {wallet.isDefault ? (
                      <span className="bg-white/25 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                        Default
                      </span>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSetDefault(wallet.id)}
                        className="bg-white/20 backdrop-blur-sm hover:bg-white/30 px-3 py-1.5 rounded-full text-xs transition-colors"
                      >
                        Set Default
                      </motion.button>
                    )}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(wallet.id)}
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
        {wallets.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-1">No USDT wallet yet</p>
            <p className="text-sm text-gray-400">Add your USDT wallet for withdrawal</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
