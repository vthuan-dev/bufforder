import { useTranslation } from 'react-i18next';
import { useState } from 'react';

// Partner brands data - Only reliable CDN sources
const partnerBrands = [
  { name: 'Overstock', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIlCIfFGzy0VjSHixjtECQzN_I0AMsS-_ZMugdJiHxuw&s=10' },
  { name: 'Starbucks', logo: 'https://cdn.simpleicons.org/starbucks/00704A' },
  { name: 'Amazon', logo: 'https://thumbs.dreamstime.com/b/humpolec-czech-republic-january-amazon-company-logo-technology-delivery-shop-store-global-vector-274656518.jpg' },
  { name: 'Target', logo: 'https://cdn.simpleicons.org/target/CC0000' },
  { name: 'Apple', logo: 'https://cdn.simpleicons.org/apple/000000' },
  { name: 'Nike', logo: 'https://cdn.simpleicons.org/nike/000000' },
  { name: 'Adidas', logo: 'https://cdn.simpleicons.org/adidas/000000' },
  { name: 'Puma', logo: 'https://cdn.simpleicons.org/puma/000000' },
  { name: 'Gucci', logo: 'https://seeklogo.com/vector-logo/64069/gucci' },
  { name: 'Zara', logo: 'https://cdn.simpleicons.org/zara/000000' },
  { name: 'Uniqlo', logo: 'https://cdn.simpleicons.org/uniqlo/ED1C24' },
  { name: 'eBay', logo: 'https://cdn.simpleicons.org/ebay/E53238' },
  { name: 'Etsy', logo: 'https://cdn.simpleicons.org/etsy/F16521' },
  { name: 'Shopify', logo: 'https://cdn.simpleicons.org/shopify/7AB55C' },
  { name: 'Alibaba', logo: 'https://cdn.simpleicons.org/alibabadotcom/FF6A00' },
  { name: 'AliExpress', logo: 'https://cdn.simpleicons.org/aliexpress/FF4747' },
  { name: 'Ikea', logo: 'https://cdn.simpleicons.org/ikea/0058A3' },
  { name: 'Samsung', logo: 'https://cdn.simpleicons.org/samsung/1428A0' },
  { name: 'Sony', logo: 'https://cdn.simpleicons.org/sony/000000' },
  { name: 'LG', logo: 'https://cdn.simpleicons.org/lg/A50034' },
  { name: 'Dell', logo: 'https://cdn.simpleicons.org/dell/007DB8' },
  { name: 'HP', logo: 'https://cdn.simpleicons.org/hp/0096D6' },
  { name: 'Lenovo', logo: 'https://cdn.simpleicons.org/lenovo/E2231A' },
  { name: 'Google', logo: 'https://cdn.simpleicons.org/google/4285F4' },
];

export function PartnerBrands() {
  const { t } = useTranslation(['home']);
  const [hiddenBrands, setHiddenBrands] = useState<Set<number>>(new Set());

  const handleImageError = (index: number) => {
    setHiddenBrands(prev => new Set(prev).add(index));
  };

  const visibleBrands = partnerBrands.filter((_, index) => !hiddenBrands.has(index));

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-md bg-gradient-to-r from-blue-500 to-purple-500 border-t-2 border-white z-10 shadow-2xl">
      <div className="px-4 pt-2 pb-1.5">
        <h2 className="text-white mb-1.5 text-center text-xs font-bold">
          {t('home:ourPartners', 'Đối tác liên kết của chúng tôi')}
        </h2>
        
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 py-0.5 rounded-lg shadow-sm">
          <div className="partner-marquee">
            <div className="partner-marquee-content">
              {/* First set of brands */}
              {visibleBrands.map((brand, index) => (
                <div key={`brand-1-${index}`} className="partner-item">
                  <img 
                    src={brand.logo} 
                    alt={brand.name}
                    className="partner-logo"
                    loading="lazy"
                    onError={() => handleImageError(partnerBrands.indexOf(brand))}
                  />
                </div>
              ))}
              {/* Duplicate set for seamless loop */}
              {visibleBrands.map((brand, index) => (
                <div key={`brand-2-${index}`} className="partner-item">
                  <img 
                    src={brand.logo} 
                    alt={brand.name}
                    className="partner-logo"
                    loading="lazy"
                    onError={() => handleImageError(partnerBrands.indexOf(brand))}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
