import React, { useEffect, useState } from 'react';
import { Crown, Lock, TrendingUp, Users, Award, Star, Zap, Gift } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
const logoImage = new URL('../assets/image.png', import.meta.url).toString();
import { vipThemes, VipTheme, VipThemeKey, normalizeVipId } from '../constants/vipThemes';
import api from '../services/api';

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
  const [vipLevels, setVipLevels] = useState<VIPLevel[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.vipLevels();
        const levels = (res?.data?.levels || [])
          .filter((lvl: any) => String(lvl.id || lvl.name).toLowerCase() !== 'vip-0' && String(lvl.id || lvl.name).toLowerCase() !== 'vip0')
          .map((lvl: any) => {
          const key = normalizeVipId(lvl.id || lvl.name);
          const theme = vipThemes[key];
          return {
            id: key,
            name: theme.label,
            subtitle: theme.subtitle,
            amountRequired: `$${Number(lvl.amountRequired || 0).toLocaleString()}`,
            commission: `${Number(lvl.commissionRate || 0)}%`,
            orders: Number(lvl.numberOfOrders || 0),
            theme,
          } as VIPLevel;
        });
        // Keep display order high -> low
        levels.sort((a: any, b: any) => b.orders - a.orders);
        setVipLevels(levels);
      } catch {
        // Fallback minimal when API fails (avoid blank screen)
        const fallbackKeys: VipThemeKey[] = ['royal','svip','vip7','vip6','vip5','vip4','vip3','vip2','vip1'];
        setVipLevels(fallbackKeys.map((id) => ({
          id,
          name: vipThemes[id].label,
          subtitle: vipThemes[id].subtitle,
          amountRequired: '-',
          commission: '-',
          orders: 0,
          theme: vipThemes[id],
        })));
      }
    })();
  }, []);

  return (
    <div className="pb-20">
      {/* Logo */}
      <div className="bg-gray-100 py-4 px-6 text-center">
        <img src={logoImage} alt="Ashford" className="inline-block h-10 object-contain" />
      </div>

      {/* Banner */}
      <div className="px-4 pt-4">
        <div className="rounded-2xl overflow-hidden shadow-lg">
          <img 
            src={bannerImage} 
            alt="Luxury Product" 
            className="w-full h-40 object-cover"
          />
        </div>
      </div>

      {/* Advertisement Section */}
      <div className="px-4 pt-4">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">🎉 Special Promotion!</h3>
              <p className="text-xs opacity-90 leading-relaxed">
                Join now and get exclusive VIP benefits. Higher commission rates and more orders!
              </p>
            </div>
            <div className="ml-3">
              <Zap className="w-12 h-12 opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Membership Levels */}
      <div className="px-4 pt-5">
        <h2 className="text-gray-800 mb-3 text-center text-sm font-semibold">MEMBERSHIP LEVEL</h2>
        
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
