'use client';

import React, { useState, useEffect } from 'react';
import {
  Send,
  Calendar,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  Zap,
  X,
  Users,
} from 'lucide-react';
import { PlatformId, Post, SocialProfile } from '@/types';
import { MediaUploader } from './MediaUploader';
import { LivePreview } from '../preview/LivePreview';
import { PublishProfilesModal } from './PublishProfilesModal';
import { DEFAULT_PROFILES } from '@/lib/constants/profiles';

interface PostComposerProps {
  initialPost?: Partial<Post> | null;
  onPostDispatched?: () => void;
  onSavedDraft?: () => void;
  onClose?: () => void;
  userRole?: 'founder' | 'marketer';
}

export const PostComposer: React.FC<PostComposerProps> = ({
  initialPost,
  onPostDispatched,
  onSavedDraft,
  onClose,
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

  // Profiles system
  const [availableProfiles, setAvailableProfiles] = useState<SocialProfile[]>(DEFAULT_PROFILES);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    details?: string[];
  } | null>(null);

  // Fetch available profiles from /api/profiles
  useEffect(() => {
    fetch('/api/profiles')
      .then((res) => res.json())
      .then((data) => {
        if (data.profiles && Array.isArray(data.profiles)) {
          setAvailableProfiles(data.profiles);
        }
      })
      .catch(() => {
        // Fallback to DEFAULT_PROFILES
      });
  }, []);

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
    setStatusMessage({
      type: 'info',
      text: isScheduling
        ? `⏰ Forward-scheduling across ${selectedProfiles.length} profile(s)...`
        : `🚀 Dispatching to ${selectedProfiles.length} profile(s)...`,
    });

    const targetChannels: PlatformId[] = Array.from(
      new Set(selectedProfiles.map((p) => p.network))
    );

    let scheduledAt: string | null = null;
    if (isScheduling && scheduledDate) {
      scheduledAt = new Date(`${scheduledDate}T${scheduledTime || '09:00'}:00`).toISOString();
    }

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
          authorRole: userRole,
          authorName: userRole === 'founder' ? 'Founder' : 'Marketer',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch post');
      }

      const channelDetails = data.dispatchResults?.map((r: { channel: string; service: string; status: string }) =>
        `• ${r.channel.toUpperCase()}: ${r.status} (${r.service})`
      ) || [];

      setIsProfileModalOpen(false);

      setStatusMessage({
        type: 'success',
        text: data.message || `Post dispatched to ${selectedProfiles.length} profile(s)!`,
        details: channelDetails,
      });

      if (onPostDispatched) {
        onPostDispatched();
      }

      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown dispatch error';
      setStatusMessage({ type: 'error', text: message });
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Composer Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel rounded-2xl border border-slate-800 p-6 shadow-2xl relative">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Create Post</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Write once and choose your target social profiles on final publish
                </p>
              </div>

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
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-medium text-xs flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Save as Draft</span>
                </button>

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
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Previews (5 cols) */}
        <div className="lg:col-span-5 sticky top-6">
          <LivePreview content={content} mediaUrls={mediaUrls} />
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
    </>
  );
};
