import React from 'react';

export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-purple-500/20 animate-pulse" />
      </div>
      
      {/* Floating geometric shapes */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500/20 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
      <div className="absolute top-32 right-16 w-16 h-16 bg-purple-500/20 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }} />
      <div className="absolute bottom-20 left-20 w-12 h-12 bg-cyan-500/20 rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }} />
      <div className="absolute bottom-32 right-10 w-24 h-24 bg-pink-500/20 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }} />
      
      {/* Animated lines */}
      <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent animate-pulse" />
      <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>
    </div>
  );
}
