import { PlatformId, PlatformMeta } from '@/types';

export const PLATFORMS: Record<PlatformId, PlatformMeta> = {
  twitter: {
    id: 'twitter',
    name: 'X / Twitter',
    service: 'typefully',
    charLimit: 280,
    icon: 'Twitter',
    color: '#1DA1F2',
    accentBg: 'bg-sky-500/10',
    borderActive: 'border-sky-500/50 text-sky-400',
  },
  threads: {
    id: 'threads',
    name: 'Threads',
    service: 'typefully',
    charLimit: 500,
    icon: 'AtSign',
    color: '#FFFFFF',
    accentBg: 'bg-zinc-800/60',
    borderActive: 'border-zinc-300 text-white',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    service: 'buffer',
    charLimit: 3000,
    icon: 'Linkedin',
    color: '#0A66C2',
    accentBg: 'bg-blue-600/10',
    borderActive: 'border-blue-500/50 text-blue-400',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    service: 'buffer',
    charLimit: 2200,
    icon: 'Instagram',
    color: '#E1306C',
    accentBg: 'bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-purple-500/10',
    borderActive: 'border-pink-500/50 text-pink-400',
  },
};

export const ALL_PLATFORM_IDS: PlatformId[] = ['twitter', 'threads', 'linkedin', 'instagram'];
