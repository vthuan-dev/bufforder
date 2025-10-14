import { useState } from 'react';
import { Crown, Lock, TrendingUp, Users, Award, Star, Zap, Gift } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import royalVipImage from 'figma:asset/a9a63246575210f214e0ca2873cbfafd490af67f.png';
import ssvipImage from 'figma:asset/84c9dc04d54770d11a2606b50e396a6df404a0a7.png';
import svipImage from 'figma:asset/408e990231cb3dbb51a2ab33beb6e060741fd21c.png';
import vip7Image from 'figma:asset/5ab06a1c3c590aa59ee8358ae31c41a17d5bc499.png';
import vip6Image from 'figma:asset/72c3f1ef5f08743fa19d2b89e0f762ec2bed0dd9.png';
import vip5Image from 'figma:asset/0584538d413199f3ca74fa079ae8a3b97a18dce5.png';
import vip4Image from 'figma:asset/fe2f721ef7c7f5efe5264129cb18a86b649d7cda.png';
import vip3Image from 'figma:asset/84c9dc04d54770d11a2606b50e396a6df404a0a7.png';
import vip2Image from 'figma:asset/0584538d413199f3ca74fa079ae8a3b97a18dce5.png';
import vip1Image from 'figma:asset/b6671c303674fac37656942b12a467c76ac9e513.png';

interface VIPLevel {
  id: string;
  name: string;
  subtitle: string;
  amountRequired: string;
  commission: string;
  orders: number;
  gradient: string;
  hasImage?: boolean;
  badgeImage?: string;
}

interface HomePageProps {
  bannerImage: string;
}

