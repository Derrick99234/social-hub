import { PlatformId } from '@/types';
import { getCachedProfiles } from './profileSync';

interface DispatchOptions {
  postId: string;
  channels: PlatformId[];
  content: string;
  scheduledAt?: string | null;
  mediaUrls?: string[];
  profileIds?: string[];
}

export interface DispatchResult {
  channel: PlatformId;
  profileId?: string;
  profileName?: string;
  profileHandle?: string;
  profileAvatar?: string;
  service: 'typefully' | 'buffer';
  success: boolean;
  status: 'success' | 'failed' | 'simulated';
  externalId?: string;
  externalUrl?: string;
  error?: string;
  payloadSent?: Record<string, unknown>;
  responseReceived?: Record<string, unknown>;
}

/**
 * Resolves the appropriate Buffer token for a given channel/profile ID
 */
async function getBufferTokenForChannel(channelId?: string): Promise<string> {
  const allTokens = (process.env.BUFFER_ACCESS_TOKENS || process.env.BUFFER_ACCESS_TOKEN || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  if (allTokens.length <= 1) return allTokens[0] || '';
  if (!channelId) return allTokens[0];

  // 1. Check memory cache populated by profileSync
  if (global.__channelTokenMap && global.__channelTokenMap[channelId]) {
    return global.__channelTokenMap[channelId];
  }

  // 2. Known mapping fallback based on verified account structures
  const token2Channels = [
    '6a70883699afb44349f2872f', // OneRep Facebook
    '6a180d02c687a22dd43511fe', // onerep_ai Twitter
    '6a180cc3c687a22dd4351153', // onerepai Instagram
  ];
  if (token2Channels.includes(channelId) && allTokens[1]) {
    return allTokens[1];
  }

  return allTokens[0];
}

/**
 * Dispatches content to Typefully API v2 (handles X / Twitter & Threads)
 */
async function dispatchToTypefully(
  content: string,
  scheduledAt?: string | null,
  channels: PlatformId[] = ['twitter'],
  profileIds?: string[]
): Promise<DispatchResult[]> {
  const apiKey = process.env.TYPEFULLY_API_KEY;
  const isSimulated = !apiKey || apiKey.includes('your_') || apiKey.trim() === '';

  const results: DispatchResult[] = [];
  const targetChannels = channels.filter((c) => c === 'twitter' || c === 'threads');

  if (targetChannels.length === 0) return results;

  const allProfiles = getCachedProfiles() || [];
  const profileMap = new Map(allProfiles.map((p) => [p.id, p]));

  if (isSimulated) {
    for (const channel of targetChannels) {
      const matchedProfileId = profileIds?.find((id) => id.includes(`tf_${channel}`));
      const matched = matchedProfileId
        ? profileMap.get(matchedProfileId)
        : allProfiles.find((p) => p.network === channel && p.service === 'typefully');

      results.push({
        channel,
        profileId: matched?.id || matchedProfileId,
        profileName: matched?.name || 'Olatunbosun Olashubomi',
        profileHandle: matched?.handle || '@Derrick9923_1',
        profileAvatar: matched?.avatarUrl,
        service: 'typefully',
        success: true,
        status: 'simulated',
        externalId: `sim_tf_${Math.floor(100000 + Math.random() * 900000)}`,
        externalUrl: 'https://typefully.com',
        payloadSent: { content, scheduledAt, channel },
        responseReceived: {
          simulated: true,
          message: 'Simulated Typefully v2 Draft (No live API key configured)',
          timestamp: new Date().toISOString(),
        },
      });
    }
    return results;
  }

  try {
    // 1. Resolve Social Set ID
    let socialSetId = process.env.TYPEFULLY_SOCIAL_SET_ID;
    if (!socialSetId) {
      const setsRes = await fetch('https://api.typefully.com/v2/social-sets', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (setsRes.ok) {
        const setsData = await setsRes.json();
        if (setsData.results && setsData.results[0]) {
          socialSetId = String(setsData.results[0].id);
        }
      }
    }

    if (!socialSetId) {
      socialSetId = '340219'; // Fallback to verified user social set ID
    }

    // 2. Prepare payload for Typefully v2
    const platforms: Record<string, { enabled: boolean; posts: { text: string }[] }> = {};
    if (targetChannels.includes('twitter')) {
      platforms.x = {
        enabled: true,
        posts: [{ text: content }],
      };
    }
    if (targetChannels.includes('threads')) {
      platforms.threads = {
        enabled: true,
        posts: [{ text: content }],
      };
    }

    // Typefully v2 publish directive:
    // publish_at: "now" triggers immediate posting.
    // publish_at: "<ISO string>" triggers scheduled auto-publish.
    const payload: Record<string, unknown> = {
      platforms,
      publish_at: scheduledAt ? new Date(scheduledAt).toISOString() : 'now',
    };

    const res = await fetch(`https://api.typefully.com/v2/social-sets/${socialSetId}/drafts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMessage =
        responseData?.error?.message ||
        responseData?.message ||
        `Typefully HTTP ${res.status}: ${res.statusText}`;

      for (const channel of targetChannels) {
        const matchedProfileId = profileIds?.find((id) => id.includes(`tf_${channel}`));
        const matched = matchedProfileId
          ? profileMap.get(matchedProfileId)
          : allProfiles.find((p) => p.network === channel && p.service === 'typefully');

        results.push({
          channel,
          profileId: matched?.id || matchedProfileId,
          profileName: matched?.name || 'Olatunbosun Olashubomi',
          profileHandle: matched?.handle || '@Derrick9923_1',
          profileAvatar: matched?.avatarUrl,
          service: 'typefully',
          success: false,
          status: 'failed',
          error: errorMessage,
          payloadSent: payload,
          responseReceived: responseData,
        });
      }
    } else {
      const draftId = responseData?.id?.toString() || `tf_${Date.now()}`;
      const draftUrl =
        responseData?.x_published_url ||
        responseData?.private_url ||
        `https://typefully.com/?d=${draftId}&a=${socialSetId}`;

      for (const channel of targetChannels) {
        const matchedProfileId = profileIds?.find((id) => id.includes(`tf_${channel}`));
        const matched = matchedProfileId
          ? profileMap.get(matchedProfileId)
          : allProfiles.find((p) => p.network === channel && p.service === 'typefully');

        results.push({
          channel,
          profileId: matched?.id || matchedProfileId,
          profileName: matched?.name || 'Olatunbosun Olashubomi',
          profileHandle: matched?.handle || '@Derrick9923_1',
          profileAvatar: matched?.avatarUrl,
          service: 'typefully',
          success: true,
          status: 'success',
          externalId: draftId,
          externalUrl: draftUrl,
          payloadSent: payload,
          responseReceived: responseData,
        });
      }
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown Typefully network error';
    for (const channel of targetChannels) {
      const matchedProfileId = profileIds?.find((id) => id.includes(`tf_${channel}`));
      const matched = matchedProfileId
        ? profileMap.get(matchedProfileId)
        : allProfiles.find((p) => p.network === channel && p.service === 'typefully');

      results.push({
        channel,
        profileId: matched?.id || matchedProfileId,
        profileName: matched?.name || 'Olatunbosun Olashubomi',
        profileHandle: matched?.handle || '@Derrick9923_1',
        profileAvatar: matched?.avatarUrl,
        service: 'typefully',
        success: false,
        status: 'failed',
        error: errorMessage,
      });
    }
  }

  return results;
}

/**
 * Dispatches content to Buffer GraphQL API (handles LinkedIn, Instagram, etc.)
 */
async function dispatchToBuffer(
  content: string,
  scheduledAt?: string | null,
  mediaUrls?: string[],
  channels: PlatformId[] = ['linkedin'],
  profileIds?: string[]
): Promise<DispatchResult[]> {
  const linkedinProfileId = process.env.BUFFER_LINKEDIN_PROFILE_ID;
  const instagramProfileId = process.env.BUFFER_INSTAGRAM_PROFILE_ID;

  const targetChannels = channels.filter((c) => c === 'linkedin' || c === 'instagram');
  const results: DispatchResult[] = [];

  const allProfiles = getCachedProfiles() || [];
  const profileMap = new Map(allProfiles.map((p) => [p.id, p]));

  // Determine all target Buffer profile IDs (length 24 and not starting with tf_)
  const bufferProfileIds = (profileIds || []).filter((id) => id.length === 24 && !id.startsWith('tf_'));

  interface BufferTarget {
    profileId: string;
    channel: PlatformId;
    profileName?: string;
    profileHandle?: string;
    profileAvatar?: string;
  }

  const dispatchTargets: BufferTarget[] = [];

  if (bufferProfileIds.length > 0) {
    for (const pId of bufferProfileIds) {
      const matched = profileMap.get(pId);
      let resolvedChannel: PlatformId;
      if (matched?.network) {
        resolvedChannel = matched.network;
      } else if (pId === linkedinProfileId) {
        resolvedChannel = 'linkedin';
      } else if (pId === instagramProfileId) {
        resolvedChannel = 'instagram';
      } else {
        resolvedChannel = targetChannels.find((c) => c === 'instagram') ? 'instagram' : 'linkedin';
      }

      dispatchTargets.push({
        profileId: pId,
        channel: resolvedChannel,
        profileName: matched?.name,
        profileHandle: matched?.handle,
        profileAvatar: matched?.avatarUrl,
      });
    }
  } else {
    for (const channel of targetChannels) {
      const fallbackId = channel === 'linkedin' ? linkedinProfileId : instagramProfileId;
      if (fallbackId) {
        const matched = profileMap.get(fallbackId);
        dispatchTargets.push({
          profileId: fallbackId,
          channel,
          profileName: matched?.name,
          profileHandle: matched?.handle,
          profileAvatar: matched?.avatarUrl,
        });
      }
    }
  }

  if (dispatchTargets.length === 0) return results;

  for (const target of dispatchTargets) {
    const { profileId, channel, profileName, profileHandle, profileAvatar } = target;
    const token = await getBufferTokenForChannel(profileId);
    const isSimulated = !token || token.includes('your_') || token.trim() === '';

    if (isSimulated || !profileId || profileId.includes('your_')) {
      results.push({
        channel,
        profileId,
        profileName,
        profileHandle,
        profileAvatar,
        service: 'buffer',
        success: true,
        status: 'simulated',
        externalId: `sim_buf_${Math.floor(100000 + Math.random() * 900000)}`,
        externalUrl: 'https://buffer.com',
        payloadSent: { channel, profileId, content, scheduledAt },
        responseReceived: {
          simulated: true,
          message: `Simulated Buffer dispatch to ${channel} (No live token/profile configured)`,
          timestamp: new Date().toISOString(),
        },
      });
      continue;
    }

    try {
      const graphqlQuery = `
        mutation CreatePost($input: CreatePostInput!) {
          createPost(input: $input) {
            ... on PostActionSuccess {
              post {
                id
                status
              }
            }
            ... on InvalidInputError {
              message
            }
            ... on LimitReachedError {
              message
            }
            ... on UnexpectedError {
              message
            }
          }
        }
      `;

      // Buffer GraphQL CreatePostInput requirements:
      // - schedulingType: "automatic"
      // - needsApproval: false
      // - mode: "customScheduled" | "shareNow"
      // - assets: [{ image: { url } }]
      // - metadata: { instagram: { type: "post", shouldShareToFeed: true } } for Instagram
      const inputPayload: Record<string, unknown> = {
        channelId: profileId,
        text: content,
        schedulingType: 'automatic',
        needsApproval: false,
        mode: scheduledAt ? 'customScheduled' : 'shareNow',
        dueAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        saveToDraft: false,
      };

      if (mediaUrls && mediaUrls.length > 0) {
        inputPayload.assets = mediaUrls.map((url) => ({
          image: { url },
        }));
      }

      if (channel === 'instagram') {
        inputPayload.metadata = {
          instagram: {
            type: 'post',
            shouldShareToFeed: true,
          },
        };
      }

      const res = await fetch('https://api.buffer.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: graphqlQuery,
          variables: { input: inputPayload },
        }),
      });

      const responseData = await res.json().catch(() => ({}));
      const payloadData = responseData?.data?.createPost;

      if (!res.ok || responseData?.errors) {
        const errorMsg =
          responseData?.errors?.[0]?.message ||
          `Buffer GraphQL HTTP ${res.status}: ${res.statusText}`;
        results.push({
          channel,
          profileId,
          profileName,
          profileHandle,
          profileAvatar,
          service: 'buffer',
          success: false,
          status: 'failed',
          error: errorMsg,
          payloadSent: inputPayload,
          responseReceived: responseData,
        });
      } else if (payloadData?.post?.id) {
        results.push({
          channel,
          profileId,
          profileName,
          profileHandle,
          profileAvatar,
          service: 'buffer',
          success: true,
          status: 'success',
          externalId: payloadData.post.id,
          externalUrl: 'https://buffer.com',
          payloadSent: inputPayload,
          responseReceived: responseData,
        });
      } else {
        const errorMsg =
          payloadData?.message || 'Buffer did not return a created post ID';
        results.push({
          channel,
          profileId,
          profileName,
          profileHandle,
          profileAvatar,
          service: 'buffer',
          success: false,
          status: 'failed',
          error: errorMsg,
          payloadSent: inputPayload,
          responseReceived: responseData,
        });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown Buffer network error';
      results.push({
        channel,
        profileId,
        profileName,
        profileHandle,
        profileAvatar,
        service: 'buffer',
        success: false,
        status: 'failed',
        error: errorMessage,
      });
    }
  }

  return results;
}

/**
 * 1-Click Multi-Channel Dispatcher
 * Routes:
 *  - X / Twitter & Threads -> Typefully API v2
 *  - LinkedIn & Instagram -> Buffer GraphQL API
 */
export async function executeMultiChannelDispatch(options: DispatchOptions): Promise<DispatchResult[]> {
  const { channels, content, scheduledAt, mediaUrls, profileIds } = options;

  const typefullyChannels = channels.filter((c) => c === 'twitter' || c === 'threads');
  const bufferChannels = channels.filter((c) => c === 'linkedin' || c === 'instagram');

  const [typefullyResults, bufferResults] = await Promise.all([
    typefullyChannels.length > 0
      ? dispatchToTypefully(content, scheduledAt, typefullyChannels, profileIds)
      : Promise.resolve([]),
    bufferChannels.length > 0
      ? dispatchToBuffer(content, scheduledAt, mediaUrls, bufferChannels, profileIds)
      : Promise.resolve([]),
  ]);

  return [...typefullyResults, ...bufferResults];
}
