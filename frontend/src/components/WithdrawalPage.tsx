import { useEffect, useState } from "react";
import { ArrowLeft, DollarSign, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import api from "../services/api";

interface WithdrawalPageProps {
  onBack: () => void;
}

export function WithdrawalPage({ onBack }: WithdrawalPageProps) {
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [availableBalance, setAvailableBalance] = useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [dailyTasks, setDailyTasks] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [hasWithdrawToday, setHasWithdrawToday] = useState(false);
  const [bankCards, setBankCards] = useState<{ id: string; bankName: string; cardNumber: string; accountName: string; isDefault?: boolean; }[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const minWithdrawal = 50;
  const maxWithdrawal = 5000;

  useEffect(() => {
    (async () => {
      try {
        const profile = await api.profile();
        const user = profile?.data?.user;
        if (user) setAvailableBalance(Number(user.balance || 0));
      } catch {}
      // Load order stats for daily completion requirement
      try {
        const stats = await api.userOrderStats();
        if (stats?.success) {
          setDailyTasks(Number(stats.data?.totalDailyTasks || 0));
          setCompletedToday(Number(stats.data?.completedToday || 0));
        }
      } catch {}
      try {
        const cards = await api.getBankCards();
        const list = cards?.data?.bankCards || [];
        setBankCards(list);
        const def = list.find((c: any) => c.isDefault) || list[0];
        setSelectedCardId(def?.id || "");
      } catch {}
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
      } catch {}
    })();
  }, []);

  const handleWithdrawal = async () => {
    // Guard: daily tasks must be completed
    if (completedToday < dailyTasks) {
      alert(`Please complete all daily orders first (${completedToday}/${dailyTasks}).`);
      return;
    }
    // Guard: only one withdrawal per day
    if (hasWithdrawToday) {
      alert('You have already made a withdrawal today. Only one withdrawal per day is allowed.');
      return;
    }
    const withdrawAmount = parseFloat(amount);
    
    if (!amount || withdrawAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    
    if (withdrawAmount < minWithdrawal) {
      alert(`Minimum withdrawal amount is $${minWithdrawal}`);
      return;
    }
    
    if (withdrawAmount > maxWithdrawal) {
      alert(`Maximum withdrawal amount is $${maxWithdrawal}`);
      return;
    }
    
    if (withdrawAmount > availableBalance) {
      alert("Insufficient balance");
      return;
    }
    
    if (!password) {
      alert("Please enter your password");
      return;
    }
    if (!selectedCardId) {
      alert("Please add/select a bank card first");
      return;
    }
    try {
      const res = await api.withdrawal({ amount: withdrawAmount, bankCardId: selectedCardId, password });
      if (res?.success) {
        alert("Withdrawal request submitted!");
        setAmount("");
        setPassword("");
        setHasWithdrawToday(true);
        // refresh pending list to reflect new request
        try {
          const list = await api.getWithdrawalRequests();
          const items = (list?.data?.requests || []).filter((w: any) => w.status === 'pending');
          setPendingWithdrawals(items);
        } catch {}
        // Inform daily limit
        alert('Note: Only one withdrawal is allowed per day.');
      }
    } catch (e: any) {
      alert(e?.message || "Failed to submit withdrawal request");
    }
  };

  const handleWithdrawAll = () => {
    setAmount(availableBalance.toString());
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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
            <div className="mb-3 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-3">
              Complete all orders to withdraw today ({completedToday}/{dailyTasks}).
            </div>
          )}
          {hasWithdrawToday && (
            <div className="mb-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
              You have already submitted a withdrawal today.
            </div>
          )}
          <label className="block text-sm text-gray-600 mb-3">Select Bank Card</label>
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
          <label className="block text-sm text-gray-600 mb-3">Withdrawal Amount</label>
          <div className="relative mb-3">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-12 pr-24 py-4 bg-gray-50 border border-gray-200 rounded-xl text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleWithdrawAll}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-700 px-3 py-1 bg-blue-50 rounded-lg"
            >
              All
            </button>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mb-4">
            <span>Min: ${minWithdrawal}</span>
            <span>Max: ${maxWithdrawal}</span>
          </div>

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
          disabled={completedToday < dailyTasks || hasWithdrawToday}
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
