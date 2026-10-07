'use client';

import React from 'react';
import { Heart, MessageCircle, Repeat, Send, MoreHorizontal } from 'lucide-react';

interface ThreadsPreviewProps {
  content: string;
  mediaUrls: string[];
  profile?: {
    name?: string;
    handle?: string;
    avatarUrl?: string;
  };
}

export const ThreadsPreview: React.FC<ThreadsPreviewProps> = ({ content, mediaUrls, profile }) => {
  const displayHandle = profile?.handle?.replace(/^@/, '') || 'yourhandle';
  const displayName = profile?.name || 'Your Account';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'TH';

  return (
    <div className="w-full max-w-lg mx-auto bg-zinc-950 text-zinc-100 rounded-2xl border border-zinc-800 p-4 shadow-xl font-sans">
      <div className="flex gap-3">
        {/* Left Column: Avatar + Loop Thread line */}
        <div className="flex flex-col items-center">
          {profile?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt={displayName}
              className="w-9 h-9 rounded-full object-cover border border-zinc-700 shadow"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-900 border border-zinc-700 flex items-center justify-center font-bold text-xs text-white shadow">
              {initials}
            </div>
          )}
          <div className="w-0.5 flex-1 bg-zinc-800 mt-2 mb-1" />
          <div className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-zinc-500" />
          </div>
        </div>

        {/* Right Column: Post Body */}
        <div className="flex-1 min-w-0 pb-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-white hover:underline cursor-pointer">
                {displayHandle}
              </span>
              <span className="text-[11px] text-zinc-500">Just now</span>
            </div>
            <button className="text-zinc-500 hover:text-zinc-300">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>


          {/* Text Content */}
          <div className="text-xs leading-relaxed text-zinc-200 whitespace-pre-line break-words mb-3">
            {content || 'Start a thread...'}
          </div>

          {/* Media Attachment (Single or Multi-image carousel/reel) */}
          {mediaUrls && mediaUrls.length > 0 && (
            <div className="mb-3">
              {mediaUrls.length === 1 ? (
                <div className="rounded-xl overflow-hidden border border-zinc-800 max-h-64 bg-zinc-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrls[0]}
                    alt="Threads Media"
                    className="w-full h-full object-cover max-h-64"
                  />
                </div>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {mediaUrls.map((url, i) => (
                    <div
                      key={i}
                      className="w-44 h-44 flex-shrink-0 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Slide ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Icons */}
          <div className="flex items-center gap-4 text-zinc-400 text-xs pt-1">
            <button className="hover:text-pink-500 transition-colors">
              <Heart className="w-4 h-4" />
            </button>
            <button className="hover:text-zinc-100 transition-colors">
              <MessageCircle className="w-4 h-4" />
            </button>
            <button className="hover:text-emerald-400 transition-colors">
              <Repeat className="w-4 h-4" />
            </button>
            <button className="hover:text-zinc-100 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2 text-[11px] text-zinc-500">
            <span>24 replies · 96 likes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
