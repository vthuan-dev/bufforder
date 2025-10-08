import React from 'react';
import { Star, TrendingUp, Shield, MapPin, DollarSign, Minus, FileText, CreditCard, LogOut } from 'lucide-react';

/**
 * Demo component showcasing the modern profile page design
 * This component demonstrates all the key design elements implemented
 */
export function ProfileDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      {/* Modern Profile Header */}
      <div className="relative mb-6 overflow-hidden">
        <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 rounded-3xl p-6 shadow-2xl overflow-hidden border border-black/20">
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm rounded-3xl ring-1 ring-inset ring-black/30 pointer-events-none"></div>
          
          {/* Decorative elements */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-black/5 rounded-full blur-xl animate-pulse-slow"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-black/5 rounded-full blur-lg animate-float"></div>
          
          <div className="relative z-10">
            {/* Profile Avatar and Title */}
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-4 shadow-lg border border-white/30">
                <Star className="w-8 h-8 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-white text-2xl font-bold mb-1">Thành viên mới</h1>
                <p className="text-white/80 text-sm">New Member</p>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="glassmorphism rounded-2xl p-4 mb-6">
              <p className="text-white font-medium text-lg">welcome: 0706871283</p>
              <p className="text-white/70 text-sm mt-1">ID: ****</p>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glassmorphism rounded-2xl p-4 shadow-lg card-hover">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mr-2">
                    <TrendingUp className="w-4 h-4 text-green-300" />
                  </div>
                  <p className="text-white/80 text-sm font-medium">Available</p>
                </div>
                <p className="text-white text-2xl font-bold">0.00$</p>
              </div>
              
              <div className="glassmorphism rounded-2xl p-4 shadow-lg card-hover">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-2">
                    <Shield className="w-4 h-4 text-blue-300" />
                  </div>
                  <p className="text-white/80 text-sm font-medium">Freeze</p>
                </div>
                <p className="text-white text-2xl font-bold">0.00$</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Action Menu */}
      <div className="space-y-3">
        {[
          { icon: MapPin, label: 'Shipping Address', color: 'blue' },
          { icon: DollarSign, label: 'Top up', color: 'green' },
          { icon: Minus, label: 'Withdrawal', color: 'orange' },
          { icon: FileText, label: 'Records', color: 'purple' },
          { icon: CreditCard, label: 'Bank Card', color: 'indigo' },
          { icon: LogOut, label: 'Logout', color: 'red', isLogout: true },
        ].map((item, index) => (
          <div key={index} className="group">
            <div className={`w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 card-hover ${
              item.isLogout ? 'hover:bg-red-50 hover:border-red-200' : 'hover:bg-gray-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-12 h-12 bg-${item.color}-100 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200`}>
                    <item.icon className={`w-6 h-6 text-${item.color}-600`} />
                  </div>
                  <span className={`font-medium text-base ${item.isLogout ? 'text-red-600' : 'text-gray-900'}`}>
                    {item.label}
                  </span>
                </div>
                {!item.isLogout && (
                  <div className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200">
                    →
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Design System Showcase */}
      <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Design System Elements</h2>
        
        {/* Color Palette */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3 text-gray-800">Color Palette</h3>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-blue-500 h-12 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-medium">Primary</span>
            </div>
            <div className="bg-green-500 h-12 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-medium">Accent</span>
            </div>
            <div className="bg-gray-500 h-12 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-medium">Neutral</span>
            </div>
            <div className="bg-red-500 h-12 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-medium">Error</span>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3 text-gray-800">Typography</h3>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-gray-900">Heading Large</p>
            <p className="text-xl font-semibold text-gray-800">Heading Medium</p>
            <p className="text-base font-medium text-gray-700">Body Medium</p>
            <p className="text-sm text-gray-600">Body Small</p>
            <p className="text-xs text-gray-500">Caption</p>
          </div>
        </div>

        {/* Spacing */}
        <div>
          <h3 className="text-lg font-medium mb-3 text-gray-800">Spacing & Radius</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <div className="text-sm font-medium text-gray-700">12px Radius</div>
            </div>
            <div className="bg-gray-100 rounded-xl p-4 text-center">
              <div className="text-sm font-medium text-gray-700">16px Radius</div>
            </div>
            <div className="bg-gray-100 rounded-2xl p-4 text-center">
              <div className="text-sm font-medium text-gray-700">24px Radius</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
