'use client';

import React from 'react';
import { MessageCircle, Repeat2, Heart, Bookmark, Share, CheckCircle2, MoreHorizontal } from 'lucide-react';

interface TwitterPreviewProps {
  content: string;
  mediaUrls: string[];
  profile?: {
    name?: string;
    handle?: string;
    avatarUrl?: string;
  };
}

export const TwitterPreview: React.FC<TwitterPreviewProps> = ({ content, mediaUrls, profile }) => {
  const charLimit = 280;
  const isThread = content.length > charLimit;

  const displayName = profile?.name || 'Your Account';
  const displayHandle = profile?.handle || '@yourhandle';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'X';

  // Split content into simulated tweets if it exceeds 280 chars
  const splitIntoTweets = (text: string) => {
    if (text.length <= charLimit) return [text];

    const tweets: string[] = [];
    const paragraphs = text.split('\n\n');
    let currentTweet = '';

    for (const p of paragraphs) {
      if ((currentTweet + '\n\n' + p).length <= charLimit - 10) {
        currentTweet = currentTweet ? `${currentTweet}\n\n${p}` : p;
      } else {
        if (currentTweet) tweets.push(currentTweet);
        currentTweet = p;
      }
    }
    if (currentTweet) tweets.push(currentTweet);

    if (tweets.length <= 1 && text.length > charLimit) {
      return [
        text.slice(0, charLimit - 15) + '... (1/2)',
        text.slice(charLimit - 15) + ' (2/2)',
      ];
    }

    return tweets.map((t, idx) => `${t} (${idx + 1}/${tweets.length})`);
  };

  const tweets = isThread ? splitIntoTweets(content) : [content || 'What is happening?!'];

  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <span key={i} className="block min-h-[1.25rem]">
        {line.split(' ').map((word, wIdx) => {
          if (word.startsWith('#') || word.startsWith('@') || word.startsWith('http')) {
            return (
              <span key={wIdx} className="text-sky-400 font-medium cursor-pointer hover:underline">
                {word}{' '}
              </span>
            );
          }
          return word + ' ';
        })}
      </span>
    ));
  };

  // Render Twitter multi-image grid (1-4 images)
  const renderMediaGrid = () => {
    if (!mediaUrls || mediaUrls.length === 0) return null;
    const count = mediaUrls.length;

    if (count === 1) {
      return (
        <div className="mb-3 rounded-2xl overflow-hidden border border-zinc-800/80 max-h-72 bg-zinc-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrls[0]}
            alt="Tweet Asset"
            className="w-full h-full object-cover max-h-72 hover:scale-[1.01] transition-transform"
          />
        </div>
      );
    }

    if (count === 2) {
      return (
        <div className="mb-3 grid grid-cols-2 gap-1 rounded-2xl overflow-hidden border border-zinc-800/80 h-56 bg-zinc-900">
          {mediaUrls.slice(0, 2).map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={url} alt={`Media ${i}`} className="w-full h-full object-cover" />
          ))}
        </div>
      );
    }

    if (count === 3) {
      return (
        <div className="mb-3 grid grid-cols-2 gap-1 rounded-2xl overflow-hidden border border-zinc-800/80 h-64 bg-zinc-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrls[0]} alt="Media 0" className="w-full h-full object-cover row-span-2" />
          <div className="grid grid-rows-2 gap-1 h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaUrls[1]} alt="Media 1" className="w-full h-full object-cover" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaUrls[2]} alt="Media 2" className="w-full h-full object-cover" />
          </div>
        </div>
      );
    }

    // 4 or more
    return (
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-2xl overflow-hidden border border-zinc-800/80 h-64 bg-zinc-900 relative">
        {mediaUrls.slice(0, 4).map((url, i) => (
          <div key={i} className="relative w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Media ${i}`} className="w-full h-full object-cover" />
            {i === 3 && count > 4 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-lg">
                +{count - 4}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-black text-white rounded-2xl border border-zinc-800 p-4 shadow-xl font-sans">
      {tweets.map((tweetText, index) => {
        const isLast = index === tweets.length - 1;
        return (
          <div key={index} className="relative flex gap-3 pb-4">
            {/* Thread Connector Line */}
            {!isLast && (
              <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-zinc-800" />
            )}

            {/* Profile Avatar */}
            <div className="relative flex-shrink-0 z-10">
              {profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover border border-zinc-800 shadow"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center font-bold text-white text-sm shadow">
                  {initials}
                </div>
              )}
            </div>

            {/* Tweet Content Body */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sm text-zinc-100 hover:underline cursor-pointer">
                    {displayName}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 fill-sky-400 text-black inline" />
                  <span className="text-xs text-zinc-500">{displayHandle}</span>
                  <span className="text-zinc-600 text-xs">·</span>
                  <span className="text-xs text-zinc-500">Now</span>
                </div>
                <button className="text-zinc-500 hover:text-zinc-300 p-1">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              {/* Text */}
              <div className="text-sm leading-relaxed text-zinc-200 break-words whitespace-pre-line mb-3">
                {renderFormattedText(tweetText)}
              </div>

              {/* Media Container (Grid of 1-4 images attached to first tweet) */}
              {index === 0 && renderMediaGrid()}

              {/* Action Bar */}
              <div className="flex items-center justify-between text-zinc-500 text-xs pt-1 max-w-md">
                <button className="flex items-center gap-1.5 hover:text-sky-400 transition-colors group">
                  <div className="p-1.5 rounded-full group-hover:bg-sky-500/10">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <span>14</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors group">
                  <div className="p-1.5 rounded-full group-hover:bg-emerald-500/10">
                    <Repeat2 className="w-4 h-4" />
                  </div>
                  <span>28</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-pink-500 transition-colors group">
                  <div className="p-1.5 rounded-full group-hover:bg-pink-500/10">
                    <Heart className="w-4 h-4" />
                  </div>
                  <span>142</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-sky-400 transition-colors group">
                  <div className="p-1.5 rounded-full group-hover:bg-sky-500/10">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <span>37</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-sky-400 transition-colors group">
                  <div className="p-1.5 rounded-full group-hover:bg-sky-500/10">
                    <Share className="w-4 h-4" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {isThread && (
        <div className="mt-2 text-center text-xs text-sky-400 font-medium py-1.5 px-3 rounded-lg bg-sky-500/10 border border-sky-500/20">
          🧵 Typefully auto-thread preview enabled (length exceeds 280 chars)
        </div>
      )}
    </div>
  );
};
