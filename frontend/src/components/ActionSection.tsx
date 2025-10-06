import React from 'react';
import { Button } from './ui/button';

export function ActionSection() {
  return (
    <div className="px-4 py-6">
      {/* Take Order Button */}
      <Button className="w-full bg-gray-800 text-white py-4 rounded-full text-lg hover:bg-gray-700 mb-6">
        TAKE ORDER
      </Button>

      {/* Stats Section */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <p className="text-gray-600 text-sm mb-1">Get commission</p>
          <p className="text-red-500 text-xl">0$</p>
        </div>
        <div className="text-center">
          <p className="text-gray-600 text-sm mb-1">Available balance</p>
          <p className="text-red-500 text-xl">10034.59$</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
        <div className="text-center">
          <p className="text-gray-600 text-sm mb-1">Today is Tasks</p>
          <p className="text-gray-800 text-xl">0.00</p>
        </div>
        <div className="text-center">
          <p className="text-gray-600 text-sm mb-1">Completed today</p>
          <p className="text-gray-800 text-xl"></p>
        </div>
      </div>
    </div>
  );
}