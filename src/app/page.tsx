'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { PostComposer } from '@/components/composer/PostComposer';
import { IdeaInbox } from '@/components/ideas/IdeaInbox';
import { ContentQueue } from '@/components/queue/ContentQueue';
import { CalendarView } from '@/components/calendar/CalendarView';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { Post, Idea, ServiceHealthStatus } from '@/types';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [role, setRole] = useState<'founder' | 'marketer'>('marketer');

  // Calendar is now the default landing tab
  const [currentTab, setCurrentTab] = useState<'calendar' | 'ideas' | 'queue'>('calendar');

  const [posts, setPosts] = useState<Post[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [status, setStatus] = useState<ServiceHealthStatus | null>(null);

  // Composer popup modal state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerPost, setComposerPost] = useState<Partial<Post> | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 1. Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/check');
      const data = await res.json();
      if (data.authenticated) {
        setIsAuthenticated(true);
        if (data.role) setRole(data.role as 'founder' | 'marketer');
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  // 2. Fetch posts
  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      if (data.posts) setPosts(data.posts);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    }
  }, []);

  // 3. Fetch ideas
  const fetchIdeas = useCallback(async () => {
    try {
      const res = await fetch('/api/ideas');
      const data = await res.json();
      if (data.ideas) setIdeas(data.ideas);
    } catch (err) {
      console.error('Failed to fetch ideas', err);
    }
  }, []);

  // 4. Fetch service status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch status', err);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
      fetchIdeas();
      fetchStatus();
    }
  }, [isAuthenticated, fetchPosts, fetchIdeas, fetchStatus]);

  // Handle successful login
  const handleAuthSuccess = (selectedRole: string) => {
    setIsAuthenticated(true);
    setRole(selectedRole as 'founder' | 'marketer');
    setCurrentTab('calendar');
    fetchPosts();
    fetchIdeas();
    fetchStatus();
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setIsAuthenticated(false);
    }
  };

  // Open empty composer modal
  const handleOpenNewComposer = () => {
    setComposerPost({
      content: '',
      title: '',
      channels: ['twitter', 'threads', 'linkedin', 'instagram'],
      media_urls: [],
    });
    setIsComposerOpen(true);
  };

  // Bridge action: Founder Idea -> Open Composer Modal with pre-filled content
  const handleLoadIdeaIntoComposer = (ideaText: string) => {
    setComposerPost({
      content: ideaText,
      channels: ['twitter', 'threads', 'linkedin', 'instagram'],
      title: 'From Founder Idea Inbox',
      media_urls: [],
    });
    setIsComposerOpen(true);
  };

  // Bridge action: Edit post from Queue -> Open Composer Modal
  const handleEditPost = (post: Post) => {
    setComposerPost(post);
    setIsComposerOpen(true);
  };

  // Bridge action: Create post from Calendar date click -> Open Composer Modal
  const handleCreateAtCalendarDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    setComposerPost({
      content: '',
      title: '',
      scheduled_at: `${yyyy}-${mm}-${dd}T09:00:00.000Z`,
      channels: ['twitter', 'threads', 'linkedin', 'instagram'],
      media_urls: [],
    });
    setIsComposerOpen(true);
  };

  const handleChangeRole = (newRole: 'founder' | 'marketer') => {
    setRole(newRole);
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onSuccess={handleAuthSuccess} />;
  }

  const inboxIdeasCount = ideas.filter((i) => i.status === 'inbox').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[25%] -left-[10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute top-[30%] -right-[15%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px]" />
        <div className="absolute -bottom-[20%] left-[30%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[130px]" />
      </div>

      {/* Main Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenComposer={handleOpenNewComposer}
        role={role}
        onChangeRole={handleChangeRole}
        status={status}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
        unreadIdeasCount={inboxIdeasCount}
      />

      {/* Main Content Workspace (Calendar is default landing) */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 md:pb-8">
        {currentTab === 'calendar' && (
          <CalendarView
            posts={posts}
            onSelectPost={handleEditPost}
            onCreateAtDate={handleCreateAtCalendarDate}
          />
        )}

        {currentTab === 'ideas' && (
          <IdeaInbox
            ideas={ideas}
            onLoadIdeaIntoComposer={handleLoadIdeaIntoComposer}
            onRefreshIdeas={fetchIdeas}
            userRole={role}
          />
        )}

        {currentTab === 'queue' && (
          <ContentQueue
            posts={posts}
            onEditPost={handleEditPost}
            onRefreshPosts={fetchPosts}
          />
        )}
      </main>

      {/* Composer Modal Pop-Up */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-6xl max-h-[96vh] sm:max-h-[92vh] overflow-y-auto p-0 sm:p-2 rounded-2xl sm:rounded-3xl">
            <PostComposer
              initialPost={composerPost}
              onClose={() => setIsComposerOpen(false)}
              onPostDispatched={() => {
                fetchPosts();
                fetchIdeas();
              }}
              onSavedDraft={() => {
                fetchPosts();
              }}
              userRole={role}
            />
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        status={status}
        onRefreshStatus={fetchStatus}
        onProfilesUpdated={() => {
          fetchPosts();
          fetchStatus();
        }}
      />
    </div>
  );
}
