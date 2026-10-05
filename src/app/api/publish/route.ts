import { NextRequest, NextResponse } from 'next/server';
import { executeMultiChannelDispatch } from '@/lib/services/dispatcher';
import { repository } from '@/lib/store/repository';
import { PlatformId, PostStatus } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      postId,
      title,
      content,
      channels,
      scheduledAt,
      mediaUrls = [],
      authorRole = 'marketer',
      authorName = 'Marketer',
      notes,
    } = body;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json({ error: 'Post content cannot be empty' }, { status: 400 });
    }

    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return NextResponse.json({ error: 'Please select at least one channel' }, { status: 400 });
    }

    const isScheduling = Boolean(scheduledAt && new Date(scheduledAt).getTime() > Date.now());
    const initialStatus: PostStatus = isScheduling ? 'scheduled' : 'published';

    // 1. Either get existing post or create a new post entry in the database
    let activePost;
    if (postId) {
      activePost = await repository.getPostById(postId);
    }

    if (!activePost) {
      activePost = await repository.createPost({
        title: title || content.slice(0, 40) + '...',
        content,
        channels: channels as PlatformId[],
        status: isScheduling ? 'scheduled' : 'draft',
        scheduled_at: isScheduling ? new Date(scheduledAt).toISOString() : null,
        published_at: isScheduling ? null : new Date().toISOString(),
        media_urls: mediaUrls,
        author_role: authorRole,
        author_name: authorName,
        notes,
      });
    }

    // 2. Dispatch to external APIs (Typefully & Buffer)
    const dispatchResults = await executeMultiChannelDispatch({
      postId: activePost.id,
      channels: channels as PlatformId[],
      content,
      scheduledAt: isScheduling ? scheduledAt : null,
      mediaUrls,
    });

    // 3. Log all dispatch results in database
    const savedLogs = [];
    let hasFailure = false;

    for (const result of dispatchResults) {
      if (!result.success) {
        hasFailure = true;
      }

      const log = await repository.addDispatchLog({
        post_id: activePost.id,
        channel: result.channel,
        service: result.service,
        status: result.status,
        external_id: result.externalId,
        external_url: result.externalUrl,
        response_payload: result.responseReceived || (result.payloadSent ? { payload: result.payloadSent } : null),
        error_message: result.error,
      });
      savedLogs.push(log);
    }

    // 4. Update the post status
    const finalStatus: PostStatus = hasFailure && dispatchResults.every((r) => !r.success)
      ? 'failed'
      : initialStatus;

    const updatedPost = await repository.updatePost(activePost.id, {
      status: finalStatus,
      channels: channels as PlatformId[],
      content,
      title: title || activePost.title,
      scheduled_at: isScheduling ? new Date(scheduledAt).toISOString() : null,
      published_at: isScheduling ? null : new Date().toISOString(),
      media_urls: mediaUrls,
    });

    return NextResponse.json({
      success: !hasFailure,
      partialSuccess: hasFailure && dispatchResults.some((r) => r.success),
      post: updatedPost || activePost,
      dispatchResults,
      logs: savedLogs,
      message: isScheduling
        ? `Successfully scheduled post across ${channels.length} channel(s)`
        : `Successfully dispatched post across ${channels.length} channel(s)`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown dispatch error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
