export type VipThemeKey =
  | 'royal'
  | 'ssvip'
  | 'svip'
  | 'vip7'
  | 'vip6'
  | 'vip5'
  | 'vip4'
  | 'vip3'
  | 'vip2'
  | 'vip1'
  | 'vip0';

export interface VipTheme {
  key: VipThemeKey;
  label: string;
  subtitle: string;
  gradient: string;
  bgColor?: string;
  backgroundPattern?: string; // CSS background pattern for diversity
  badgeImage?: string;
  badgeSize?: string;
  watermarkOpacity?: string;
  textColorClass?: string;
  // Actual color values for inline styles (production-safe)
  titleColor?: string;
  subtitleColor?: string;
  idColor?: string;
  detailLabelColor?: string;
  detailValueColor?: string;
  titleClass: string;
  subtitleClass: string;
  detailContainerClass: string;
  detailLabelClass: string;
  detailValueClass: string;
  chipBgClass: string;
  chipTextClass: string;
  idClass: string;
}

export const DEFAULT_VIP_THEME_KEY: VipThemeKey = 'vip0';

export const vipThemes: Record<VipThemeKey, VipTheme> = {
  royal: {
    key: 'royal',
    label: 'ROYAL VIP',
    subtitle: 'Royal member',
    gradient: 'bg-[#11141d]',
    bgColor: '#11141d',
    backgroundPattern: 'radial-gradient(circle at 30% 30%, rgba(252, 211, 77, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(252, 211, 77, 0.1) 0%, transparent 50%), repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(252, 211, 77, 0.03) 10px, rgba(252, 211, 77, 0.03) 20px)',
    badgeImage: 'https://i.ibb.co/SwN0tHBt/Screenshot-2026-01-19-161004-removebg-preview.png',
    titleColor: '#fcd34d',
    subtitleColor: '#fef3c7',
    idColor: '#fde68a',
    detailLabelColor: '#fde68a',
    detailValueColor: '#fcd34d',
    titleClass: 'text-yellow-300 drop-shadow-lg tracking-wide',
    subtitleClass: 'text-yellow-100',
    detailContainerClass: 'text-yellow-50',
    detailLabelClass: 'text-yellow-200',
    detailValueClass: 'text-yellow-300 font-medium',
    chipBgClass: 'bg-yellow-50/20 backdrop-blur-sm',
    chipTextClass: 'text-yellow-100',
    idClass: 'text-yellow-200',
  },
  ssvip: {
    key: 'ssvip',
    label: 'SSVIP',
    subtitle: 'Super Supreme member',
    gradient: 'bg-[#8f7193]',
    bgColor: '#8f7193',
    badgeImage: 'https://i.pinimg.com/1200x/e7/23/04/e723045f8dc4164ab2ab530bf1bd452f.jpg',
    watermarkOpacity: 'opacity-50',
    titleClass: 'text-white drop-shadow-lg tracking-wide',
    subtitleClass: 'text-white/90',
    detailContainerClass: 'text-white',
    detailLabelClass: 'text-purple-100',
    detailValueClass: 'text-white font-medium',
    chipBgClass: 'bg-white/20 backdrop-blur-sm',
    chipTextClass: 'text-white',
    idClass: 'text-white/80',
  },
  svip: {
    key: 'svip',
    label: 'SVIP',
    subtitle: 'Super member',
    gradient: 'bg-[#ffcdce]',
    bgColor: '#ffcdce',
    badgeImage: 'https://i.ibb.co/tTZvc2zV/4f3dc0df-2c6d-4906-b620-8987eea16d01-removebg-preview.png',
    watermarkOpacity: 'opacity-40',
    textColorClass: 'text-gray-800',
    titleClass: 'text-gray-800 drop-shadow-lg tracking-wide',
    subtitleClass: 'text-gray-700',
    detailContainerClass: 'text-gray-800',
    detailLabelClass: 'text-gray-700',
    detailValueClass: 'text-gray-900 font-medium',
    chipBgClass: 'bg-white/50 backdrop-blur-sm',
    chipTextClass: 'text-gray-800',
    idClass: 'text-gray-700',
  },
  vip7: {
    key: 'vip7',
    label: 'VIP 7',
    subtitle: 'Sapphire member',
    gradient: 'bg-[#000000]',
    bgColor: '#000000',
    backgroundPattern: 'radial-gradient(circle at 20% 50%, rgba(255, 165, 0, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 165, 0, 0.15) 0%, transparent 50%)',
    badgeImage: 'https://i.ibb.co/0p10LyKm/Screenshot-2026-01-19-160458-removebg-preview.png',
    titleClass: 'text-orange-300 drop-shadow-lg tracking-wide',
    subtitleClass: 'text-orange-100',
    detailContainerClass: 'text-orange-50',
    detailLabelClass: 'text-orange-200',
    detailValueClass: 'text-orange-300 font-medium',
    chipBgClass: 'bg-orange-50/20 backdrop-blur-sm',
    chipTextClass: 'text-orange-100',
    idClass: 'text-orange-200',
  },
  vip6: {
    key: 'vip6',
    label: 'VIP 6',
    subtitle: 'Emerald member',
    gradient: 'bg-[#000000]',
    bgColor: '#000000',
    backgroundPattern: 'repeating-linear-gradient(45deg, #000 0px, #000 10px, rgba(236, 72, 153, 0.15) 10px, rgba(236, 72, 153, 0.15) 20px)',
    badgeImage: 'https://i.ibb.co/ynngjckq/cb53563fbaa0990183587d1c663c6e8e-removebg-preview.png',
    titleClass: 'text-pink-300 drop-shadow-lg tracking-wide',
    subtitleClass: 'text-pink-100',
    detailContainerClass: 'text-pink-50',
    detailLabelClass: 'text-pink-200',
    detailValueClass: 'text-pink-300 font-medium',
    chipBgClass: 'bg-pink-50/20 backdrop-blur-sm',
    chipTextClass: 'text-pink-100',
    idClass: 'text-pink-200',
  },
  vip5: {
    key: 'vip5',
    label: 'VIP 5',
    subtitle: 'Ruby member',
    gradient: 'bg-[#000000]',
    bgColor: '#000000',
    backgroundPattern: 'radial-gradient(circle, rgba(250, 204, 21, 0.2) 2px, transparent 2px)',
    badgeImage: 'https://i.ibb.co/8DgbQwM6/9464405-36184-removebg-preview.png',
    watermarkOpacity: 'opacity-40',
    titleClass: 'text-yellow-300 drop-shadow-lg tracking-wide',
    subtitleClass: 'text-yellow-100',
    detailContainerClass: 'text-yellow-50',
    detailLabelClass: 'text-yellow-200',
    detailValueClass: 'text-yellow-300 font-medium',
    chipBgClass: 'bg-yellow-50/20 backdrop-blur-sm',
    chipTextClass: 'text-yellow-100',
    idClass: 'text-yellow-200',
  },
  vip4: {
    key: 'vip4',
    label: 'VIP 4',
    subtitle: 'Platinum member',
    gradient: 'bg-[#000000]',
    bgColor: '#000000',
    backgroundPattern: 'linear-gradient(135deg, rgba(34, 211, 238, 0.15) 25%, transparent 25%), linear-gradient(225deg, rgba(34, 211, 238, 0.15) 25%, transparent 25%), linear-gradient(45deg, rgba(34, 211, 238, 0.15) 25%, transparent 25%), linear-gradient(315deg, rgba(34, 211, 238, 0.15) 25%, transparent 25%)',
    badgeImage: 'https://i.ibb.co/j9pVzWQT/download-removebg-preview.png',
    watermarkOpacity: 'opacity-40',
    titleClass: 'text-cyan-300 drop-shadow-lg tracking-wide',
    subtitleClass: 'text-cyan-100',
    detailContainerClass: 'text-cyan-50',
    detailLabelClass: 'text-cyan-200',
    detailValueClass: 'text-cyan-300 font-medium',
    chipBgClass: 'bg-cyan-50/20 backdrop-blur-sm',
    chipTextClass: 'text-cyan-100',
    idClass: 'text-cyan-200',
  },
  vip3: {
    key: 'vip3',
    label: 'VIP 3',
    subtitle: 'Diamond member',
    gradient: 'bg-[#000000]',
    bgColor: '#000000',
    backgroundPattern: 'linear-gradient(rgba(52, 211, 153, 0.15) 2px, transparent 2px), linear-gradient(90deg, rgba(52, 211, 153, 0.15) 2px, transparent 2px)',
    badgeImage: 'https://i.ibb.co/S7f9Frc2/ce10fd233b14dae978d1a3de4a86461c-removebg-preview.png',
    watermarkOpacity: 'opacity-40',
    titleClass: 'text-emerald-300 drop-shadow-lg tracking-wide',
    subtitleClass: 'text-emerald-100',
    detailContainerClass: 'text-emerald-50',
    detailLabelClass: 'text-emerald-200',
    detailValueClass: 'text-emerald-300 font-medium',
    chipBgClass: 'bg-emerald-50/20 backdrop-blur-sm',
    chipTextClass: 'text-emerald-100',
    idClass: 'text-emerald-200',
  },
  vip2: {
    key: 'vip2',
    label: 'VIP 2',
    subtitle: 'Gold member',
    gradient: 'bg-[#000000]',
    bgColor: '#000000',
    backgroundPattern: 'repeating-linear-gradient(0deg, #000 0px, #000 3px, rgba(192, 132, 252, 0.2) 3px, rgba(192, 132, 252, 0.2) 6px), repeating-linear-gradient(90deg, #000 0px, #000 3px, rgba(192, 132, 252, 0.2) 3px, rgba(192, 132, 252, 0.2) 6px)',
    badgeImage: 'https://i.ibb.co/390ZRJNM/efcb3634518dc934e26ad736425f1165-removebg-preview.png',
    watermarkOpacity: 'opacity-40',
    titleClass: 'text-purple-300 drop-shadow-lg tracking-wide',
    subtitleClass: 'text-purple-100',
    detailContainerClass: 'text-purple-50',
    detailLabelClass: 'text-purple-200',
    detailValueClass: 'text-purple-300 font-medium',
    chipBgClass: 'bg-purple-50/20 backdrop-blur-sm',
    chipTextClass: 'text-purple-100',
    idClass: 'text-purple-200',
  },
  vip1: {
    key: 'vip1',
    label: 'VIP 1',
    subtitle: 'Silver member',
    gradient: 'bg-[#000000]',
    bgColor: '#000000',
    backgroundPattern: 'radial-gradient(ellipse at center, rgba(251, 191, 36, 0.2) 0%, transparent 70%)',
    badgeImage: 'https://i.ibb.co/1GXsJbGM/12f1a146340feafaf4da8126aa593aae-1-removebg-preview.png',
    badgeSize: 'w-16 h-18',
    watermarkOpacity: 'opacity-40',
    titleClass: 'text-amber-300 drop-shadow-lg tracking-wide',
    subtitleClass: 'text-amber-100',
    detailContainerClass: 'text-amber-50',
    detailLabelClass: 'text-amber-200',
    detailValueClass: 'text-amber-300 font-medium',
    chipBgClass: 'bg-amber-50/20 backdrop-blur-sm',
    chipTextClass: 'text-amber-100',
    idClass: 'text-amber-200',
  },
  vip0: {
    key: 'vip0',
    label: 'VIP 0',
    subtitle: 'New member',
    gradient: 'bg-[#e5e7eb]',
    bgColor: '#e5e7eb',
    // No badge image for VIP 0
    titleColor: '#1f2937',
    subtitleColor: '#4b5563',
    idColor: '#6b7280',
    detailLabelColor: '#6b7280',
    detailValueColor: '#374151',
    titleClass: 'text-gray-800 drop-shadow-lg tracking-wide',
    subtitleClass: 'text-gray-600',
    detailContainerClass: 'text-gray-700',
    detailLabelClass: 'text-gray-600',
    detailValueClass: 'text-gray-700 font-medium',
    chipBgClass: 'bg-white/50 backdrop-blur-sm',
    chipTextClass: 'text-gray-700',
    idClass: 'text-gray-600',
  },
};

export function normalizeVipId(raw?: string): VipThemeKey {
  if (!raw) return DEFAULT_VIP_THEME_KEY;
  const value = raw.toLowerCase().trim();

  if (value.includes('royal')) return 'royal';
  if (value.includes('ssvip')) return 'ssvip';
  if (value.includes('svip')) return 'svip';

  const match = value.match(/vip\s*[-_]?(\d+)/);
  if (match) {
    const key = `vip${match[1]}` as VipThemeKey;
    if (vipThemes[key]) return key;
  }

  const sanitized = value.replace(/[^a-z0-9]/g, '') as VipThemeKey;
  if (vipThemes[sanitized]) return sanitized;

  return DEFAULT_VIP_THEME_KEY;
}
