import React from 'react';
import { Crown, Lock, TrendingUp, Users, Award, Star, Zap, Gift } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
const logoImage = new URL('../assets/image.png', import.meta.url).toString();
import { vipThemes, VipTheme, VipThemeKey } from '../constants/vipThemes';

interface VIPLevel {
  id: VipThemeKey;
  name: string;
  subtitle: string;
  amountRequired: string;
  commission: string;
  orders: number;
  theme: VipTheme;
}

interface HomePageProps {
  bannerImage: string;
}

export function HomePage({ bannerImage }: HomePageProps) {
  const vipLevelsConfig: Array<{
    id: VipThemeKey;
    amountRequired: string;
    commission: string;
    orders: number;
  }> = [
    { id: 'royal', amountRequired: '$320,000', commission: '2.5%', orders: 330 },
    { id: 'ssvip', amountRequired: '$280,000', commission: '2.2%', orders: 300 },
    { id: 'svip', amountRequired: '$260,000', commission: '2%', orders: 280 },
    { id: 'vip7', amountRequired: '$200,000', commission: '1.8%', orders: 250 },
    { id: 'vip6', amountRequired: '$120,000', commission: '1.5%', orders: 220 },
    { id: 'vip5', amountRequired: '$80,000', commission: '1.2%', orders: 180 },
    { id: 'vip4', amountRequired: '$60,000', commission: '0.9%', orders: 150 },
    { id: 'vip3', amountRequired: '$30,000', commission: '0.7%', orders: 120 },
    { id: 'vip2', amountRequired: '$10,000', commission: '0.5%', orders: 80 },
    { id: 'vip1', amountRequired: '$3,000', commission: '0.3%', orders: 40 },
  ];

  const vipLevels: VIPLevel[] = vipLevelsConfig.map((entry) => {
    const theme = vipThemes[entry.id];
    return {
      ...entry,
      name: theme.label,
      subtitle: theme.subtitle,
      theme,
    };
  });

  return (
    <div className="pb-20">
      {/* Logo */}
      <div className="bg-gray-100 py-4 px-6 text-center">
        <img src={logoImage} alt="Ashford" className="inline-block h-10 object-contain" />
      </div>

      {/* Banner */}
      <div className="px-6 pt-6">
        <div className="rounded-3xl overflow-hidden shadow-lg">
          <img 
            src={bannerImage} 
            alt="Luxury Product" 
            className="w-full h-48 object-cover"
          />
        </div>
      </div>

      {/* Membership Levels */}
      <div className="px-6 pt-6">
        <h2 className="text-gray-800 mb-4 text-center">MEMBERSHIP LEVEL</h2>
        
        <div className="space-y-4">
          {vipLevels.map((level, index) => {
            const theme = level.theme;
            const hasBadge = Boolean(theme.badgeImage);

            return (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`relative overflow-hidden rounded-3xl ${theme.gradient} p-6 text-white shadow-xl`}
              >
                {/* VIP Background Image - Watermark */}
                {hasBadge && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-12 pointer-events-none">
                    <ImageWithFallback 
                      src={theme.badgeImage!} 
                      alt={`${level.name} Background`} 
                      className="w-36 h-36 object-contain"
                    />
                  </div>
                )}

                {/* Lock Icon */}
                <div className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full">
                  <Lock className="w-5 h-5" />
                </div>

                {/* VIP Icon or Badge */}
                <div className="relative z-10 mb-3">
                  {hasBadge ? (
                    <div className="inline-flex items-center">
                      <div className="w-16 h-20 flex items-center justify-center">
                        <ImageWithFallback 
                          src={theme.badgeImage!} 
                          alt={`${level.name} Badge`} 
                          className="w-full h-full object-contain drop-shadow-2xl"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="inline-flex p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                      <Crown className="w-7 h-7" />
                    </div>
                  )}
                </div>

                {/* VIP Title */}
                <div className="relative z-10">
                  <h3 className={`text-xl mb-1 ${theme.titleClass}`}>
                    {level.name}
                  </h3>
                  <p className={`text-sm mb-4 ${theme.subtitleClass}`}>
                    {level.subtitle}
                  </p>
                </div>

                {/* Details */}
                <div className={`relative z-10 space-y-2 text-sm ${theme.detailContainerClass}`}>
                  <div className="flex justify-between">
                    <span className={theme.detailLabelClass}>Amount Required:</span>
                    <span className={theme.detailValueClass}>{level.amountRequired}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme.detailLabelClass}>Commission per order:</span>
                    <span className={theme.detailValueClass}>{level.commission}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme.detailLabelClass}>Number of orders:</span>
                    <span className={theme.detailValueClass}>{level.orders}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
