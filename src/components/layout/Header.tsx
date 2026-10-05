'use client';

import React from 'react';
import {
  Share2,
  Calendar,
  Layers,
  Lightbulb,
  Edit3,
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
  status,
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

          {/* Right: + New Post Pop-up Trigger, Role Switcher, Status & Profile */}
          <div className="flex items-center gap-3">
            {/* Pop-up Composer Trigger */}
            <button
              type="button"
              onClick={onOpenComposer}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Post</span>
            </button>

            {/* Role Switcher Pill */}
            <div className="flex items-center p-0.5 bg-slate-900/90 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => onChangeRole('founder')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  role === 'founder'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Founder Mode: Quick ideas drop & review"
              >
                👔 Founder
              </button>
              <button
                type="button"
                onClick={() => onChangeRole('marketer')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  role === 'marketer'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Marketer Mode: Full multi-platform scheduler"
              >
                🚀 Marketer
              </button>
            </div>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900/90 hover:bg-slate-800 hover:text-white border border-slate-700/80 hover:border-slate-600 shadow-sm transition-all"
              title="Settings & API Keys"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-semibold">
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

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-900 text-xs">
          <button
            onClick={() => onSelectTab('calendar')}
            className={`flex items-center gap-1 py-1 px-2.5 rounded-md ${
              currentTab === 'calendar' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => onSelectTab('ideas')}
            className={`flex items-center gap-1 py-1 px-2.5 rounded-md relative ${
              currentTab === 'ideas' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Ideas</span>
            {unreadIdeasCount > 0 && (
              <span className="w-4 h-4 flex items-center justify-center rounded-full text-[9px] bg-amber-400 text-slate-950 font-bold">
                {unreadIdeasCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onSelectTab('queue')}
            className={`flex items-center gap-1 py-1 px-2.5 rounded-md ${
              currentTab === 'queue' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Queue</span>
          </button>
          <button
            onClick={onOpenComposer}
            className="flex items-center gap-1 py-1 px-2.5 rounded-md bg-blue-600 text-white font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>
      </div>
    </header>
  );
};
