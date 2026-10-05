'use client';

import React, { useState } from 'react';
import { ThumbsUp, MessageSquare, Repeat2, Send, Globe, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

interface LinkedInPreviewProps {
  content: string;
  mediaUrls: string[];
}

export const LinkedInPreview: React.FC<LinkedInPreviewProps> = ({ content, mediaUrls }) => {
  const [expanded, setExpanded] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const truncateThreshold = 210;
  const isTruncatable = content.length > truncateThreshold;
  const displayText = expanded || !isTruncatable ? content : content.slice(0, truncateThreshold);

  const totalSlides = mediaUrls.length;

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-xl overflow-hidden font-sans">
      {/* Author Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow">
            AF
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-white hover:underline cursor-pointer">
                Alex Founder
              </span>
              <span className="text-xs text-slate-400">• 1st</span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-1">
              Founder & CEO @ Stealth Social • Building next-gen distribution engines
            </p>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
              <span>1h • Edited</span>
              <span>•</span>
              <Globe className="w-3 h-3 text-slate-500" />
            </div>
          </div>
        </div>
        <button className="text-slate-500 hover:text-slate-300 p-1">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Post Text */}
      <div className="px-4 pb-3 text-sm text-slate-200 leading-relaxed whitespace-pre-line break-words">
        {displayText || 'Drafting an insightful industry update...'}
        {!expanded && isTruncatable && (
          <button
            onClick={() => setExpanded(true)}
            className="text-slate-400 hover:text-blue-400 font-semibold ml-1 cursor-pointer transition-colors"
          >
            ...see more
          </button>
        )}
      </div>

      {/* Media Attachment / Carousel */}
      {totalSlides > 0 && (
        <div className="relative w-full max-h-80 bg-slate-950 overflow-hidden border-y border-slate-800 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrls[currentSlide]}
            alt={`LinkedIn Slide ${currentSlide + 1}`}
            className="w-full h-80 object-cover"
          />

          {totalSlides > 1 && (
            <>
              {/* Slide Counter Badge */}
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] font-semibold text-white border border-slate-700">
                {currentSlide + 1}/{totalSlides}
              </div>

              {/* Prev / Next controls */}
              <button
                type="button"
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white transition-opacity opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white transition-opacity opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Reactions Bar */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[9px] text-white">
              👍
            </span>
            <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[9px] text-white">
              👏
            </span>
            <span className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-[9px] text-white">
              ❤️
            </span>
          </div>
          <span className="ml-1 text-[11px] text-slate-400">189</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>42 comments</span>
          <span>•</span>
          <span>12 reposts</span>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="px-2 py-1.5 grid grid-cols-4 gap-1 text-slate-400 text-xs font-medium">
        <button className="flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-slate-800/80 hover:text-blue-400 transition-colors">
          <ThumbsUp className="w-4 h-4" />
          <span>Like</span>
        </button>
        <button className="flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-slate-800/80 hover:text-slate-200 transition-colors">
          <MessageSquare className="w-4 h-4" />
          <span>Comment</span>
        </button>
        <button className="flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-slate-800/80 hover:text-emerald-400 transition-colors">
          <Repeat2 className="w-4 h-4" />
          <span>Repost</span>
        </button>
        <button className="flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-slate-800/80 hover:text-slate-200 transition-colors">
          <Send className="w-4 h-4" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};
