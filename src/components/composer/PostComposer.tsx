'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Send,
  Calendar,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  Zap,
  X,
  Eye,
  Edit3,
  RotateCw,
  Trash2,
} from 'lucide-react';
import { PlatformId, Post, SocialProfile } from '@/types';
import { MediaUploader } from './MediaUploader';
import { LivePreview } from '../preview/LivePreview';
import { PublishProfilesModal } from './PublishProfilesModal';
import { DispatchStatusModal, ChannelStatusItem } from './DispatchStatusModal';

interface PostComposerProps {
  initialPost?: Partial<Post> | null;
  onPostDispatched?: () => void;
  onSavedDraft?: () => void;
  onClose?: () => void;
  onDeletePost?: (id: string) => Promise<void>;
  userRole?: 'founder' | 'marketer';
}

export const PostComposer: React.FC<PostComposerProps> = ({
  initialPost,
  onPostDispatched,
  onSavedDraft,
  onClose,
  onDeletePost,
  userRole = 'marketer',
}) => {
  const [content, setContent] = useState(initialPost?.content || '');
  const [title, setTitle] = useState(initialPost?.title || '');
  const [mediaUrls, setMediaUrls] = useState<string[]>(initialPost?.media_urls || []);
  const [isScheduling, setIsScheduling] = useState(Boolean(initialPost?.scheduled_at));
  const [scheduledDate, setScheduledDate] = useState(
    initialPost?.scheduled_at ? new Date(initialPost.scheduled_at).toISOString().split('T')[0] : ''
  );
  const [scheduledTime, setScheduledTime] = useState(
    initialPost?.scheduled_at
      ? new Date(initialPost.scheduled_at).toTimeString().slice(0, 5)
      : '09:00'
  );

  // Profiles system - dynamically populated from live Typefully/Buffer APIs
  const [availableProfiles, setAvailableProfiles] = useState<SocialProfile[]>([]);
  const [isSyncingProfiles, setIsSyncingProfiles] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');

  // Real-time dispatch status modal states
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusModalItems, setStatusModalItems] = useState<ChannelStatusItem[]>([]);
  const [isStatusGlobalLoading, setIsStatusGlobalLoading] = useState(false);
  const [activeDispatchedPost, setActiveDispatchedPost] = useState<Post | null>(null);

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    details?: string[];
  } | null>(null);

  // Fetch available profiles from /api/profiles
  const loadProfiles = useCallback(async (refresh = false) => {
    setIsSyncingProfiles(true);
    try {
      const res = await fetch(`/api/profiles${refresh ? '?refresh=true' : ''}`);
      const data = await res.json();
      if (data.profiles && Array.isArray(data.profiles)) {
        setAvailableProfiles(data.profiles);
      }
    } catch (err) {
      console.warn('Failed to load profiles:', err);
    } finally {
      setIsSyncingProfiles(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Sync if initialPost changes
  useEffect(() => {
    if (initialPost) {
      if (initialPost.content !== undefined) setContent(initialPost.content);
      if (initialPost.title !== undefined) setTitle(initialPost.title);
      if (initialPost.media_urls) setMediaUrls(initialPost.media_urls);
      if (initialPost.scheduled_at) {
        setIsScheduling(true);
        setScheduledDate(new Date(initialPost.scheduled_at).toISOString().split('T')[0]);
        setScheduledTime(new Date(initialPost.scheduled_at).toTimeString().slice(0, 5));
      }
    }
  }, [initialPost]);

  // Preset Date helpers
  const setPresetSchedule = (daysFromNow: number, hour: number, minute: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromNow);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    setScheduledDate(`${yyyy}-${mm}-${dd}`);
    setScheduledTime(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    setIsScheduling(true);
  };

  // Step 1: User clicks "Post Now" or "Schedule Ahead" -> Open Profile Selection Modal
  const handleOpenProfileSelection = (scheduling: boolean) => {
    if (!content.trim()) {
      setStatusMessage({ type: 'error', text: 'Please write some post content first.' });
      return;
    }

    if (scheduling) {
      if (!scheduledDate) {
        setStatusMessage({ type: 'error', text: 'Please select a date for forward scheduling.' });
        return;
      }
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime || '09:00'}:00`).toISOString();
      if (new Date(scheduledAt).getTime() <= Date.now()) {
        setStatusMessage({ type: 'error', text: 'Scheduled time must be in the future.' });
        return;
      }
    }

    setIsScheduling(scheduling);
    setIsProfileModalOpen(true);
  };

  // Step 2: User selects profiles and clicks "Confirm & Publish"
  const handleConfirmPublishProfiles = async (selectedProfiles: SocialProfile[]) => {
    setIsSubmitting(true);

    const targetChannels: PlatformId[] = Array.from(
      new Set(selectedProfiles.map((p) => p.network))
    );

    let scheduledAt: string | null = null;
    if (isScheduling && scheduledDate) {
      scheduledAt = new Date(`${scheduledDate}T${scheduledTime || '09:00'}:00`).toISOString();
    }

    // Initialize the live clean status modal
    const initialItems: ChannelStatusItem[] = selectedProfiles.map((p) => ({
      channel: p.network,
      profileId: p.id,
      name: p.name,
      handle: p.handle,
      avatarUrl: p.avatarUrl,
      service: p.service,
      status: 'loading',
    }));

    setIsProfileModalOpen(false);
    setStatusModalItems(initialItems);
    setIsStatusGlobalLoading(true);
    setIsStatusModalOpen(true);

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: initialPost?.id,
          title: title || content.slice(0, 40),
          content,
          channels: targetChannels,
          scheduledAt,
          mediaUrls,
          profileIds: selectedProfiles.map((p) => p.id),
          authorRole: userRole,
          authorName: userRole === 'founder' ? 'Founder' : 'Marketer',
        }),
      });

      const data = await res.json();
      setIsStatusGlobalLoading(false);

      if (data.post) {
        setActiveDispatchedPost(data.post);
      }

      if (data.dispatchResults && Array.isArray(data.dispatchResults)) {
        setStatusModalItems((prev) =>
          prev.map((item) => {
            const match = data.dispatchResults.find(
              (r: any) =>
                (r.profileId && r.profileId === item.profileId) ||
                r.channel === item.channel
            );
            if (match) {
              return {
                ...item,
                status: match.success ? 'success' : 'failed',
                error: match.error,
                externalUrl: match.externalUrl,
                externalId: match.externalId,
              };
            }
            return item;
          })
        );
      } else if (!res.ok) {
        setStatusModalItems((prev) =>
          prev.map((item) => ({
            ...item,
            status: 'failed',
            error: data.error || 'Failed to dispatch post',
          }))
        );
      }

      if (onPostDispatched) {
        onPostDispatched();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown dispatch error';
      setIsStatusGlobalLoading(false);
      setStatusModalItems((prev) =>
        prev.map((item) => ({
          ...item,
          status: 'failed',
          error: message,
        }))
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Channel Retry Handler
  const handleRetryChannel = async (item: ChannelStatusItem) => {
    try {
      setStatusModalItems((prev) =>
        prev.map((it) =>
          it.profileId === item.profileId && it.channel === item.channel
            ? { ...it, status: 'loading', error: undefined }
            : it
        )
      );

      let scheduledAt: string | null = null;
      if (isScheduling && scheduledDate) {
        scheduledAt = new Date(`${scheduledDate}T${scheduledTime || '09:00'}:00`).toISOString();
      }

      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: activeDispatchedPost?.id || initialPost?.id,
          title: title || content.slice(0, 40),
          content,
          channels: [item.channel],
          scheduledAt,
          mediaUrls,
          profileIds: item.profileId ? [item.profileId] : [],
          authorRole: userRole,
          authorName: userRole === 'founder' ? 'Founder' : 'Marketer',
        }),
      });

      const data = await res.json();
      const match = data.dispatchResults?.[0];

      setStatusModalItems((prev) =>
        prev.map((it) => {
          if (it.profileId === item.profileId && it.channel === item.channel) {
            return {
              ...it,
              status: match?.success ? 'success' : 'failed',
              error: match?.error || (!res.ok ? data.error || 'Retry failed' : undefined),
              externalUrl: match?.externalUrl,
              externalId: match?.externalId,
            };
          }
          return it;
        })
      );

      if (onPostDispatched) {
        onPostDispatched();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Retry failed';
      setStatusModalItems((prev) =>
        prev.map((it) =>
          it.profileId === item.profileId && it.channel === item.channel
            ? { ...it, status: 'failed', error: msg }
            : it
        )
      );
    }
  };

  // Delete Current Post Handler
  const handleDeleteCurrentPost = async (postIdToDelete?: string) => {
    const targetId = postIdToDelete || activeDispatchedPost?.id || initialPost?.id;
    if (!targetId) return;

    if (onDeletePost) {
      await onDeletePost(targetId);
    } else {
      await fetch(`/api/posts/${targetId}`, { method: 'DELETE' });
    }

    if (onPostDispatched) onPostDispatched();
    if (onSavedDraft) onSavedDraft();
    setIsStatusModalOpen(false);
    if (onClose) onClose();
  };

  // Save as Draft
  const handleSaveDraft = async () => {
    if (!content.trim()) {
      setStatusMessage({ type: 'error', text: 'Please write some content to save as draft.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || content.slice(0, 40),
          content,
          channels: ['twitter', 'threads', 'linkedin', 'instagram'],
          status: 'draft',
          media_urls: mediaUrls,
          author_role: userRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save draft');

      setStatusMessage({ type: 'success', text: 'Draft saved successfully to Content Queue!' });
      if (onSavedDraft) onSavedDraft();
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save draft';
      setStatusMessage({ type: 'error', text: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Mobile Tab Switcher: Editor vs Live Preview */}
      <div className="flex lg:hidden items-center p-1 bg-slate-900/90 rounded-xl border border-slate-800 mb-3 max-w-xs mx-auto text-xs">
        <button
          type="button"
          onClick={() => setMobileTab('editor')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold transition-all ${
            mobileTab === 'editor'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Editor</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold transition-all ${
            mobileTab === 'preview'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Preview</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Composer Controls (7 cols) */}
        <div className={`lg:col-span-7 space-y-6 ${mobileTab === 'editor' ? 'block' : 'hidden lg:block'}`}>
          <div className="glass-panel rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-2xl relative">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Create Post</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Write once and choose your target social profiles on final publish
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadProfiles(true)}
                  disabled={isSyncingProfiles}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all"
                  title="Sync latest live profiles from Typefully and Buffer APIs"
                >
                  <RotateCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncingProfiles ? 'animate-spin' : ''}`} />
                  <span className="text-[11px] font-medium">
                    {isSyncingProfiles
                      ? 'Syncing...'
                      : availableProfiles.length > 0
                      ? `${availableProfiles.length} Live Profiles`
                      : 'Sync Profiles'}
                  </span>
                </button>

                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Post Content Area */}
            <div className="pt-4 space-y-4">
              {/* Title / Campaign Tag */}
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Optional campaign title (e.g. Q4 Launch Announcement)..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-900/60 text-slate-200 placeholder-slate-500 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Main Textarea */}
              <div className="relative">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your post here. It will be previewed on the right and dispatched to your selected profiles..."
                  rows={9}
                  className="w-full p-4 bg-slate-950/70 text-slate-100 placeholder-slate-500 rounded-xl border border-slate-800/90 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm leading-relaxed resize-y font-sans"
                />

                {/* Character count */}
                <div className="flex items-center justify-between px-2 pt-1 text-xs text-slate-400">
                  <span>{content.length} characters</span>
                  <span className="text-[11px] text-slate-500">Markdown &amp; line breaks supported</span>
                </div>
              </div>

              {/* Media & Carousel Uploader */}
              <div className="pt-1">
                <MediaUploader mediaUrls={mediaUrls} onChange={setMediaUrls} />
              </div>

              {/* Forward Scheduling Section */}
              <div className="pt-4 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Forward Scheduling Engine
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsScheduling(false)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        !isScheduling
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Publish Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsScheduling(true)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        isScheduling
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Schedule Ahead
                    </button>
                  </div>
                </div>

                {isScheduling && (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Select Date
                        </label>
                        <input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-950 text-slate-200 rounded-lg border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Select Time (Local Timezone)
                        </label>
                        <input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-950 text-slate-200 rounded-lg border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Scheduling Quick Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                      <span className="text-slate-500">Presets:</span>
                      <button
                        type="button"
                        onClick={() => setPresetSchedule(1, 9, 0)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        Tomorrow 9:00 AM
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetSchedule(1, 14, 0)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        Tomorrow 2:00 PM
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetSchedule(3, 10, 0)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        In 3 Days 10:00 AM
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Feedback Toast */}
              {statusMessage && (
                <div
                  className={`p-3.5 rounded-xl text-xs border flex flex-col gap-1 ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : statusMessage.type === 'error'
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                      : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium">
                    {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
                    {statusMessage.type === 'info' && <Zap className="w-4 h-4 text-blue-400" />}
                    <span>{statusMessage.text}</span>
                  </div>
                  {statusMessage.details && statusMessage.details.length > 0 && (
                    <div className="pl-6 space-y-0.5 font-mono text-[11px] opacity-90">
                      {statusMessage.details.map((d, idx) => (
                        <div key={idx}>{d}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Primary Action Buttons */}
              <div className="pt-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-medium text-xs flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save as Draft</span>
                  </button>

                  {initialPost?.id && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCurrentPost()}
                      disabled={isSubmitting}
                      className="px-3.5 py-2.5 rounded-xl border border-rose-900/40 hover:border-rose-700/60 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 font-medium text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                      title="Delete this post"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {isScheduling ? (
                    <button
                      type="button"
                      onClick={() => handleOpenProfileSelection(true)}
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>⏰ Schedule Ahead...</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenProfileSelection(false)}
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>🚀 Post Now...</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile Quick Preview Trigger */}
              <button
                type="button"
                onClick={() => setMobileTab('preview')}
                className="lg:hidden w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all mt-3"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview Multi-Platform Render →</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Previews (5 cols) */}
        <div className={`lg:col-span-5 sticky top-6 space-y-3 ${mobileTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
          <button
            type="button"
            onClick={() => setMobileTab('editor')}
            className="lg:hidden w-full py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>← Back to Post Editor</span>
          </button>
          <LivePreview content={content} mediaUrls={mediaUrls} profiles={availableProfiles} />
        </div>
      </div>

      {/* Final Step: Profile Selection Pop-up Modal */}
      <PublishProfilesModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profiles={availableProfiles}
        onConfirm={handleConfirmPublishProfiles}
        isScheduling={isScheduling}
        scheduledDate={scheduledDate}
        scheduledTime={scheduledTime}
        isSubmitting={isSubmitting}
      />

      {/* Real-time Dispatch Status Modal */}
      <DispatchStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          if (onClose) onClose();
        }}
        post={activeDispatchedPost || (initialPost as Post) || null}
        items={statusModalItems}
        isGlobalLoading={isStatusGlobalLoading}
        onRetryChannel={handleRetryChannel}
        onDeletePost={handleDeleteCurrentPost}
        isScheduling={isScheduling}
      />
    </>
  );
};
