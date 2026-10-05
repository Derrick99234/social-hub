'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Plus,
} from 'lucide-react';
import { Post, PlatformId } from '@/types';
import { PLATFORMS } from '@/lib/constants/platforms';

interface CalendarViewProps {
  posts: Post[];
  onSelectPost: (post: Post) => void;
  onCreateAtDate: (date: Date) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  posts,
  onSelectPost,
  onCreateAtDate,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Map posts by date string 'YYYY-MM-DD'
  const postsByDate: Record<string, Post[]> = {};
  posts.forEach((post) => {
    const dateStr = post.scheduled_at || post.published_at || post.created_at;
    if (dateStr) {
      const d = new Date(dateStr);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!postsByDate[key]) postsByDate[key] = [];
      postsByDate[key].push(post);
    }
  });

  const scheduledCountThisMonth = posts.filter((p) => {
    if (!p.scheduled_at) return false;
    const d = new Date(p.scheduled_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Calendar Header */}
      <div className="p-5 glass-panel rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <p className="text-xs text-slate-400">
              {scheduledCountThisMonth} post(s) queued for distribution this month
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition-all"
          >
            Today
          </button>
          <div className="flex items-center bg-slate-900 rounded-xl border border-slate-800 p-0.5">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-panel rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Days of week */}
        <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900/60 text-center py-2.5">
          {weekDays.map((d) => (
            <div key={d} className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 auto-rows-fr bg-slate-950/40">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="min-h-[110px] p-2 border-b border-r border-slate-900/80 bg-slate-950/20"
            />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateObj = new Date(currentYear, currentMonth, dayNum);
            const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isToday =
              new Date().toDateString() === dateObj.toDateString();

            const dayPosts = postsByDate[dateKey] || [];

            return (
              <div
                key={dateKey}
                onClick={() => onCreateAtDate(dateObj)}
                className={`min-h-[115px] p-2 border-b border-r border-slate-900/80 transition-all hover:bg-slate-900/30 flex flex-col justify-between group cursor-pointer ${
                  isToday ? 'bg-blue-950/10' : ''
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 group-hover:text-white'
                    }`}
                  >
                    {dayNum}
                  </span>

                  <span className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-white transition-opacity">
                    <Plus className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* Posts scheduled for this day */}
                <div className="space-y-1 overflow-y-auto max-h-20 no-scrollbar flex-1">
                  {dayPosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPost(post);
                      }}
                      className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-200 transition-all shadow-sm cursor-pointer"
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        {post.channels.map((c) => (
                          <span
                            key={c}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: PLATFORMS[c]?.color || '#3b82f6' }}
                          />
                        ))}
                        {post.scheduled_at && (
                          <span className="text-[9px] text-slate-400 font-mono">
                            {new Date(post.scheduled_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      <p className="truncate font-medium text-slate-200">
                        {post.title || post.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
