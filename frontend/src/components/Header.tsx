import React from 'react';
import ashfordLogo from "figma:asset/abc6a05805f4aafc9128ab9b18fdc9397ab69e7c.png";

export function Header() {
  return (
    <header className="bg-gray-200 py-4 px-4 flex justify-center items-center border-b border-gray-400">
      <div className="flex items-center justify-center">
        <img 
          src={ashfordLogo}
          alt="Ashford"
          className="h-8 w-auto"
        />
      </div>
    </header>
  );
}