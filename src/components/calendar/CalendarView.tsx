'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  List,
  Grid as GridIcon,
  Clock,
  Send,
} from 'lucide-react';
import { Post } from '@/types';
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
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid');
  const [selectedDayKey, setSelectedDayKey] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDayKey(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    );
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

  // Filter posts in current month for Agenda view
  const currentMonthPosts = posts
    .filter((p) => {
      const dateStr = p.scheduled_at || p.published_at || p.created_at;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .sort((a, b) => {
      const dateA = new Date(a.scheduled_at || a.published_at || a.created_at).getTime();
      const dateB = new Date(b.scheduled_at || b.published_at || b.created_at).getTime();
      return dateA - dateB;
    });

  const scheduledCountThisMonth = posts.filter((p) => {
    if (!p.scheduled_at) return false;
    const d = new Date(p.scheduled_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const selectedDayPosts = postsByDate[selectedDayKey] || [];
  const selectedDateParts = selectedDayKey.split('-').map(Number);
  const selectedDateObj = new Date(selectedDateParts[0], selectedDateParts[1] - 1, selectedDateParts[2]);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
      {/* Calendar Header */}
      <div className="p-4 sm:p-5 glass-panel rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">
              {scheduledCountThisMonth} post(s) queued for distribution this month
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          {/* View mode toggle: Month Grid vs Agenda List */}
          <div className="flex items-center p-0.5 bg-slate-900 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Month Grid View"
            >
              <GridIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'agenda'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Agenda List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Agenda</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={goToToday}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition-all"
            >
              Today
            </button>
            <div className="flex items-center bg-slate-900 rounded-xl border border-slate-800 p-0.5">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AGENDA VIEW (Mobile-friendly chronological list) */}
      {viewMode === 'agenda' ? (
        <div className="glass-panel rounded-2xl border border-slate-800 shadow-xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Scheduled Campaigns for {monthNames[currentMonth]} {currentYear}
            </h3>
            <span className="text-xs text-blue-400 font-medium">
              {currentMonthPosts.length} Total
            </span>
          </div>

          {currentMonthPosts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No scheduled posts in this month yet. Tap &apos;+&apos; or switch to Grid view to schedule.
            </div>
          ) : (
            <div className="space-y-2.5">
              {currentMonthPosts.map((post) => {
                const dateVal = post.scheduled_at || post.published_at || post.created_at;
                const dateObj = new Date(dateVal);
                return (
                  <div
                    key={post.id}
                    onClick={() => onSelectPost(post)}
                    className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-12 text-center p-1.5 rounded-lg bg-slate-950 border border-slate-800 flex-shrink-0">
                        <span className="block text-[10px] uppercase font-bold text-blue-400">
                          {dateObj.toLocaleDateString([], { month: 'short' })}
                        </span>
                        <span className="block text-sm font-bold text-white leading-none mt-0.5">
                          {dateObj.getDate()}
                        </span>
                      </div>

                      <div className="min-w-0 space-y-1">
                        <h4 className="text-xs font-semibold text-white truncate max-w-md group-hover:text-blue-300 transition-colors">
                          {post.title || post.content.slice(0, 50)}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {post.content}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0 text-xs">
                      {/* Platform pills */}
                      <div className="flex items-center gap-1">
                        {post.channels.map((c) => (
                          <span
                            key={c}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: PLATFORMS[c]?.color || '#3b82f6' }}
                            title={PLATFORMS[c]?.name}
                          />
                        ))}
                      </div>

                      <span className="text-[11px] font-mono text-indigo-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* GRID VIEW (With horizontal scroll support & Day Drawer) */
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            {/* Horizontal scroll wrapper for mobile */}
            <div className="overflow-x-auto no-scrollbar">
              <div className="min-w-[620px] md:min-w-0">
                {/* Days of week header */}
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
                      className="min-h-[90px] sm:min-h-[110px] p-2 border-b border-r border-slate-900/80 bg-slate-950/20"
                    />
                  ))}

                  {/* Days */}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const dateObj = new Date(currentYear, currentMonth, dayNum);
                    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const isToday = new Date().toDateString() === dateObj.toDateString();
                    const isSelected = selectedDayKey === dateKey;
                    const dayPosts = postsByDate[dateKey] || [];

                    return (
                      <div
                        key={dateKey}
                        onClick={() => {
                          setSelectedDayKey(dateKey);
                        }}
                        className={`min-h-[90px] sm:min-h-[115px] p-1.5 sm:p-2 border-b border-r border-slate-900/80 transition-all flex flex-col justify-between group cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/15 ring-1 ring-inset ring-blue-500/50'
                            : isToday
                            ? 'bg-blue-950/20'
                            : 'hover:bg-slate-900/30'
                        }`}
                      >
                        {/* Day Header */}
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                              isToday
                                ? 'bg-blue-600 text-white shadow-sm'
                                : isSelected
                                ? 'bg-indigo-600 text-white font-bold'
                                : 'text-slate-400 group-hover:text-white'
                            }`}
                          >
                            {dayNum}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCreateAtDate(dateObj);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 sm:p-1 text-slate-500 hover:text-white transition-opacity"
                            title="Add post on this date"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Posts scheduled for this day */}
                        <div className="space-y-1 overflow-y-auto max-h-16 sm:max-h-20 no-scrollbar flex-1">
                          {dayPosts.map((post) => (
                            <div
                              key={post.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectPost(post);
                              }}
                              className="p-1 sm:p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-[10px] sm:text-[11px] text-slate-200 transition-all shadow-sm cursor-pointer"
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
          </div>

          {/* Active Day Inspector / Mobile Quick Drawer */}
          <div className="p-4 sm:p-5 glass-panel rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  {selectedDateObj.toLocaleDateString([], {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {selectedDayPosts.length} post(s) scheduled for this date
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onCreateAtDate(selectedDateObj)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule Post on This Date</span>
              </button>
            </div>
          </div>

          {/* If selected day has posts, list them cleanly */}
          {selectedDayPosts.length > 0 && (
            <div className="space-y-2">
              {selectedDayPosts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectPost(p)}
                  className="p-3.5 glass-card rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between gap-3 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-xs text-white truncate">
                        {p.title || p.content.slice(0, 45)}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 uppercase">
                        {p.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{p.content}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-medium">
                      <span>Edit</span>
                      <Send className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
