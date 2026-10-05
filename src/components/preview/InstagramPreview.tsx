'use client';

import React, { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Image as ImageIcon, ChevronLeft, ChevronRight, Layers } from 'lucide-react';

interface InstagramPreviewProps {
  content: string;
  mediaUrls: string[];
}

export const InstagramPreview: React.FC<InstagramPreviewProps> = ({ content, mediaUrls }) => {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

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
    <div className="w-full max-w-sm mx-auto bg-black text-white rounded-2xl border border-zinc-800 shadow-xl overflow-hidden font-sans">
      {/* Top Header */}
      <div className="px-3.5 py-3 flex items-center justify-between border-b border-zinc-900">
        <div className="flex items-center gap-2.5">
          {/* Gradient Story Ring */}
          <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
            <div className="w-8 h-8 rounded-full bg-black p-0.5">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white">
                SH
              </div>
            </div>
          </div>
          <div>
            <span className="font-semibold text-xs text-zinc-100 hover:underline cursor-pointer block">
              socialcontenthub
            </span>
            <span className="text-[10px] text-zinc-400 block -mt-0.5">Original Audio</span>
          </div>
        </div>
        <button className="text-zinc-400 hover:text-white p-1">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Media Carousel Container (1:1 aspect ratio) */}
      <div className="relative aspect-square w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center overflow-hidden border-y border-zinc-900 group">
        {totalSlides > 0 ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrls[currentSlide]}
              alt={`Slide ${currentSlide + 1}`}
              className="w-full h-full object-cover transition-opacity duration-200"
            />

            {/* Carousel navigation controls if > 1 slide */}
            {totalSlides > 1 && (
              <>
                {/* Slide indicator badge */}
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-semibold text-white tracking-wider">
                  {currentSlide + 1}/{totalSlides}
                </div>

                {/* Prev Button */}
                <button
                  type="button"
                  onClick={prevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-opacity opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={nextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-opacity opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Dots indicator at bottom */}
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  {mediaUrls.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === currentSlide ? 'w-3.5 bg-blue-500' : 'w-1.5 bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-pink-500 mb-3 shadow-inner">
              <ImageIcon className="w-8 h-8" />
            </div>
            <p className="text-xs font-medium text-zinc-300">Media Preview Container</p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-[200px]">
              Attach one or multiple images in the composer for a carousel post
            </p>
          </div>
        )}
      </div>

      {/* Actions Bar */}
      <div className="px-3.5 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLiked(!liked)}
            className={`transition-transform active:scale-125 ${
              liked ? 'text-rose-500 fill-rose-500' : 'text-zinc-200 hover:text-zinc-400'
            }`}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-rose-500' : ''}`} />
          </button>
          <button className="text-zinc-200 hover:text-zinc-400 transition-colors">
            <MessageCircle className="w-5 h-5" />
          </button>
          <button className="text-zinc-200 hover:text-zinc-400 transition-colors">
            <Send className="w-5 h-5" />
          </button>
        </div>

        {totalSlides > 1 && (
          <div className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[10px] text-zinc-400 font-medium">Carousel</span>
          </div>
        )}

        <button
          onClick={() => setBookmarked(!bookmarked)}
          className={`transition-colors ${
            bookmarked ? 'text-white fill-white' : 'text-zinc-200 hover:text-zinc-400'
          }`}
        >
          <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-white' : ''}`} />
        </button>
      </div>

      {/* Likes */}
      <div className="px-3.5 py-0.5">
        <span className="font-semibold text-xs text-zinc-200">
          {liked ? '439 likes' : '438 likes'}
        </span>
      </div>

      {/* Caption */}
      <div className="px-3.5 py-1 text-xs text-zinc-300 leading-snug whitespace-pre-line break-words max-h-32 overflow-y-auto">
        <span className="font-semibold text-white mr-1.5">socialcontenthub</span>
        {content ? (
          content.split(' ').map((word, i) => {
            if (word.startsWith('#')) {
              return (
                <span key={i} className="text-blue-400 font-medium cursor-pointer hover:underline">
                  {word}{' '}
                </span>
              );
            }
            return word + ' ';
          })
        ) : (
          <span className="text-zinc-500 italic">Caption will appear here...</span>
        )}
      </div>

      {/* Timestamp */}
      <div className="px-3.5 pb-3 pt-1">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Just now</span>
      </div>
    </div>
  );
};
