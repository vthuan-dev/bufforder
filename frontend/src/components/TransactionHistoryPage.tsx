import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import api from "../services/api";

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  time: string;
}

interface TransactionHistoryPageProps {
  onBack: () => void;
}

export function TransactionHistoryPage({ onBack }: TransactionHistoryPageProps) {
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [depositsRes, withdrawalsRes] = await Promise.all([
          api.getDepositRequests(),
          api.getWithdrawalRequests(),
        ]);
        const deposits = (depositsRes?.data?.requests || []).map((r: any) => ({
          id: r._id,
          type: 'deposit' as const,
          amount: Number(r.amount || 0),
          status: (r.status || 'pending') as 'completed' | 'pending' | 'failed',
          date: new Date(r.requestDate).toISOString().slice(0, 10),
          time: new Date(r.requestDate).toLocaleTimeString(),
        }));
        const withdrawals = (withdrawalsRes?.data?.requests || []).map((r: any) => ({
          id: r._id,
          type: 'withdrawal' as const,
          amount: Number(r.amount || 0),
          status: (r.status || 'pending') as 'completed' | 'pending' | 'failed',
          date: new Date(r.requestDate).toISOString().slice(0, 10),
          time: new Date(r.requestDate).toLocaleTimeString(),
        }));
        setTransactions([...deposits, ...withdrawals].sort((a,b)=>{
          const d1 = new Date(`${a.date} ${a.time}`).getTime();
          const d2 = new Date(`${b.date} ${b.time}`).getTime();
          return d2 - d1;
        }));
      } catch {}
    })();
  }, []);

  const filteredTransactions = useMemo(() => transactions.filter(t => filter === 'all' || t.type === filter), [transactions, filter]);

  const totalDeposits = useMemo(() => transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0), [transactions]);

  const totalWithdrawals = useMemo(() => transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0), [transactions]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
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
          <h1 className="text-lg">Transaction History</h1>
        </div>
      </div>

      <div className="px-5 py-6 max-w-md mx-auto">
        {/* Filter Tabs */}
        <div className="bg-white rounded-full p-1.5 shadow-sm mb-6 grid grid-cols-3 gap-1">
          {(['all', 'deposit', 'withdrawal'] as const).map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setFilter(tab)}
              whileTap={{ scale: 0.97 }}
              className={`py-2.5 rounded-full text-sm capitalize transition-all text-center ${
                filter === tab
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab}
            </motion.button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-400 to-green-500 rounded-3xl p-5 text-white shadow-md"
          >
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownRight className="w-4 h-4" strokeWidth={2.5} />
              <p className="text-xs opacity-90">Total Deposits</p>
            </div>
            <p className="text-2xl">${totalDeposits.toLocaleString()}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl p-5 text-white shadow-md"
          >
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
              <p className="text-xs opacity-90">Total Withdrawals</p>
            </div>
            <p className="text-2xl">${totalWithdrawals.toLocaleString()}</p>
          </motion.div>
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          {filteredTransactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {/* Icon */}
                  <div className={`p-2.5 rounded-xl ${
                    transaction.type === 'deposit' 
                      ? 'bg-green-50' 
                      : 'bg-orange-50'
                  }`}>
                    {transaction.type === 'deposit' ? (
                      <ArrowDownRight className="w-5 h-5 text-green-600" strokeWidth={2.5} />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-orange-600" strokeWidth={2.5} />
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1">
                    <p className="text-gray-800 capitalize mb-0.5">{transaction.type}</p>
                    <p className="text-xs text-gray-500">
                      {transaction.date} • {transaction.time}
                    </p>
                  </div>
                </div>

                {/* Amount & Status */}
                <div className="text-right">
                  <p className={`mb-1 ${
                    transaction.type === 'deposit' ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount}
                  </p>
                  <p className={`text-xs capitalize ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTransactions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowDownRight className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-1">No transactions found</p>
            <p className="text-sm text-gray-400">Try changing the filter</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
