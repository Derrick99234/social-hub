import { PlatformId } from '@/types';

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
 * Dispatches content to Typefully API v2 (handles X / Twitter & Threads)
 */
async function dispatchToTypefully(
  content: string,
  scheduledAt?: string | null,
  channels: PlatformId[] = ['twitter']
): Promise<DispatchResult[]> {
  const apiKey = process.env.TYPEFULLY_API_KEY;
  const isSimulated = !apiKey || apiKey.includes('your_') || apiKey.trim() === '';

  const results: DispatchResult[] = [];
  const targetChannels = channels.filter((c) => c === 'twitter' || c === 'threads');

  if (targetChannels.length === 0) return results;

  if (isSimulated) {
    for (const channel of targetChannels) {
      results.push({
        channel,
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
      socialSetId = '340219'; // Fallback to discovered user set ID
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

    const payload: Record<string, unknown> = { platforms };
    if (scheduledAt) {
      payload.scheduled_date = new Date(scheduledAt).toISOString();
    }

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
      for (const channel of targetChannels) {
        results.push({
          channel,
          service: 'typefully',
          success: false,
          status: 'failed',
          error: responseData?.error?.message || `Typefully HTTP ${res.status}: ${res.statusText}`,
          payloadSent: payload,
          responseReceived: responseData,
        });
      }
    } else {
      const draftId = responseData?.id?.toString() || `tf_${Date.now()}`;
      const draftUrl = responseData?.private_url || `https://typefully.com/?d=${draftId}&a=${socialSetId}`;

      for (const channel of targetChannels) {
        results.push({
          channel,
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
      results.push({
        channel,
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
 * Dispatches content to Buffer GraphQL API (handles LinkedIn & Instagram)
 */
async function dispatchToBuffer(
  content: string,
  scheduledAt?: string | null,
  mediaUrls?: string[],
  channels: PlatformId[] = ['linkedin'],
  profileIds?: string[]
): Promise<DispatchResult[]> {
  const token = process.env.BUFFER_ACCESS_TOKEN;
  const linkedinProfileId = process.env.BUFFER_LINKEDIN_PROFILE_ID;
  const instagramProfileId = process.env.BUFFER_INSTAGRAM_PROFILE_ID;

  const isSimulated = !token || token.includes('your_') || token.trim() === '';
  const results: DispatchResult[] = [];
  const targetChannels = channels.filter((c) => c === 'linkedin' || c === 'instagram');

  for (const channel of targetChannels) {
    // Check if an explicit profile ID was selected by the user for this Buffer channel
    let profileId = profileIds?.find((id) => id.length === 24 && !id.startsWith('tf_'));
    if (!profileId) {
      profileId = channel === 'linkedin' ? linkedinProfileId : instagramProfileId;
    }

    if (isSimulated || !profileId || profileId.includes('your_')) {
      results.push({
        channel,
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

      const inputPayload: Record<string, unknown> = {
        channelId: profileId,
        text: content,
        mode: scheduledAt ? 'customScheduled' : 'shareNow',
        dueAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        saveToDraft: false,
      };

      if (mediaUrls && mediaUrls.length > 0) {
        inputPayload.assets = mediaUrls.map((url) => ({ url }));
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
    typefullyChannels.length > 0 ? dispatchToTypefully(content, scheduledAt, typefullyChannels) : Promise.resolve([]),
    bufferChannels.length > 0 ? dispatchToBuffer(content, scheduledAt, mediaUrls, bufferChannels, profileIds) : Promise.resolve([]),
  ]);

  return [...typefullyResults, ...bufferResults];
}
