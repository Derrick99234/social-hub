'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCw,
  Trash2,
  ExternalLink,
  Calendar,
  Send,
  AlertCircle,
} from 'lucide-react';
import { Post, SocialProfile, PlatformId } from '@/types';
import { PLATFORMS } from '@/lib/constants/platforms';

export interface ChannelStatusItem {
  channel: PlatformId;
  profileId?: string;
  name: string;
  handle?: string;
  avatarUrl?: string;
  service: 'typefully' | 'buffer';
  status: 'loading' | 'success' | 'failed' | 'simulated';
  error?: string;
  externalUrl?: string;
  externalId?: string;
}

interface DispatchStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  post?: Post | null;
  items: ChannelStatusItem[];
  isGlobalLoading?: boolean;
  onRetryChannel?: (item: ChannelStatusItem) => Promise<void>;
  onDeletePost?: (postId: string) => Promise<void>;
  isScheduling?: boolean;
}

export const DispatchStatusModal: React.FC<DispatchStatusModalProps> = ({
  isOpen,
  onClose,
  post,
  items,
  isGlobalLoading = false,
  onRetryChannel,
  onDeletePost,
  isScheduling = false,
}) => {
  const [retryingProfileId, setRetryingProfileId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen) return null;

  const hasFailures = items.some((item) => item.status === 'failed');
  const allSuccess = items.length > 0 && items.every((item) => item.status === 'success' || item.status === 'simulated');
  const anyLoading = isGlobalLoading || items.some((item) => item.status === 'loading') || retryingProfileId !== null;

  const handleRetry = async (item: ChannelStatusItem) => {
    if (!onRetryChannel || anyLoading) return;
    setRetryingProfileId(item.profileId || item.channel);
    try {
      await onRetryChannel(item);
    } finally {
      setRetryingProfileId(null);
    }
  };

  const handleDelete = async () => {
    if (!post?.id || !onDeletePost) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setIsDeleting(true);
    try {
      await onDeletePost(post.id);
      onClose();
    } catch (err) {
      console.error('Delete error', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg glass-panel rounded-2xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl border flex items-center justify-center ${
                anyLoading
                  ? 'bg-blue-600/10 text-blue-400 border-blue-500/20'
                  : allSuccess
                  ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-600/10 text-rose-400 border-rose-500/20'
              }`}
            >
              {anyLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : allSuccess ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {anyLoading
                  ? isScheduling
                    ? 'Scheduling Posts...'
                    : 'Dispatching to Channels...'
                  : allSuccess
                  ? isScheduling
                    ? 'All Posts Scheduled'
                    : 'All Posts Dispatched'
                  : 'Dispatch Status'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-xs sm:max-w-sm mt-0.5">
                {post?.title || post?.content.slice(0, 45) || 'Distribution Channel Status'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channel Status List */}
        <div className="p-4 sm:p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No channels recorded for this post.
            </div>
          ) : (
            items.map((item, idx) => {
              const platformMeta = PLATFORMS[item.channel];
              const isItemRetrying = retryingProfileId === (item.profileId || item.channel);
              const isItemLoading = isGlobalLoading || item.status === 'loading' || isItemRetrying;

              return (
                <div
                  key={`${item.channel}-${item.profileId || idx}`}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2.5 transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Left: Profile identity */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {item.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.avatarUrl}
                          alt={item.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-700 flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                          style={{ backgroundColor: platformMeta?.color || '#3b82f6' }}
                        >
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-semibold text-white truncate max-w-[170px] sm:max-w-[220px]">
                            {item.name}
                          </h4>
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: platformMeta?.color }}
                            title={platformMeta?.name}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          {item.handle || platformMeta?.name} • {item.service.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    {/* Right: State & Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isItemLoading ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-medium animate-pulse">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{isScheduling ? 'Scheduling...' : 'Sending...'}</span>
                        </span>
                      ) : item.status === 'success' || item.status === 'simulated' ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isScheduling ? 'Scheduled' : 'Sent'}</span>
                          </span>
                          {item.externalUrl && (
                            <a
                              href={item.externalUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-slate-400 hover:text-white transition-colors"
                              title="View published post"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs text-rose-400 font-medium">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Failed</span>
                          </span>
                          {onRetryChannel && (
                            <button
                              type="button"
                              onClick={() => handleRetry(item)}
                              disabled={anyLoading}
                              className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-medium flex items-center gap-1 transition-all"
                            >
                              <RotateCw className="w-3 h-3" />
                              <span>Retry</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Failure message if any */}
                  {item.status === 'failed' && item.error && (
                    <div className="text-[11px] text-rose-300/90 bg-rose-950/30 border border-rose-900/50 rounded-lg p-2 leading-relaxed">
                      {item.error}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3 flex-wrap">
          {/* Delete Option */}
          {post?.id && onDeletePost ? (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-rose-400 font-medium">Confirm delete?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Post</span>
              </button>
            )
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
