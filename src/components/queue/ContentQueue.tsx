'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  Send,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Zap,
  MoreVertical,
  Code,
} from 'lucide-react';
import { Post, PostStatus, PlatformId } from '@/types';
import { PLATFORMS } from '@/lib/constants/platforms';
import { DispatchLogsModal } from './DispatchLogsModal';

interface ContentQueueProps {
  posts: Post[];
  onEditPost: (post: Post) => void;
  onRefreshPosts: () => void;
}

export const ContentQueue: React.FC<ContentQueueProps> = ({
  posts,
  onEditPost,
  onRefreshPosts,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PostStatus>('all');
  const [platformFilter, setPlatformFilter] = useState<'all' | PlatformId>('all');
  const [selectedPostForLogs, setSelectedPostForLogs] = useState<Post | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleInstantPublish = async (post: Post) => {
    setIsProcessing(post.id);
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          content: post.content,
          channels: post.channels,
          mediaUrls: post.media_urls,
          title: post.title,
        }),
      });

      if (res.ok) {
        onRefreshPosts();
      }
    } catch (err) {
      console.error('Instant publish failed', err);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      onRefreshPosts();
    } catch (err) {
      console.error('Failed to delete post', err);
    }
  };

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.content.toLowerCase().includes(search.toLowerCase()) ||
      (post.title && post.title.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    const matchesPlatform = platformFilter === 'all' || post.channels.includes(platformFilter);

    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const getStatusBadge = (status: PostStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Published
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Clock className="w-3 h-3" /> Scheduled
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <FileText className="w-3 h-3" /> Draft
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Search and Filters Header */}
      <div className="p-4 glass-panel rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns, content copy, or channels..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 text-white placeholder-slate-500 rounded-xl border border-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          {(['all', 'scheduled', 'published', 'draft', 'failed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-medium capitalize transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center glass-panel rounded-2xl border border-slate-800 text-slate-500 text-xs">
            No posts found matching the criteria. Create one in the Composer!
          </div>
        ) : (
          filteredPosts.map((post) => {
            const hasMedia = post.media_urls && post.media_urls.length > 0;
            const logCount = post.dispatch_logs?.length || 0;

            return (
              <div
                key={post.id}
                className="p-5 glass-card rounded-2xl border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5 group"
              >
                {/* Left: Thumbnail & Content Info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {hasMedia ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.media_urls[0]}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-slate-800/80 bg-slate-900/60 flex items-center justify-center text-slate-600 flex-shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="font-semibold text-sm text-white truncate max-w-sm">
                        {post.title || post.content.slice(0, 45)}
                      </h4>
                      {getStatusBadge(post.status)}
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>

                    {/* Metadata & Platforms */}
                    <div className="flex items-center gap-3 pt-1 flex-wrap text-[11px] text-slate-500">
                      {/* Channel chips */}
                      <div className="flex items-center gap-1">
                        {post.channels.map((cid) => {
                          const meta = PLATFORMS[cid];
                          return (
                            <span
                              key={cid}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1"
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: meta?.color }}
                              />
                              {meta?.name.split(' ')[0]}
                            </span>
                          );
                        })}
                      </div>

                      {post.scheduled_at && (
                        <span className="flex items-center gap-1 text-indigo-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.scheduled_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}

                      {post.published_at && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          Published {new Date(post.published_at).toLocaleDateString()}
                        </span>
                      )}

                      <span>•</span>
                      <span className="capitalize">{post.author_name || post.author_role}</span>

                      {logCount > 0 && (
                        <>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => setSelectedPostForLogs(post)}
                            className="text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <Code className="w-3 h-3" />
                            {logCount} API Logs
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                  {post.status !== 'published' && (
                    <button
                      type="button"
                      onClick={() => handleInstantPublish(post)}
                      disabled={isProcessing === post.id}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 hover:border-blue-600 font-medium text-xs flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                      title="Post to selected channels immediately"
                    >
                      {isProcessing === post.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Post Now</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onEditPost(post)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                    title="Edit in Composer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPostForLogs(post)}
                    className="p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-all"
                    title="View API Dispatch Logs"
                  >
                    <Code className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeletePost(post.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all"
                    title="Delete post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dispatch Logs Audit Modal */}
      <DispatchLogsModal
        post={selectedPostForLogs}
        isOpen={Boolean(selectedPostForLogs)}
        onClose={() => setSelectedPostForLogs(null)}
      />
    </div>
  );
};
