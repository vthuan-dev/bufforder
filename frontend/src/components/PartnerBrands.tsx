import { useTranslation } from 'react-i18next';

// Partner brands data - Mixed sources for best compatibility
const partnerBrands = [
  { name: 'Starbucks', logo: 'https://cdn.simpleicons.org/starbucks/00704A' },
  { name: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg' },
  { name: 'Target', logo: 'https://cdn.simpleicons.org/target/CC0000' },
  { name: 'Apple', logo: 'https://cdn.simpleicons.org/apple/000000' },
  { name: 'Best Buy', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/Best_Buy_Logo.svg' },
  { name: 'Nike', logo: 'https://cdn.simpleicons.org/nike/000000' },
  { name: 'Adidas', logo: 'https://cdn.simpleicons.org/adidas/000000' },
  { name: 'Puma', logo: 'https://cdn.simpleicons.org/puma/000000' },
  { name: 'Under Armour', logo: 'https://cdn.simpleicons.org/underarmour/1D1D1D' },
  { name: 'Reebok', logo: 'https://cdn.simpleicons.org/reebok/000000' },
  { name: 'New Balance', logo: 'https://cdn.simpleicons.org/newbalance/CC0000' },
  { name: 'Converse', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Converse_logo.svg' },
  { name: 'Gucci', logo: 'https://cdn.simpleicons.org/gucci/000000' },
  { name: 'H&M', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/53/H%26M-Logo.svg' },
  { name: 'Zara', logo: 'https://cdn.simpleicons.org/zara/000000' },
  { name: 'Uniqlo', logo: 'https://cdn.simpleicons.org/uniqlo/ED1C24' },
  { name: 'Gap', logo: 'https://cdn.simpleicons.org/gap/003087' },
  { name: 'Lululemon', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Lululemon_Athletica_logo.svg' },
  { name: 'Sephora', logo: 'https://cdn.simpleicons.org/sephora/000000' },
  { name: 'eBay', logo: 'https://cdn.simpleicons.org/ebay/E53238' },
  { name: 'Etsy', logo: 'https://cdn.simpleicons.org/etsy/F16521' },
  { name: 'Shopify', logo: 'https://cdn.simpleicons.org/shopify/7AB55C' },
  { name: 'Alibaba', logo: 'https://cdn.simpleicons.org/alibabadotcom/FF6A00' },
  { name: 'AliExpress', logo: 'https://cdn.simpleicons.org/aliexpress/FF4747' },
  { name: 'Ikea', logo: 'https://cdn.simpleicons.org/ikea/0058A3' },
  { name: 'Costco', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/59/Costco_Wholesale_logo_2010-10-26.svg' },
  { name: 'Samsung', logo: 'https://cdn.simpleicons.org/samsung/1428A0' },
  { name: 'Sony', logo: 'https://cdn.simpleicons.org/sony/000000' },
  { name: 'LG', logo: 'https://cdn.simpleicons.org/lg/A50034' },
  { name: 'Dell', logo: 'https://cdn.simpleicons.org/dell/007DB8' },
  { name: 'HP', logo: 'https://cdn.simpleicons.org/hp/0096D6' },
  { name: 'Lenovo', logo: 'https://cdn.simpleicons.org/lenovo/E2231A' },
  { name: 'Microsoft', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg' },
  { name: 'Google', logo: 'https://cdn.simpleicons.org/google/4285F4' },
];

export function PartnerBrands() {
  const { t } = useTranslation(['home']);

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md bg-gradient-to-r from-blue-500 to-purple-500 border-t-2 border-white z-50 shadow-2xl">
      <div className="px-4 pt-2 pb-1.5">
        <h2 className="text-white mb-1.5 text-center text-xs font-bold">
          {t('home:ourPartners', 'Đối tác liên kết của chúng tôi')}
        </h2>
        
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 py-0.5 rounded-lg shadow-sm">
          <div className="partner-marquee">
            <div className="partner-marquee-content">
              {/* First set of brands */}
              {partnerBrands.map((brand, index) => (
                <div key={`brand-1-${index}`} className="partner-item">
                  <img 
                    src={brand.logo} 
                    alt={brand.name}
                    className="partner-logo"
                    loading="lazy"
                  />
                </div>
              ))}
              {/* Duplicate set for seamless loop */}
              {partnerBrands.map((brand, index) => (
                <div key={`brand-2-${index}`} className="partner-item">
                  <img 
                    src={brand.logo} 
                    alt={brand.name}
                    className="partner-logo"
                    loading="lazy"
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
