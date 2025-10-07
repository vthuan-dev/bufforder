import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { Badge } from './ui/badge';
import api from '../services/api';
import { allProducts } from './OrdersPage';

export function RecordPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'paid' | 'settled'>('paid');
  const [orders, setOrders] = useState<any[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    try {
      const stats = await api.getOrderStats(token);
      setBalance(stats.data?.balance ?? 0);
      const list = await api.getOrderHistory(token, { page: 1, limit: 100 });
      const items = (list.data?.orders || []).map((o: any) => {
        // backfill image from current product catalog if missing
        if (!o.image && o.productId) {
          const found = allProducts.find(p => p.id === o.productId);
          if (found) {
            o.image = found.image;
          }
        }
        return o;
      });
      setOrders(items);
    } catch (e) {
      console.error('Load record error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Empty State Component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-6">
        {/* Yellow document icon with floating elements */}
        <div className="relative">
          <div className="w-16 h-20 bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/30 to-transparent"></div>
            <div className="relative z-10">
              <div className="w-8 h-1 bg-white/70 rounded mb-2"></div>
              <div className="w-6 h-1 bg-white/70 rounded mb-2"></div>
              <div className="w-8 h-1 bg-white/70 rounded"></div>
            </div>
          </div>
          
          {/* Floating decorative elements */}
          <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-300 rounded-full opacity-60"></div>
          <div className="absolute -bottom-1 -left-3 w-2 h-2 bg-yellow-400 rounded-full opacity-50"></div>
          <div className="absolute top-4 -left-4 w-1.5 h-1.5 bg-yellow-500 rounded-full opacity-40"></div>
          <div className="absolute -bottom-2 -right-4 w-2.5 h-2.5 bg-yellow-300 rounded-full opacity-30"></div>
          
          {/* Curved dotted line */}
          <div className="absolute top-6 right-4 w-8 h-8">
            <svg viewBox="0 0 32 32" className="w-full h-full opacity-40">
              <path 
                d="M2,16 Q8,8 16,16 T30,16" 
                stroke="#FCD34D" 
                strokeWidth="2" 
                fill="none" 
                strokeDasharray="2,2"
              />
            </svg>
          </div>
        </div>
      </div>
      
      <p className="text-gray-400 text-center">No data yet</p>
    </div>
  );

  // Order Item Component for Settled tab
  const OrderItem = ({ order }: { order: any }) => (
    <div className="flex p-4 border-b border-gray-100 last:border-b-0">
      {/* Product Image */}
      <div className="w-16 h-16 bg-gray-100 rounded-lg mr-4 flex-shrink-0 overflow-hidden">
        <img
          src={order.image || 'https://images.unsplash.com/photo-1523170335258-f5e6a4e8c4c5?w=300&h=300&fit=crop'}
          alt={order.productName || 'Product'}
          className="w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523170335258-f5e6a4e8c4c5?w=300&h=300&fit=crop'; }}
        />
      </div>
      
      {/* Content */}
      <div className="flex-1">
        {/* Settled Badge */}
        <div className="flex justify-end mb-2">
          <Badge className={`rounded-full px-3 py-1 text-xs ${order.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-gray-100 text-gray-800 border-gray-200' }`}>
            {order.status === 'completed' ? 'Settled' : order.status === 'pending' ? 'Pending' : 'Cancelled'}
          </Badge>
        </div>
        
        {/* Product Description */}
        <p className="text-gray-800 text-sm mb-3 line-clamp-3 leading-relaxed">
          {order.productName}
        </p>
        
        {/* Order Details */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Order Total:</span>
            <span className="text-gray-800 font-medium">${order.productPrice?.toLocaleString?.() || order.productPrice}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Commission:</span>
            <span className="text-green-600 font-medium">${order.commissionAmount?.toLocaleString?.() || order.commissionAmount}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="flex items-center p-4">
          <ArrowLeft className="w-5 h-5 text-gray-700 mr-4" />
          <h1 className="text-lg font-medium text-gray-900">Order History</h1>
        </div>
      </div>

      {/* Balance Information */}
      <div className="bg-white p-4 border-b border-gray-100">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-800">Available balance:</span>
            <span className="text-gray-800 font-medium">{balance.toLocaleString()}$</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-800">Freeze Balance:</span>
            <span className="text-gray-800 font-medium">0.00$</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          {(['pending', 'paid', 'settled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 px-4 text-center relative ${
                activeTab === tab 
                  ? 'text-gray-900' 
                  : 'text-gray-500'
              }`}
            >
              <span className="capitalize">{tab}</span>
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        <div className="bg-white min-h-[200px]">
          {orders.filter(o => activeTab === 'settled' ? o.status === 'completed' : activeTab === 'pending' ? o.status === 'pending' : o.status === 'completed').length === 0 ? (
            <EmptyState />
          ) : (
            orders
              .filter(o => activeTab === 'settled' ? o.status === 'completed' : activeTab === 'pending' ? o.status === 'pending' : o.status === 'completed')
              .map((order) => (
                <OrderItem key={order._id} order={order} />
              ))
          )}
        </div>
      </div>
    </div>
  );
}