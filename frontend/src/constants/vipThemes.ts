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
  badgeImage?: string;
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
    gradient: 'bg-gradient-to-br from-gray-900 via-yellow-900 to-black',
    badgeImage: royalVipImage,
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
    gradient: 'bg-gradient-to-br from-yellow-600 via-yellow-500 to-amber-600',
    badgeImage: ssvipImage,
    titleClass: 'text-white drop-shadow-lg tracking-wide',
    subtitleClass: 'text-white/90',
    detailContainerClass: 'text-white',
    detailLabelClass: 'text-blue-600',
    detailValueClass: 'text-white font-medium',
    chipBgClass: 'bg-white/20 backdrop-blur-sm',
    chipTextClass: 'text-white',
    idClass: 'text-white/80',
  },
  svip: {
    key: 'svip',
    label: 'SVIP',
    subtitle: 'Super member',
    gradient: 'bg-gradient-to-r from-gray-600 via-orange-400 to-orange-500',
    badgeImage: svipImage,
    titleClass: 'text-white drop-shadow-lg tracking-wide',
    subtitleClass: 'text-white/90',
    detailContainerClass: 'text-white',
    detailLabelClass: 'text-gray-800',
    detailValueClass: 'text-white font-medium',
    chipBgClass: 'bg-white/20 backdrop-blur-sm',
    chipTextClass: 'text-white',
    idClass: 'text-white/80',
  },
  vip7: {
    key: 'vip7',
    label: 'VIP 7',
    subtitle: 'Sapphire member',
    gradient: 'bg-gradient-to-r from-orange-400 via-pink-400 to-pink-500',
    badgeImage: vip7Image,
    titleClass: 'text-white drop-shadow-lg tracking-wide',
    subtitleClass: 'text-white/90',
    detailContainerClass: 'text-white',
    detailLabelClass: 'text-orange-100',
    detailValueClass: 'text-white font-medium',
    chipBgClass: 'bg-white/20 backdrop-blur-sm',
    chipTextClass: 'text-white',
    idClass: 'text-white/80',
  },
  vip6: {
    key: 'vip6',
    label: 'VIP 6',
    subtitle: 'Emerald member',
    gradient: 'bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600',
    badgeImage: vip6Image,
    titleClass: 'text-white drop-shadow-lg tracking-wide',
    subtitleClass: 'text-white/90',
    detailContainerClass: 'text-white',
    detailLabelClass: 'text-pink-100',
    detailValueClass: 'text-white font-medium',
    chipBgClass: 'bg-white/20 backdrop-blur-sm',
    chipTextClass: 'text-white',
    idClass: 'text-white/80',
  },
  vip5: {
    key: 'vip5',
    label: 'VIP 5',
    subtitle: 'Ruby member',
    gradient: 'bg-gradient-to-r from-blue-400 via-purple-400 to-purple-500',
    badgeImage: vip5Image,
    titleClass: 'text-white drop-shadow-lg tracking-wide',
    subtitleClass: 'text-white/90',
    detailContainerClass: 'text-white',
    detailLabelClass: 'text-blue-100',
    detailValueClass: 'text-white font-medium',
    chipBgClass: 'bg-white/20 backdrop-blur-sm',
    chipTextClass: 'text-white',
    idClass: 'text-white/80',
  },
  vip4: {
    key: 'vip4',
    label: 'VIP 4',
    subtitle: 'Platinum member',
    gradient: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-blue-500',
    badgeImage: vip4Image,
    titleClass: 'text-white drop-shadow-lg tracking-wide',
    subtitleClass: 'text-white/90',
    detailContainerClass: 'text-white',
    detailLabelClass: 'text-white/90',
    detailValueClass: 'text-white font-medium',
    chipBgClass: 'bg-white/20 backdrop-blur-sm',
    chipTextClass: 'text-white',
    idClass: 'text-white/80',
  },
  vip3: {
    key: 'vip3',
    label: 'VIP 3',
    subtitle: 'Diamond member',
    gradient: 'bg-gradient-to-br from-yellow-400 via-green-400 to-emerald-500',
    badgeImage: vip3Image,
    titleClass: 'text-white drop-shadow-lg tracking-wide',
    subtitleClass: 'text-white/90',
    detailContainerClass: 'text-white',
    detailLabelClass: 'text-lime-100',
    detailValueClass: 'text-white font-medium',
    chipBgClass: 'bg-white/20 backdrop-blur-sm',
    chipTextClass: 'text-white',
    idClass: 'text-white/80',
  },
  vip2: {
    key: 'vip2',
    label: 'VIP 2',
    subtitle: 'Gold member',
    gradient: 'bg-gradient-to-br from-orange-300 via-yellow-400 to-amber-500',
    badgeImage: vip2Image,
    titleClass: 'text-white drop-shadow-lg tracking-wide',
    subtitleClass: 'text-white/90',
    detailContainerClass: 'text-white',
    detailLabelClass: 'text-amber-900',
    detailValueClass: 'text-white font-medium',
    chipBgClass: 'bg-white/70',
    chipTextClass: 'text-amber-900',
    idClass: 'text-amber-900/80',
  },
  vip1: {
    key: 'vip1',
    label: 'VIP 1',
    subtitle: 'Silver member',
    gradient: 'bg-gradient-to-br from-gray-300 via-blue-300 to-blue-500',
    badgeImage: vip1Image,
    titleClass: 'text-white drop-shadow-lg tracking-wide',
    subtitleClass: 'text-white/90',
    detailContainerClass: 'text-white',
    detailLabelClass: 'text-white/90',
    detailValueClass: 'text-white font-medium',
    chipBgClass: 'bg-white/20 backdrop-blur-sm',
    chipTextClass: 'text-white',
    idClass: 'text-white/80',
  },
  vip0: {
    key: 'vip0',
    label: 'VIP 0',
    subtitle: 'New member',
    gradient: 'bg-gradient-to-br from-gray-200 to-gray-300',
    titleClass: 'text-gray-800',
    subtitleClass: 'text-gray-600',
    detailContainerClass: 'text-gray-700',
    detailLabelClass: 'text-gray-600',
    detailValueClass: 'text-gray-700 font-medium',
    chipBgClass: 'bg-white',
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
