import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';

interface OrderProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OrderProgressModal({ isOpen, onClose, onComplete }: OrderProgressModalProps) {
  const [progress, setProgress] = React.useState(1);

  React.useEffect(() => {
    if (isOpen) {
      setProgress(1); // Reset to 1% when modal opens
      
      // Animate progress from 1% to 100% over 5 seconds
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            // Complete after reaching 100%
            setTimeout(() => onComplete(), 500);
            return 100;
          }
          return prev + 1; // Increment by 1% every 50ms (5000ms / 99 steps)
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isOpen, onComplete]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl border-0 p-8">
        <DialogTitle className="text-xl text-gray-700 text-center">Order in progress</DialogTitle>
        <DialogDescription className="sr-only">
          Progress indicator for order processing and queue status
        </DialogDescription>
        <div className="text-center space-y-6">
          
          {/* Progress Circle */}
          <div className="relative w-24 h-24 mx-auto">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#f3f4f6"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#f97316"
                strokeWidth="8"
                fill="none"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * progress) / 100}
                strokeLinecap="round"
                className="transition-all duration-75 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl text-gray-700">{progress}%</span>
            </div>
          </div>

          <div className="space-y-4 text-sm text-gray-600">
            <p>
              Due to the large number of users competing for orders 
              at the current level, the system is working hard to assign 
              orders. It is currently ranked 11th. Please wait patiently.
            </p>
            <p>
              Tips: Upgrading your VIP level can help you get orders 
              faster
            </p>
          </div>

          <Button 
            variant="outline" 
            className="w-full rounded-full py-3"
            onClick={onClose}
          >
            Cancel queue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}