export function HomePage({ bannerImage }: HomePageProps) {
  const vipLevels: VIPLevel[] = [
    {
      id: 'royal',
      name: 'ROYAL VIP',
      subtitle: 'Royal member',
      amountRequired: '$320,000',
      commission: '2.5%',
      orders: 330,
      gradient: 'bg-gradient-to-br from-gray-900 via-yellow-900 to-black',
      hasImage: true,
      badgeImage: royalVipImage,
    },
    {
      id: 'ssvip',
      name: 'SSVIP',
      subtitle: 'Super Supreme member',
      amountRequired: '$280,000',
      commission: '2.2%',
      orders: 300,
      gradient: 'bg-gradient-to-br from-yellow-600 via-yellow-500 to-amber-600',
      hasImage: true,
      badgeImage: ssvipImage,
    },
    {
      id: 'svip',
      name: 'SVIP',
      subtitle: 'Super member',
      amountRequired: '$260,000',
      commission: '2%',
      orders: 280,
      gradient: 'bg-gradient-to-r from-gray-600 via-orange-400 to-orange-500',
      hasImage: true,
      badgeImage: svipImage,
    },
    {
      id: 'vip7',
      name: 'VIP 7',
      subtitle: 'Sapphire member',
      amountRequired: '$200,000',
      commission: '1.8%',
      orders: 250,
      gradient: 'bg-gradient-to-r from-orange-400 via-pink-400 to-pink-500',
      hasImage: true,
      badgeImage: vip7Image
    },
    {
      id: 'vip6',
      name: 'VIP 6',
      subtitle: 'Emerald member',
      amountRequired: '$120,000',
      commission: '1.5%',
      orders: 220,
      gradient: 'bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600',
      hasImage: true,
      badgeImage: vip6Image,
    },
    {
      id: 'vip5',
      name: 'VIP 5',
      subtitle: 'Ruby member',
      amountRequired: '$80,000',
      commission: '1.2%',
      orders: 180,
      gradient: 'bg-gradient-to-r from-blue-400 via-purple-400 to-purple-500',
      hasImage: true,
      badgeImage: vip5Image,
    },
    {
      id: 'vip4',
      name: 'VIP 4',
      subtitle: 'Platinum member',
      amountRequired: '$60,000',
      commission: '0.9%',
      orders: 150,
      gradient: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-blue-500',
      hasImage: true,
      badgeImage: vip4Image,
    },
    {
      id: 'vip3',
      name: 'VIP 3',
      subtitle: 'Diamond member',
      amountRequired: '$30,000',
      commission: '0.7%',
      orders: 120,
      gradient: 'bg-gradient-to-br from-yellow-400 via-green-400 to-emerald-500',
      hasImage: true,
      badgeImage: vip3Image,
    },
    {
      id: 'vip2',
      name: 'VIP 2',
      subtitle: 'Gold member',
      amountRequired: '$10,000',
      commission: '0.5%',
      orders: 80,
      gradient: 'bg-gradient-to-br from-orange-300 via-yellow-400 to-amber-500',
      hasImage: true,
      badgeImage: vip2Image,
    },
    {
      id: 'vip1',
      name: 'VIP 1',
      subtitle: 'Silver member',
      amountRequired: '$5,000',
      commission: '0.3%',
      orders: 50,
      gradient: 'bg-gradient-to-br from-gray-300 via-blue-300 to-blue-500',
      hasImage: true,
      badgeImage: vip1Image,
    }
  ];

  return (
    <div className="pb-20">
      {/* Logo */}
      <div className="bg-gray-100 py-4 px-6 text-center">
        <h1 className="text-2xl tracking-wider text-gray-800">
          <span className="italic">A</span> ashford
        </h1>
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
          {vipLevels.map((level, index) => (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative overflow-hidden rounded-3xl ${level.gradient} p-6 text-white shadow-xl`}
            >
              {/* VIP Background Image - Watermark */}
              {level.hasImage && level.badgeImage && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-12 pointer-events-none">
                  <ImageWithFallback 
                    src={level.badgeImage} 
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
                {level.hasImage && level.badgeImage ? (
                  <div className="inline-flex items-center">
                    <div className="w-16 h-20 flex items-center justify-center">
                      <ImageWithFallback 
                        src={level.badgeImage} 
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
                <h3 className={`text-xl mb-1 ${
                  level.hasImage 
                    ? level.id === 'royal' 
                      ? 'text-yellow-300 drop-shadow-lg tracking-wide'
                      : 'text-white drop-shadow-lg tracking-wide'
                    : ''
                }`}>
                  {level.name}
                </h3>
                <p className={`text-sm mb-4 ${
                  level.hasImage 
                    ? level.id === 'royal'
                      ? 'text-yellow-100'
                      : 'text-white/90'
                    : 'opacity-90'
                }`}>
                  {level.subtitle}
                </p>
              </div>

              {/* Details */}
              <div className={`relative z-10 space-y-2 text-sm ${
                level.hasImage 
                  ? level.id === 'royal'
                    ? 'text-yellow-50'
                    : 'text-white'
                  : ''
              }`}>
                <div className="flex justify-between">
                  <span className={
                    level.hasImage 
                      ? level.id === 'royal'
                        ? 'text-yellow-200'
                        : level.id === 'ssvip'
                          ? 'text-blue-600'
                          : level.id === 'svip'
                            ? 'text-gray-800'
                            : level.id === 'vip7'
                              ? 'text-orange-100'
                              : level.id === 'vip6'
                                ? 'text-pink-100'
                                : level.id === 'vip5'
                                  ? 'text-blue-100'
                                  : level.id === 'vip4'
                                    ? 'text-white/90'
                                    : level.id === 'vip3'
                                      ? 'text-lime-100'
                                      : level.id === 'vip2'
                                        ? 'text-amber-900'
                                        : level.id === 'vip1'
                                          ? 'text-white/90'
                                          : 'opacity-90'
                      : 'opacity-90'
                  }>Amount Required:</span>
                  <span className={
                    level.hasImage 
                      ? level.id === 'royal'
                        ? 'text-yellow-300 font-medium'
                        : 'text-white font-medium'
                      : ''
                  }>{level.amountRequired}</span>
                </div>
                <div className="flex justify-between">
                  <span className={
                    level.hasImage 
                      ? level.id === 'royal'
                        ? 'text-yellow-200'
                        : level.id === 'ssvip'
                          ? 'text-blue-600'
                          : level.id === 'svip'
                            ? 'text-gray-800'
                            : level.id === 'vip7'
                              ? 'text-orange-100'
                              : level.id === 'vip6'
                                ? 'text-pink-100'
                                : level.id === 'vip5'
                                  ? 'text-blue-100'
                                  : level.id === 'vip4'
                                    ? 'text-white/90'
                                    : level.id === 'vip3'
                                      ? 'text-lime-100'
                                      : level.id === 'vip2'
                                        ? 'text-amber-900'
                                        : level.id === 'vip1'
                                          ? 'text-white/90'
                                          : 'opacity-90'
                      : 'opacity-90'
                  }>Commission per order:</span>
                  <span className={
                    level.hasImage 
                      ? level.id === 'royal'
                        ? 'text-yellow-300 font-medium'
                        : 'text-white font-medium'
                      : ''
                  }>{level.commission}</span>
                </div>
                <div className="flex justify-between">
                  <span className={
                    level.hasImage 
                      ? level.id === 'royal'
                        ? 'text-yellow-200'
                        : level.id === 'ssvip'
                          ? 'text-blue-600'
                          : level.id === 'svip'
                            ? 'text-gray-800'
                            : level.id === 'vip7'
                              ? 'text-orange-100'
                              : level.id === 'vip6'
                                ? 'text-pink-100'
                                : level.id === 'vip5'
                                  ? 'text-blue-100'
                                  : level.id === 'vip4'
                                    ? 'text-white/90'
                                    : level.id === 'vip3'
                                      ? 'text-lime-100'
                                      : level.id === 'vip2'
                                        ? 'text-amber-900'
                                        : level.id === 'vip1'
                                          ? 'text-white/90'
                                          : 'opacity-90'
                      : 'opacity-90'
                  }>Number of orders:</span>
                  <span className={
                    level.hasImage 
                      ? level.id === 'royal'
                        ? 'text-yellow-300 font-medium'
                        : 'text-white font-medium'
                      : ''
                  }>{level.orders}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
