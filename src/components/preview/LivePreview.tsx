'use client';

import React, { useState } from 'react';
import { TwitterPreview } from './TwitterPreview';
import { LinkedInPreview } from './LinkedInPreview';
import { InstagramPreview } from './InstagramPreview';
import { ThreadsPreview } from './ThreadsPreview';
import { PlatformId } from '@/types';
import { PLATFORMS } from '@/lib/constants/platforms';
import { Eye } from 'lucide-react';

interface LivePreviewProps {
  content: string;
  mediaUrls: string[];
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  content,
  mediaUrls,
}) => {
  const [activeTab, setActiveTab] = useState<PlatformId>('twitter');

  const currentPlatform = PLATFORMS[activeTab];
  const charLength = content.length;
  const remainingChars = currentPlatform.charLimit - charLength;
  const isOverLimit = remainingChars < 0;

  return (
    <div className="flex flex-col h-full bg-slate-900/40 rounded-2xl border border-slate-800/80 p-5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Live Multi-Platform Preview</h3>
        </div>

        {/* Character count pill */}
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium ${
              isOverLimit
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            {charLength} / {currentPlatform.charLimit} chars
          </span>
        </div>
      </div>

      {/* Tabs (No green dot indicator as requested) */}
      <div className="flex items-center gap-1.5 py-3 overflow-x-auto no-scrollbar">
        {(['twitter', 'threads', 'linkedin', 'instagram'] as PlatformId[]).map((pid) => {
          const isActive = activeTab === pid;
          const meta = PLATFORMS[pid];

          return (
            <button
              key={pid}
              onClick={() => setActiveTab(pid)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all relative ${
                isActive
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: meta.color }}
              />
              <span>{meta.name}</span>
            </button>
          );
        })}
      </div>

      {/* Preview Screen Body */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-xl border border-slate-900 overflow-y-auto min-h-[420px]">
        {activeTab === 'twitter' && <TwitterPreview content={content} mediaUrls={mediaUrls} />}
        {activeTab === 'threads' && <ThreadsPreview content={content} mediaUrls={mediaUrls} />}
        {activeTab === 'linkedin' && <LinkedInPreview content={content} mediaUrls={mediaUrls} />}
        {activeTab === 'instagram' && <InstagramPreview content={content} mediaUrls={mediaUrls} />}
      </div>

      {/* Notice footer */}
      <div className="pt-3 text-center">
        <p className="text-[11px] text-slate-500">
          Showing real-time preview for <strong className="text-slate-400">{currentPlatform.name}</strong>
        </p>
      </div>
    </div>
  );
};
