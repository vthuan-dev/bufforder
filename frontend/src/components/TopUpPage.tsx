import React, { useEffect, useState } from "react";
import { ArrowLeft, DollarSign, Copy, Check } from "lucide-react";
import { motion } from "motion/react";
import api from "../services/api";

interface TopUpPageProps {
  onBack: () => void;
}

export function TopUpPage({ onBack }: TopUpPageProps) {
  const [amount, setAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);

  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  useEffect(() => {
    (async () => {
      try {
        const res = await api.profile();
        const user = res?.data?.user;
        if (user) setBalance(Number(user.balance || 0));
      } catch {}
      try {
        const reqs = await api.getDepositRequests();
        const list = (reqs?.data?.requests || []).filter((r: any) => r.status === 'pending');
        setPendingDeposits(list);
      } catch {}
    })();
  }, []);

  const handleQuickAmount = (value: number) => {
    setSelectedAmount(value);
    setAmount(value.toString());
  };

  const handleTopUp = async () => {
    const parsed = parseFloat(amount);
    if (!amount || parsed <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    try {
      const res = await api.deposit(parsed);
      if (res?.success) {
        alert("Deposit request submitted! Please wait for admin approval.");
        setAmount("");
        setSelectedAmount(null);
      }
    } catch (e: any) {
      alert(e?.message || "Failed to submit deposit request");
    }
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
          <h1 className="text-lg">Top Up</h1>
        </div>
      </div>

      <div className="px-5 py-6 max-w-md mx-auto">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500 via-blue-500 to-blue-600 rounded-3xl p-6 text-white mb-6 shadow-lg"
        >
          <p className="text-sm opacity-90 mb-2">Current Balance</p>
          <p className="text-3xl mb-1">${balance.toFixed(2)}</p>
        </motion.div>

        {/* Amount Input */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-5">
          <label className="block text-sm text-gray-700 mb-3">Enter Amount</label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setSelectedAmount(null);
              }}
              placeholder="0.00"
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <p className="text-sm text-gray-700 mb-4">Quick Select</p>
          <div className="grid grid-cols-3 gap-3">
            {quickAmounts.map((value) => (
              <motion.button
                key={value}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleQuickAmount(value)}
                className={`py-3 rounded-xl text-sm transition-all border-2 ${
                  selectedAmount === value
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                ${value}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Payment Instructions */}
        {/* <div className="bg-blue-50 rounded-3xl p-5 mb-6 border border-blue-100">
          <h3 className="text-sm text-gray-800 mb-3">Payment Instructions:</h3>
          <ol className="space-y-2 text-xs text-gray-700">
            <li className="flex gap-2">
              <span className="text-blue-600">1.</span>
              <span>Select or enter the amount you want to top up</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">2.</span>
              <span>Click "Submit Request" button</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">3.</span>
              <span>Balance will be updated within 5-10 minutes</span>
            </li>
          </ol>
        </div> */}

        {/* Submit Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleTopUp}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:bg-blue-700 relative overflow-hidden group"
        >
          {/* Shine effect on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ transform: 'skewX(-20deg)' }}
          />
          <span className="relative z-10 text-base">Submit Request</span>
        </motion.button>
        {/* Pending list */}
        {pendingDeposits.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm text-gray-700 mb-2">Pending requests</h3>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2">
              {pendingDeposits.map((r: any) => (
                <div key={r._id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">${r.amount.toFixed(2)}</span>
                  <span className="text-orange-600">Pending</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
