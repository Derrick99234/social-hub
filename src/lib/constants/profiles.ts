import { SocialProfile } from '@/types';

export const DEFAULT_PROFILES: SocialProfile[] = [
  {
    id: 'prof_twitter_alex',
    name: 'Alex Founder',
    handle: '@alex_founder',
    network: 'twitter',
    service: 'typefully',
    profileType: 'personal',
    isConnected: true,
  },
  {
    id: 'prof_threads_alex',
    name: 'Alex Founder',
    handle: '@alex_founder',
    network: 'threads',
    service: 'typefully',
    profileType: 'personal',
    isConnected: true,
  },
  {
    id: 'prof_linkedin_alex',
    name: 'Alex Founder',
    handle: 'Founder & CEO (Personal Profile)',
    network: 'linkedin',
    service: 'buffer',
    profileType: 'personal',
    isConnected: true,
  },
  {
    id: 'prof_linkedin_company',
    name: 'SocialHub AI',
    handle: 'Company Organization Page',
    network: 'linkedin',
    service: 'buffer',
    profileType: 'page',
    isConnected: true,
  },
  {
    id: 'prof_instagram_brand',
    name: 'Social Hub',
    handle: '@socialcontenthub',
    network: 'instagram',
    service: 'buffer',
    profileType: 'business',
    isConnected: true,
  },
];
