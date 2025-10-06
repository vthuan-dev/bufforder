import React from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function HeroSection() {
  return (
    <div className="relative">
      {/* Member Memories Section */}
      <div className="bg-white px-4 py-4">
        <div className="relative">
          <ImageWithFallback 
            src="https://images.unsplash.com/photo-1564577160324-112d603f750f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvdXRkb29yJTIwY2FtcGluZyUyMHRlbnQlMjBuYXR1cmV8ZW58MXx8fHwxNzU5NDc4Mzk5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="REI Co-op Half Dome Tent"
            className="w-full h-48 object-cover rounded-lg"
          />
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded">
            <p className="text-sm">Member Memories: My REI Co-op Half Dome Tent</p>
          </div>
        </div>
      </div>
    </div>
  );
}