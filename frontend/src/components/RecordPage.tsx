import React, { useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { Badge } from './ui/badge';
import exampleImage from 'figma:asset/c82abf320116b9529a10b5a08317ef15125a755e.png';

export function RecordPage() {
  const [activeTab, setActiveTab] = useState('paid');

  // Mock data for settled orders
  const settledOrders = [
    {
      id: 1,
      image: exampleImage,
      description: 'Ashford Luxury Watch Collection - Premium Swiss Movement Timepiece with Leather Band',
      orderTotal: '1,299.99$',
      commission: '65.00$'
    },
    {
      id: 2,
      image: exampleImage,
      description: 'Elite Chronograph Watch - Stainless Steel Case with Sapphire Crystal',
      orderTotal: '899.50$',
      commission: '44.98$'
    },
    {
      id: 3,
      image: exampleImage,
      description: 'Classic Dress Watch - Gold Plated with Genuine Leather Strap',
      orderTotal: '599.00$',
      commission: '29.95$'
    }
  ];

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
  const OrderItem = ({ order }: { order: typeof settledOrders[0] }) => (
    <div className="flex p-4 border-b border-gray-100 last:border-b-0">
      {/* Product Image */}
      <div className="w-16 h-16 bg-gray-100 rounded-lg mr-4 flex-shrink-0 overflow-hidden">
        <img 
          src={order.image} 
          alt="Product" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Content */}
      <div className="flex-1">
        {/* Settled Badge */}
        <div className="flex justify-end mb-2">
          <Badge className="bg-green-100 text-green-800 border-green-200 rounded-full px-3 py-1 text-xs">
            Settled
          </Badge>
        </div>
        
        {/* Product Description */}
        <p className="text-gray-800 text-sm mb-3 line-clamp-3 leading-relaxed">
          {order.description}
        </p>
        
        {/* Order Details */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Order Total:</span>
            <span className="text-gray-800 font-medium">{order.orderTotal}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Commission:</span>
            <span className="text-green-600 font-medium">{order.commission}</span>
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
            <span className="text-gray-800 font-medium">10039.30$</span>
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
          {['pending', 'paid', 'settled'].map((tab) => (
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
        {activeTab === 'settled' ? (
          <div className="bg-white">
            {settledOrders.map((order) => (
              <OrderItem key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}