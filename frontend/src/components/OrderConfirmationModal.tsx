import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import toast from 'react-hot-toast';
import api from '../services/api';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderComplete?: (orderData: any) => void;
  orderData?: any;
}

export function OrderConfirmationModal({ isOpen, onClose, onOrderComplete, orderData }: OrderConfirmationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  // Generate order number when modal opens
  useEffect(() => {
    if (isOpen) {
      setOrderNumber('OR' + Date.now() + Math.floor(Math.random() * 1000));
    }
  }, [isOpen]);

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to complete order');
        return;
      }

      if (!orderData) {
        toast.error('Product data not found');
        return;
      }

      // Call backend to complete the order
      const response = await api.completeOrder(token, orderData);
      
      if (response.success) {
        const completedOrderData = {
          product: orderData,
          orderNumber,
          profit: response.data.order.commissionAmount,
          completedAt: new Date()
        };

        // Call the completion callback if provided
        if (onOrderComplete) {
          onOrderComplete(completedOrderData);
        }

        toast.success('Order completed successfully!');
        onClose();
      } else {
        toast.error(response.message || 'Error occurred when completing order');
      }
    } catch (error) {
      console.error('Error completing order:', error);
      toast.error('Error occurred when completing order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!orderData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[280px] mx-auto rounded-2xl border-0 p-0 overflow-hidden">
        <DialogTitle className="text-base text-gray-700 p-4 pb-3">Order confirmation</DialogTitle>
        <DialogDescription className="sr-only">
          Order confirmation details including product information, pricing, and order number
        </DialogDescription>

        {/* Content */}
        <div className="px-4 pb-4 space-y-4 -mt-2">
          {/* Product Info */}
          <div className="flex gap-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-green-200 to-green-400 flex-shrink-0">
              <ImageWithFallback 
                src={`https://images.unsplash.com/photo-1523170335258-f5e6a4e8c4c5?w=300&h=300&fit=crop`}
                alt={orderData.productName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-gray-900 mb-1 text-sm font-medium">{orderData.productName}</h3>
              <p className="text-gray-600 text-xs leading-relaxed">
                {orderData.brand} - Premium timepiece
              </p>
            </div>
          </div>

          {/* Price and Quantity */}
          <div className="flex justify-between items-center">
            <span className="text-xl text-red-500 font-semibold">${orderData.productPrice.toLocaleString()}</span>
            <span className="text-gray-600 text-sm">x1</span>
          </div>

          {/* Order Details */}
          <div className="space-y-2 py-3 border-t border-gray-100">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Order Number:</span>
              <span className="text-gray-900">{orderNumber}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Commission Rate:</span>
              <span className="text-gray-900">{orderData.commissionRate}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Profit from this order:</span>
              <span className="text-red-500">${orderData.commissionAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button 
              variant="outline" 
              className="rounded-lg py-2 text-sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Later
            </Button>
            <Button 
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg py-2 text-sm"
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Submit Order'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}