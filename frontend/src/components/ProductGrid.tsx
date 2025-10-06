import React from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Product {
  id: number;
  name: string;
  image: string;
  unitPrice: number;
  rebate: number;
}

const products: Product[] = [
  {
    id: 1,
    name: "Sophie Buhai",
    image: "https://images.unsplash.com/photo-1662624915084-061d80eec5fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibHVlJTIwamV3ZWxyeSUyMGVhcnJpbmdzfGVufDF8fHx8MTc1OTQ3ODQxM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    unitPrice: 719,
    rebate: 1.092
  },
  {
    id: 2,
    name: "Balenciaga",
    image: "https://images.unsplash.com/photo-1719523677291-a395426c1a87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydW5uaW5nJTIwc2hvZXMlMjBzbmVha2Vyc3xlbnwxfHx8fDE3NTk0NTcyOTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    unitPrice: 764,
    rebate: 1.161
  },
  {
    id: 3,
    name: "Outdoor Gear",
    image: "https://images.unsplash.com/photo-1508266653056-081ca318593e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW1waW5nJTIwY29vbGVyJTIwb3V0ZG9vciUyMGdlYXJ8ZW58MXx8fHwxNzU5NDc4NDA4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    unitPrice: 299,
    rebate: 0.899
  }
];

export function ProductGrid() {
  return (
    <div className="px-4 pb-20">
      <div className="grid grid-cols-2 gap-4">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <ImageWithFallback 
              src={product.image}
              alt={product.name}
              className="w-full h-32 object-cover"
            />
            <div className="p-3">
              <h4 className="text-sm mb-2">{product.name}</h4>
              <div className="space-y-1">
                <p className="text-red-500 text-sm">
                  unit price: {product.unitPrice}
                </p>
                <p className="text-red-500 text-sm">
                  Rebate{product.rebate}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}