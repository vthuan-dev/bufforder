import { useEffect, useState } from "react";
import { ArrowLeft, DollarSign, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import api from "../services/api";

interface WithdrawalPageProps {
  onBack: () => void;
  onNavigateToBankCards?: () => void;
}

export function WithdrawalPage({ onBack, onNavigateToBankCards }: WithdrawalPageProps) {
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [availableBalance, setAvailableBalance] = useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [dailyTasks, setDailyTasks] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [hasWithdrawToday, setHasWithdrawToday] = useState(false);
  const [bankCards, setBankCards] = useState<{ id: string; bankName: string; cardNumber: string; accountName: string; isDefault?: boolean; }[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [showNoBankCardPrompt, setShowNoBankCardPrompt] = useState(false);

  // Crypto withdrawal states
  const [withdrawalType, setWithdrawalType] = useState<'bank' | 'crypto'>('crypto');
  const [walletAddress, setWalletAddress] = useState("");
  const [network, setNetwork] = useState<string>("TRC20");

  // Exchange rate for USD to VND
  const [exchangeRate, setExchangeRate] = useState<number>(25000); // Default rate

  useEffect(() => {
    (async () => {
      try {
        const profile = await api.profile();
        const user = profile?.data?.user;
        if (user) setAvailableBalance(Number(user.balance || 0));
      } catch { }

      // Fetch USD/VND exchange rate from free API
      try {
        const rateRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const rateData = await rateRes.json();
        if (rateData?.rates?.VND) {
          setExchangeRate(rateData.rates.VND);
        }
      } catch {
        setExchangeRate(25000); // Fallback rate
      }
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
        // Show prompt if no bank cards
        if (list.length === 0) {
          setShowNoBankCardPrompt(true);
        }
      } catch { }
      try {
        const list = await api.getWithdrawalRequests();
        const all = (list?.data?.requests || []);
        const items = all.filter((w: any) => (w.status === 'pending'));
        setPendingWithdrawals(items);
        // Determine if user already withdrew today (pending or approved today)
        const isSameDay = (d: any) => {
          const dt = new Date(d);
          const now = new Date();
          return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth() && dt.getDate() === now.getDate();
        };
        const withdrew = all.some((w: any) => {
          const date = w.requestDate || w.createdAt || w.updatedAt;
          const today = date && isSameDay(date);
          const processed = String(w.status).toLowerCase() === 'approved' || String(w.status).toLowerCase() === 'pending';
          return processed && today;
        });
        setHasWithdrawToday(withdrew);
      } catch { }
    })();
  }, []);

  const handleWithdrawal = async () => {
    // Guard: daily tasks must be completed
    if (completedToday < dailyTasks) {
      toast.error(`Please complete today's tasks (${completedToday}/${dailyTasks} orders) before withdrawing.`);
      return;
    }
    // Guard: only one withdrawal per day
    if (hasWithdrawToday) {
      toast.warning('You have already withdrawn today. Only 1 withdrawal per day is allowed.', {
        duration: 5000,
      });
      return;
    }
    const withdrawAmount = parseFloat(amount);

    if (!amount || withdrawAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (withdrawAmount > availableBalance) {
      toast.error("Insufficient balance");
      return;
    }

    if (!password) {
      toast.error("Please enter your payment password");
      return;
    }

    // Validate based on withdrawal type
    if (withdrawalType === 'crypto') {
      if (!walletAddress.trim()) {
        toast.error("Please enter your USDT wallet address");
        return;
      }
      if (!network) {
        toast.error("Please select a network");
        return;
      }
    } else {
      if (!selectedCardId) {
        toast.error("Please select a bank card");
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
        payload.walletAddress = walletAddress.trim();
        payload.network = network;
      } else {
        payload.bankCardId = selectedCardId;
      }

      const res = await api.withdrawal(payload);
      if (res?.success) {
        toast.success("Withdrawal request submitted! Please wait for admin approval.", {
          duration: 5000,
          description: "Note: Only 1 withdrawal per day is allowed.",
        });
        setAmount("");
        setPassword("");
        setWalletAddress("");
        setHasWithdrawToday(true);
        // refresh pending list to reflect new request
        try {
          const list = await api.getWithdrawalRequests();
          const items = (list?.data?.requests || []).filter((w: any) => w.status === 'pending');
          setPendingWithdrawals(items);
        } catch { }
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit withdrawal request");
    }
  };

  const handleWithdrawAll = () => {
    setAmount(availableBalance.toString());
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* No Bank Card Prompt Modal */}
      {showNoBankCardPrompt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg text-gray-900">No Bank Card Found</h3>
            </div>
            <p className="text-gray-600 mb-6">
              You need to add a bank card before you can request a withdrawal. Please add your bank card first.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNoBankCardPrompt(false);
                  onBack();
                }}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowNoBankCardPrompt(false);
                  if (onNavigateToBankCards) {
                    onNavigateToBankCards();
                  } else {
                    onBack();
                  }
                }}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              >
                Add Bank Card
              </button>
            </div>
          </motion.div>
        </div>
      )}

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
          <h1>Withdrawal</h1>
        </div>
      </div>

      <div className="p-6">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl p-6 text-white mb-6 shadow-lg"
        >
          <p className="text-sm opacity-90 mb-2">Available Balance</p>
          <p className="text-3xl">${availableBalance.toFixed(2)}</p>
        </motion.div>

        {/* Withdrawal Form */}
        <div className="bg-white rounded-2xl p-5 shadow-md mb-4">
          {/* Eligibility notice */}
          {completedToday < dailyTasks && (
            <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>
                Please complete all tasks for today ({completedToday}/{dailyTasks} orders) before withdrawing.
              </span>
            </div>
          )}
          {hasWithdrawToday && (
            <div className="mb-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
              You have already submitted a withdrawal request today. Only 1 withdrawal per day is allowed.
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
              USDT Wallet
            </button>
            <button
              type="button"
              onClick={() => setWithdrawalType('bank')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${withdrawalType === 'bank'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Bank Card
            </button>
          </div>

          {/* Bank Card Selection (shown when type is bank) */}
          {withdrawalType === 'bank' && (
            <>
              <label className="block text-sm text-gray-600 mb-2">Select Bank Card</label>
              <select
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(e.target.value)}
                className="w-full mb-4 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>
                  {bankCards.length ? 'Choose a card' : 'No bank card found, add in My > Withdrawal bank card'}
                </option>
                {bankCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.bankName} - {c.cardNumber} ({c.accountName})
                  </option>
                ))}
              </select>
            </>
          )}

          {/* Crypto Wallet Inputs (shown when type is crypto) */}
          {withdrawalType === 'crypto' && (
            <>
              <label className="block text-sm text-gray-600 mb-2">USDT Wallet Address</label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter your USDT wallet address..."
                className="w-full mb-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <label className="block text-sm text-gray-600 mb-2">Network</label>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full mb-4 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TRC20">TRC20 (Tron) - Low fee</option>
                <option value="ERC20">ERC20 (Ethereum)</option>
                <option value="BEP20">BEP20 (BSC)</option>
              </select>
            </>
          )}

          <label className="block text-sm text-gray-600 mb-2">Withdrawal Amount</label>
          <div className="relative mb-3">
            <DollarSign className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${amount && parseFloat(amount) > availableBalance ? 'text-red-400' : 'text-gray-400'
              }`} />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`w-full pl-12 pr-24 py-4 bg-gray-50 border rounded-xl text-xl focus:outline-none focus:ring-2 ${amount && parseFloat(amount) > availableBalance
                ? 'border-red-400 focus:ring-red-500 text-red-600'
                : 'border-gray-200 focus:ring-blue-500'
                }`}
            />
            <button
              onClick={handleWithdrawAll}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-700 px-3 py-1 bg-blue-50 rounded-lg"
            >
              All
            </button>
          </div>

          {/* Insufficient Balance Warning */}
          {amount && parseFloat(amount) > availableBalance && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-600">
                Insufficient balance! You need ${(parseFloat(amount) - availableBalance).toFixed(2)} more.
              </span>
            </div>
          )}

          {/* VND Conversion Display (for bank withdrawals only) */}
          {withdrawalType === 'bank' && amount && parseFloat(amount) > 0 && (
            <div className={`mb-4 p-3 border rounded-xl ${parseFloat(amount) > availableBalance
              ? 'bg-red-50 border-red-200'
              : 'bg-green-50 border-green-200'
              }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">You will receive:</span>
                <span className={`text-lg font-semibold ${parseFloat(amount) > availableBalance ? 'text-red-600' : 'text-green-600'
                  }`}>
                  {(parseFloat(amount) * exchangeRate).toLocaleString('vi-VN')} VND
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Rate: 1 USD = {exchangeRate.toLocaleString('vi-VN')} VND
              </p>
            </div>
          )}

          <label className="block text-sm text-gray-600 mb-3">Payment Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter payment password"
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={
            completedToday < dailyTasks ||
            hasWithdrawToday ||
            !amount ||
            parseFloat(amount) <= 0 ||
            parseFloat(amount) > availableBalance
          }
        >
          Submit Withdrawal
        </motion.button>
      </div>
      {/* Pending list */}
      {pendingWithdrawals.length > 0 && (
        <div className="px-6">
          <h3 className="text-sm text-gray-700 mb-2">Pending withdrawal requests</h3>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2">
            {pendingWithdrawals.map((w: any) => (
              <div key={w._id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">${w.amount.toFixed(2)}</span>
                <span className="text-orange-600">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
