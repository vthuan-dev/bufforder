import { useEffect, useState } from "react";
import { ArrowLeft, DollarSign, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import api from "../services/api";

interface WithdrawalPageProps {
  onBack: () => void;
  onNavigateToBankCards?: () => void;
}

export function WithdrawalPage({ onBack, onNavigateToBankCards }: WithdrawalPageProps) {
  const { t } = useTranslation(['common', 'withdrawal']);
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [availableBalance, setAvailableBalance] = useState(0);
  const [actualAvailableBalance, setActualAvailableBalance] = useState(0); // Balance minus pending withdrawals
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [dailyTasks, setDailyTasks] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [lastWithdrawalTime, setLastWithdrawalTime] = useState<Date | null>(null);
  const [bankCards, setBankCards] = useState<{ id: string; bankName: string; cardNumber: string; accountName: string; isDefault?: boolean; }[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>("");

  // Crypto withdrawal states
  const [withdrawalType, setWithdrawalType] = useState<'bank' | 'crypto'>('crypto');
  const [usdtWallets, setUsdtWallets] = useState<{ id: string; walletName: string; walletAddress: string; network: string; isDefault?: boolean; }[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>("");
  const [network, setNetwork] = useState<string>("TRC20");

  useEffect(() => {
    (async () => {
      try {
        const profile = await api.profile();
        const user = profile?.data?.user;
        if (user) setAvailableBalance(Number(user.balance || 0));
      } catch { }
      // Load order stats for daily completion requirement
      try {
        const stats = await api.userOrderStats();
        if (stats?.success) {
          setDailyTasks(Number(stats.data?.totalDailyTasks || 0));
          setCompletedToday(Number(stats.data?.completedToday || 0));
        }
      } catch { }
      try {
        const cards = await api.getBankCards();
        const list = cards?.data?.bankCards || [];
        setBankCards(list);
        const def = list.find((c: any) => c.isDefault) || list[0];
        setSelectedCardId(def?.id || "");
        // Don't show prompt on initial load - only show when user tries to submit
      } catch { }
      // Fetch USDT wallets
      try {
        const wallets = await api.getUsdtWallets();
        const list = wallets?.data?.usdtWallets || [];
        setUsdtWallets(list);
        const defWallet = list.find((w: any) => w.isDefault) || list[0];
        if (defWallet) {
          setSelectedWalletId(defWallet.id);
          setNetwork(defWallet.network);
        }
      } catch { }
      try {
        const list = await api.getWithdrawalRequests();
        const all = (list?.data?.requests || []);
        const items = all.filter((w: any) => (w.status === 'pending'));
        setPendingWithdrawals(items);
        
        // Calculate actual available balance (balance - pending withdrawals)
        const totalPending = items.reduce((sum: number, w: any) => sum + Number(w.amount || 0), 0);
        const actualBalance = Math.max(0, availableBalance - totalPending);
        setActualAvailableBalance(actualBalance);
        
        // Find last withdrawal time (most recent pending or approved)
        const recentWithdrawals = all.filter((w: any) => 
          w.status === 'pending' || w.status === 'approved'
        );
        if (recentWithdrawals.length > 0) {
          // Sort by date descending
          recentWithdrawals.sort((a: any, b: any) => {
            const dateA = new Date(a.requestDate || a.createdAt || 0);
            const dateB = new Date(b.requestDate || b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
          });
          const lastDate = recentWithdrawals[0].requestDate || recentWithdrawals[0].createdAt;
          if (lastDate) {
            setLastWithdrawalTime(new Date(lastDate));
          }
        }
      } catch { }
    })();
  }, []);

  const handleWithdrawal = async () => {
    // Guard: daily tasks must be completed
    if (completedToday < dailyTasks) {
      toast.error(t('withdrawal:warnings.completeTasks', { completed: completedToday, total: dailyTasks }));
      return;
    }
    
    // Guard: 5-minute cooldown between withdrawals
    if (lastWithdrawalTime) {
      const now = new Date();
      const timeDiff = now.getTime() - lastWithdrawalTime.getTime();
      const minutesPassed = Math.floor(timeDiff / 1000 / 60);
      const cooldownMinutes = 5;
      
      if (minutesPassed < cooldownMinutes) {
        const remainingMinutes = cooldownMinutes - minutesPassed;
        toast.warning(t('withdrawal:warnings.cooldown', { minutes: remainingMinutes }), {
          duration: 5000,
        });
        return;
      }
    }
    
    const withdrawAmount = parseFloat(amount);

    if (!amount || withdrawAmount <= 0) {
      toast.error(t('withdrawal:toasts.enterAmount'));
      return;
    }

    // Check against actual available balance (minus pending withdrawals)
    if (withdrawAmount > actualAvailableBalance) {
      toast.error(t('withdrawal:toasts.insufficientBalanceWithPending', { 
        available: actualAvailableBalance.toFixed(2),
        pending: (availableBalance - actualAvailableBalance).toFixed(2)
      }));
      return;
    }

    if (!password) {
      toast.error(t('withdrawal:toasts.enterPassword'));
      return;
    }

    // Validate based on withdrawal type
    if (withdrawalType === 'crypto') {
      if (!selectedWalletId) {
        toast.error(t('withdrawal:toasts.selectWallet'));
        return;
      }
    } else {
      if (!selectedCardId) {
        toast.error(t('withdrawal:toasts.selectCard'));
        return;
      }
    }

    try {
      const payload: any = {
        amount: withdrawAmount,
        password,
        withdrawalType
      };

      if (withdrawalType === 'crypto') {
        const selectedWallet = usdtWallets.find(w => w.id === selectedWalletId);
        if (selectedWallet) {
          payload.walletAddress = selectedWallet.walletAddress;
          payload.network = selectedWallet.network;
        }
      } else {
        payload.bankCardId = selectedCardId;
      }

      const res = await api.withdrawal(payload);
      if (res?.success) {
        toast.success(t('withdrawal:toasts.success'), {
          duration: 5000,
          description: t('withdrawal:toasts.successNote'),
        });
        setAmount("");
        setPassword("");
        setHasWithdrawToday(true);
        // refresh pending list to reflect new request
        try {
          const list = await api.getWithdrawalRequests();
          const items = (list?.data?.requests || []).filter((w: any) => w.status === 'pending');
          setPendingWithdrawals(items);
        } catch { }
      }
    } catch (e: any) {
      toast.error(e?.message || t('withdrawal:toasts.error'));
    }
  };

  const handleWithdrawAll = () => {
    setAmount(actualAvailableBalance.toString());
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-56">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <h1>{t('withdrawal:title')}</h1>
        </div>
      </div>

      <div className="p-6">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl p-6 text-white mb-6 shadow-lg"
        >
          <p className="text-sm opacity-90 mb-2">{t('withdrawal:availableBalance')}</p>
          <p className="text-3xl">${availableBalance.toFixed(2)}</p>
          {actualAvailableBalance < availableBalance && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <p className="text-xs opacity-75">{t('withdrawal:actualAvailable')}</p>
              <p className="text-xl font-semibold">${actualAvailableBalance.toFixed(2)}</p>
              <p className="text-xs opacity-75 mt-1">
                {t('withdrawal:pendingAmount')}: ${(availableBalance - actualAvailableBalance).toFixed(2)}
              </p>
            </div>
          )}
        </motion.div>

        {/* Withdrawal Form */}
        <div className="bg-white rounded-2xl p-5 shadow-md mb-4">
          {/* Eligibility notice */}
          {completedToday < dailyTasks && (
            <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>
                {t('withdrawal:warnings.completeTasks', { completed: completedToday, total: dailyTasks })}
              </span>
            </div>
          )}

          {/* Withdrawal Type Toggle */}
          <div className="flex mb-4 bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setWithdrawalType('crypto')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${withdrawalType === 'crypto'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {t('withdrawal:withdrawalType.usdtWallet')}
            </button>
            <button
              type="button"
              onClick={() => setWithdrawalType('bank')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${withdrawalType === 'bank'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {t('withdrawal:withdrawalType.bankCard')}
            </button>
          </div>

          {/* Bank Card Selection (shown when type is bank) */}
          {withdrawalType === 'bank' && (
            <>
              <label className="block text-sm text-gray-600 mb-2">{t('withdrawal:selectBankCard')}</label>
              {bankCards.length > 0 ? (
                <select
                  value={selectedCardId}
                  onChange={(e) => setSelectedCardId(e.target.value)}
                  className="w-full mb-4 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>{t('withdrawal:placeholders.chooseCard')}</option>
                  {bankCards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.bankName} - {c.cardNumber} ({c.accountName})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-sm text-yellow-800 mb-2">{t('withdrawal:warnings.noBankCard')}</p>
                  <button
                    onClick={() => onNavigateToBankCards?.()}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {t('withdrawal:actions.goToWithdrawalMethods')}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Crypto Wallet Inputs (shown when type is crypto) */}
          {withdrawalType === 'crypto' && (
            <>
              <label className="block text-sm text-gray-600 mb-2">{t('withdrawal:selectUsdtWallet')}</label>
              {usdtWallets.length > 0 ? (
                <select
                  value={selectedWalletId}
                  onChange={(e) => {
                    setSelectedWalletId(e.target.value);
                    const wallet = usdtWallets.find(w => w.id === e.target.value);
                    if (wallet) setNetwork(wallet.network);
                  }}
                  className="w-full mb-4 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {usdtWallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.walletName} ({wallet.network}) - {wallet.walletAddress.slice(0, 6)}...{wallet.walletAddress.slice(-4)}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-sm text-yellow-800 mb-2">{t('withdrawal:warnings.noUsdtWallet')}</p>
                  <button
                    onClick={() => onNavigateToBankCards?.()}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {t('withdrawal:actions.goToWithdrawalMethods')}
                  </button>
                </div>
              )}
            </>
          )}

          <label className="block text-sm text-gray-600 mb-2">{t('withdrawal:withdrawalAmount')}</label>
          <div className="relative mb-3">
            <DollarSign className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${amount && parseFloat(amount) > availableBalance ? 'text-red-400' : 'text-gray-400'
              }`} />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t('withdrawal:placeholders.amount')}
              className={`w-full pl-12 pr-24 py-4 bg-gray-50 border rounded-xl text-xl focus:outline-none focus:ring-2 ${amount && parseFloat(amount) > availableBalance
                ? 'border-red-400 focus:ring-red-500 text-red-600'
                : 'border-gray-200 focus:ring-blue-500'
                }`}
            />
            <button
              onClick={handleWithdrawAll}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-700 px-3 py-1 bg-blue-50 rounded-lg"
            >
              {t('withdrawal:actions.withdrawAll')}
            </button>
          </div>

          {/* Insufficient Balance Warning */}
          {amount && parseFloat(amount) > availableBalance && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-600">
                {t('withdrawal:warnings.insufficientBalance', { amount: (parseFloat(amount) - availableBalance).toFixed(2) })}
              </span>
            </div>
          )}



          <label className="block text-sm text-gray-600 mb-3">{t('withdrawal:paymentPassword')}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('withdrawal:placeholders.password')}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Info Box */}
        {/* <div className="bg-yellow-50 rounded-2xl p-4 mb-6 flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-700">
            <p className="mb-2">Important Notice:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Processing time: 1-24 hours</li>
              <li>Please ensure your bank card information is correct</li>
              <li>Service fee: 2% of withdrawal amount</li>
              <li>Daily withdrawal limit: 3 times</li>
            </ul>
          </div>
        </div> */}

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleWithdrawal}
          className={`w-full py-4 rounded-xl shadow-lg transition-all ${completedToday < dailyTasks ||
            hasWithdrawToday ||
            !amount ||
            parseFloat(amount) <= 0 ||
            parseFloat(amount) > availableBalance ||
            !password.trim() ||
            (withdrawalType === 'crypto' && !selectedWalletId) ||
            (withdrawalType === 'bank' && !selectedCardId)
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          disabled={
            completedToday < dailyTasks ||
            hasWithdrawToday ||
            !amount ||
            parseFloat(amount) <= 0 ||
            parseFloat(amount) > availableBalance ||
            !password.trim() ||
            (withdrawalType === 'crypto' && !selectedWalletId) ||
            (withdrawalType === 'bank' && !selectedCardId)
          }
        >
          {t('withdrawal:actions.submitWithdrawal')}
        </motion.button>
      </div>
      {/* Pending list */}
      {pendingWithdrawals.length > 0 && (
        <div className="px-6">
          <h3 className="text-sm text-gray-700 mb-2">{t('withdrawal:pending.title')}</h3>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2">
            {pendingWithdrawals.map((w: any) => (
              <div key={w._id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">${w.amount.toFixed(2)}</span>
                <span className="text-orange-600">{t('topUp:pending.status')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
