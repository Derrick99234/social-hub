'use client';

import React from 'react';
import {
  Share2,
  Calendar,
  Layers,
  Lightbulb,
  Settings,
  LogOut,
  Plus,
} from 'lucide-react';
import { ServiceHealthStatus } from '@/types';

interface HeaderProps {
  currentTab: 'calendar' | 'ideas' | 'queue';
  onSelectTab: (tab: 'calendar' | 'ideas' | 'queue') => void;
  onOpenComposer: () => void;
  role: 'founder' | 'marketer';
  onChangeRole: (role: 'founder' | 'marketer') => void;
  status: ServiceHealthStatus | null;
  onOpenSettings: () => void;
  onLogout: () => void;
  unreadIdeasCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenComposer,
  role,
  onChangeRole,
  status: _status,
  onOpenSettings,
  onLogout,
  unreadIdeasCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Brand / Logo */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 text-white shadow-md shadow-blue-500/20">
              <Share2 className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white tracking-tight">Social Hub</span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">1-Click Multi-Channel Distribution</p>
            </div>
          </div>

          {/* Center: Navigation Tabs (Calendar default landing) */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
            <button
              onClick={() => onSelectTab('calendar')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'calendar'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>

            <button
              onClick={() => onSelectTab('ideas')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                currentTab === 'ideas'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Idea Inbox</span>
              {unreadIdeasCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                  {unreadIdeasCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('queue')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'queue'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Content Queue</span>
            </button>
          </nav>

          {/* Right: + New Post Pop-up Trigger, Role Switcher, Settings & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Pop-up Composer Trigger (Desktop/Tablet) */}
            <button
              type="button"
              onClick={onOpenComposer}
              className="hidden sm:flex px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-blue-500/20 items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Post</span>
            </button>

            {/* Role Switcher Pill (Responsive) */}
            <div className="flex items-center p-0.5 bg-slate-900/90 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => onChangeRole('founder')}
                className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  role === 'founder'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Founder Mode: Quick ideas drop & review"
              >
                <span>👔</span>
                <span className="hidden sm:inline ml-1">Founder</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeRole('marketer')}
                className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  role === 'marketer'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Marketer Mode: Full multi-platform scheduler"
              >
                <span>🚀</span>
                <span className="hidden sm:inline ml-1">Marketer</span>
              </button>
            </div>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900/90 hover:bg-slate-800 hover:text-white border border-slate-700/80 hover:border-slate-600 shadow-sm transition-all"
              title="Settings & API Keys"
            >
              <Settings className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-400" />
              <span className="hidden sm:inline text-[11px] font-semibold">
                Settings
              </span>
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all"
              title="Lock / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Fixed for Thumb Reachability) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-3 py-2 flex items-center justify-around text-xs shadow-2xl">
        <button
          onClick={() => onSelectTab('calendar')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            currentTab === 'calendar' ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span className="text-[10px]">Calendar</span>
        </button>

        <button
          onClick={() => onSelectTab('ideas')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl relative transition-all ${
            currentTab === 'ideas' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Lightbulb className="w-4 h-4" />
            {unreadIdeasCount > 0 && (
              <span className="absolute -top-1 -right-2.5 w-3.5 h-3.5 flex items-center justify-center rounded-full text-[9px] bg-amber-400 text-slate-950 font-bold">
                {unreadIdeasCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Ideas</span>
        </button>

        {/* Center Floating Action Button for Mobile: + New Post */}
        <button
          onClick={onOpenComposer}
          className="flex items-center justify-center w-11 h-11 -mt-4 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 text-white shadow-lg shadow-blue-500/40 border-2 border-slate-950 active:scale-95 transition-transform"
          title="Create New Post"
        >
          <Plus className="w-5 h-5" />
        </button>

        <button
          onClick={() => onSelectTab('queue')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            currentTab === 'queue' ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px]">Queue</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
        >
          <Settings className="w-4 h-4" />
          <span className="text-[10px]">Settings</span>
        </button>
      </nav>
    </header>
  );
};
