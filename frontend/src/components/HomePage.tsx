import { useEffect, useState, useRef } from 'react';
import { Crown, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
const logoImage = new URL('../assets/image.png', import.meta.url).toString();
const videoAds = new URL('../assets/video/ads.mp4', import.meta.url).toString();
import { vipThemes, VipTheme, VipThemeKey, normalizeVipId } from '../constants/vipThemes';
import api from '../services/api';

const bannerImages = [
  'https://i.ibb.co/84zLyNTL/istockphoto-1135934992-612x612.jpg',
  'https://i.ibb.co/Cs4817KP/omega-vs-rolex-khi-cuu-hoang-thach-thuc-tan-vuong.jpg',
  'https://i.ibb.co/7JD8hGg3/omega-vs-rolex-khi-cuu-hoang-thach-thuc-tan-vuong-1.jpg'
];

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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Force video to play
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.log('Video autoplay failed:', err);
      });
    }
  }, []);

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
              commission: `${(Number(lvl.commissionRate || 0) * 100).toFixed(1)}%`,
              orders: Number(lvl.numberOfOrders || 0),
              theme,
            } as VIPLevel;
          });
        // Keep display order high -> low
        levels.sort((a: any, b: any) => b.orders - a.orders);
        setVipLevels(levels);
      } catch {
        // Fallback minimal when API fails (avoid blank screen)
        const fallbackKeys: VipThemeKey[] = ['royal', 'svip', 'vip7', 'vip6', 'vip5', 'vip4', 'vip3', 'vip2', 'vip1'];
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

      {/* Video Advertisement */}
      <div className="px-4 pt-4">
        <div className="overflow-hidden shadow-lg bg-gray-200">
          <video
            ref={videoRef}
            src={videoAds}
            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Crect fill='%23f3f4f6' width='400' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%239ca3af'%3ELoading video...%3C/text%3E%3C/svg%3E"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            className="w-full h-48 object-cover"
            style={{ pointerEvents: 'none' }}
            onLoadedData={() => {
              videoRef.current?.play();
            }}
          />
        </div>
      </div>

      {/* Banner Images - Vertical Stack */}
      <div className="px-4 pt-4 space-y-3">
        {bannerImages.map((img, index) => (
          <div key={index} className="overflow-hidden shadow-lg">
            <img
              src={img}
              alt={`Banner ${index + 1}`}
              className="w-full h-40 object-cover"
            />
          </div>
        ))}
      </div>

      {/* Membership Levels */}
      <div className="px-4 pt-5">
        <h2 className="text-gray-900 mb-4 text-center text-xl font-extrabold tracking-wider uppercase" style={{ letterSpacing: '0.15em' }}>
          MEMBERSHIP LEVEL
        </h2>

        <div className="space-y-3">
          {vipLevels.map((level, index) => {
            const theme = level.theme;
            const hasBadge = Boolean(theme.badgeImage);

            return (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`relative overflow-hidden rounded-2xl ${theme.gradient} p-4 ${theme.textColorClass || 'text-white'} shadow-lg`}
                style={{
                  backgroundColor: theme.bgColor || undefined,
                  backgroundImage: theme.backgroundPattern || undefined,
                  backgroundSize: theme.backgroundPattern ? '20px 20px' : undefined,
                }}
              >
                {/* VIP Background Image - Watermark */}
                {hasBadge && (
                  <div className={`absolute right-0 top-1/2 -translate-y-1/2 ${theme.watermarkOpacity || 'opacity-60'} pointer-events-none`}>
                    <img
                      src={theme.badgeImage!}
                      alt={`${level.name} Background`}
                      className="w-36 h-36 object-contain brightness-125 contrast-110 rounded-2xl"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Lock Icon */}
                <div className="absolute top-3 right-3 p-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                  <Lock className="w-4 h-4" />
                </div>

                {/* VIP Icon or Badge */}
                <div className="relative z-10 mb-2">
                  {hasBadge ? (
                    <div className="inline-flex items-center">
                      <div className={`${theme.badgeSize || 'w-12 h-14'} flex items-center justify-center`}>
                        <img
                          src={theme.badgeImage!}
                          alt={`${level.name} Badge`}
                          className="w-full h-full object-contain drop-shadow-2xl rounded-xl"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="inline-flex p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Crown className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {/* VIP Title */}
                <div className="relative z-10">
                  <h3 className={`text-lg mb-0.5 ${theme.titleClass}`}>
                    {level.name}
                  </h3>
                  <p className={`text-xs mb-3 ${theme.subtitleClass}`}>
                    {level.subtitle}
                  </p>
                </div>

                {/* Details */}
                <div className={`relative z-10 space-y-1.5 text-xs ${theme.detailContainerClass}`}>
                  <div className="flex gap-2">
                    <span className={theme.detailLabelClass}>Amount Required:</span>
                    <span className={theme.detailValueClass}>{level.amountRequired}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className={theme.detailLabelClass}>Commission per order:</span>
                    <span className={theme.detailValueClass}>{level.commission}</span>
                  </div>
                  <div className="flex gap-2">
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
