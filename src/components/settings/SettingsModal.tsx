'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Key,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  Save,
  Users,
  Plus,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { ServiceHealthStatus, SocialProfile } from '@/types';
import { PLATFORMS } from '@/lib/constants/platforms';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: ServiceHealthStatus | null;
  onRefreshStatus: () => void;
  onProfilesUpdated?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  status: _status,
  onRefreshStatus,
  onProfilesUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'profiles' | 'apikeys'>('profiles');

  // Multi-key lists for Typefully and Buffer
  const [typefullyApiKeys, setTypefullyApiKeys] = useState<string[]>(['']);
  const [bufferAccessTokens, setBufferAccessTokens] = useState<string[]>(['']);

  // Key visibility toggles (keyed by index)
  const [showTypefullyIndices, setShowTypefullyIndices] = useState<Record<number, boolean>>({});
  const [showBufferIndices, setShowBufferIndices] = useState<Record<number, boolean>>({});

  // Supabase & Auth
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [supabaseServiceKey, setSupabaseServiceKey] = useState('');
  const [supabaseBucket, setSupabaseBucket] = useState('media');
  const [showSupabaseKey, setShowSupabaseKey] = useState(false);
  const [dashboardPasskey, setDashboardPasskey] = useState('marketer123');

  // Profiles State
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Save State
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Load existing settings and profiles on open
  useEffect(() => {
    if (!isOpen) return;

    // 1. Fetch current settings from /api/settings
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.typefullyApiKeys) && data.typefullyApiKeys.length > 0) {
          setTypefullyApiKeys(data.typefullyApiKeys);
        } else if (data.typefullyApiKey) {
          setTypefullyApiKeys([data.typefullyApiKey]);
        }

        if (Array.isArray(data.bufferAccessTokens) && data.bufferAccessTokens.length > 0) {
          setBufferAccessTokens(data.bufferAccessTokens);
        } else if (data.bufferAccessToken) {
          setBufferAccessTokens([data.bufferAccessToken]);
        }

        if (data.supabaseUrl) setSupabaseUrl(data.supabaseUrl);
        if (data.supabaseAnonKey) setSupabaseAnonKey(data.supabaseAnonKey);
        if (data.supabaseServiceKey) setSupabaseServiceKey(data.supabaseServiceKey);
        if (data.supabaseBucket) setSupabaseBucket(data.supabaseBucket);
        if (data.dashboardPasskey) setDashboardPasskey(data.dashboardPasskey);
      })
      .catch((err) => console.warn('Could not load settings:', err));

    // 2. Fetch current connected profiles from /api/profiles
    setIsLoadingProfiles(true);
    fetch('/api/profiles')
      .then((res) => res.json())
      .then((data) => {
        if (data.profiles && Array.isArray(data.profiles)) {
          setProfiles(data.profiles);
        }
      })
      .catch((err) => console.warn('Could not load profiles:', err))
      .finally(() => setIsLoadingProfiles(false));
  }, [isOpen]);

  if (!isOpen) return null;

  // Toggle Visibility helpers
  const toggleTypefullyVisibility = (idx: number) => {
    setShowTypefullyIndices((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleBufferVisibility = (idx: number) => {
    setShowBufferIndices((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Multiple Typefully Keys helpers
  const handleTypefullyKeyChange = (index: number, val: string) => {
    setTypefullyApiKeys((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const addTypefullyKey = () => {
    setTypefullyApiKeys((prev) => [...prev, '']);
  };

  const removeTypefullyKey = (index: number) => {
    if (typefullyApiKeys.length <= 1) {
      setTypefullyApiKeys(['']);
      return;
    }
    setTypefullyApiKeys((prev) => prev.filter((_, i) => i !== index));
  };

  // Multiple Buffer Tokens helpers
  const handleBufferTokenChange = (index: number, val: string) => {
    setBufferAccessTokens((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const addBufferToken = () => {
    setBufferAccessTokens((prev) => [...prev, '']);
  };

  const removeBufferToken = (index: number) => {
    if (bufferAccessTokens.length <= 1) {
      setBufferAccessTokens(['']);
      return;
    }
    setBufferAccessTokens((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Fetch Connected Profiles
  const handleSyncProfiles = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);

    try {
      const res = await fetch('/api/settings/sync-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typefullyApiKeys: typefullyApiKeys.filter((k) => k.trim()),
          bufferAccessTokens: bufferAccessTokens.filter((t) => t.trim()),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync profiles from APIs');
      }

      if (data.profiles && Array.isArray(data.profiles) && data.profiles.length > 0) {
        setProfiles(data.profiles);
        setSyncFeedback({
          type: 'success',
          message: data.message || `Discovered ${data.profiles.length} connected profile(s)!`,
        });

        if (onProfilesUpdated) {
          onProfilesUpdated();
        }
        await onRefreshStatus();
      } else {
        setSyncFeedback({
          type: 'error',
          message: 'No social profiles found. Please verify your API keys in the API Keys tab.',
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown sync error';
      setSyncFeedback({
        type: 'error',
        message,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Save API Keys
  const handleSaveKeys = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingKeys(true);
    setSaveFeedback(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typefullyApiKeys: typefullyApiKeys.filter((k) => k.trim()),
          bufferAccessTokens: bufferAccessTokens.filter((t) => t.trim()),
          supabaseUrl,
          supabaseAnonKey,
          supabaseServiceKey,
          supabaseBucket,
          dashboardPasskey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setSaveFeedback({
        type: 'success',
        message: 'Settings saved successfully.',
      });

      await onRefreshStatus();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error saving settings';
      setSaveFeedback({
        type: 'error',
        message,
      });
    } finally {
      setIsSavingKeys(false);
    }
  };

  const hasAnyKey =
    typefullyApiKeys.some((k) => k && !k.includes('your_') && k.trim() !== '') ||
    bufferAccessTokens.some((t) => t && !t.includes('your_') && t.trim() !== '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col glass-panel rounded-2xl shadow-2xl border border-slate-800 text-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Settings</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage social profiles and API credentials.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (2 Clean Tabs) */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800/80 bg-slate-900/30 text-xs font-medium">
          <button
            onClick={() => setActiveTab('profiles')}
            className={`flex items-center gap-2 pb-2.5 px-2 border-b-2 transition-all font-semibold ${
              activeTab === 'profiles'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Connected Profiles ({profiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('apikeys')}
            className={`flex items-center gap-2 pb-2.5 px-2 border-b-2 transition-all font-semibold ${
              activeTab === 'apikeys'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Keys</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: CONNECTED PROFILES */}
          {activeTab === 'profiles' && (
            <div className="space-y-4">
              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/60">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Available Profiles for Publishing ({profiles.length})
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select which profiles to target in the final publish pop-up modal.
                  </p>
                </div>

                <button
                  onClick={handleSyncProfiles}
                  disabled={isSyncing}
                  className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow flex items-center gap-2 transition-all disabled:opacity-50"
                  title="Query Typefully and Buffer APIs for connected profiles"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Fetching Profiles...' : 'Fetch Connected Profiles'}</span>
                </button>
              </div>

              {/* Sync Feedback Alert */}
              {syncFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 font-medium ${
                    syncFeedback.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {syncFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  )}
                  <span>{syncFeedback.message}</span>
                </div>
              )}

              {/* Profiles Display */}
              {isLoadingProfiles ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="text-xs">Loading social profiles...</span>
                </div>
              ) : profiles.length === 0 ? (
                /* Empty state with button to take user to API Keys tab */
                <div className="p-8 rounded-xl bg-slate-900/50 border border-slate-800 text-center space-y-3">
                  <Users className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="text-sm font-semibold text-white">No Connected Profiles Found</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {hasAnyKey
                      ? 'Click "Fetch Connected Profiles" above to load your accounts, or check your keys.'
                      : 'Please add your Typefully or Buffer API keys to load your social profiles.'}
                  </p>
                  <button
                    onClick={() => setActiveTab('apikeys')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-all"
                  >
                    <span>Go to API Keys</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {profiles.map((profile) => {
                    const platformInfo = PLATFORMS[profile.network] || {
                      name: profile.network,
                      icon: '🌐',
                      color: 'bg-slate-700',
                    };

                    return (
                      <div
                        key={profile.id}
                        className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex items-start gap-3"
                      >
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          {profile.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={profile.avatarUrl}
                              alt={profile.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-700 shadow-sm"
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-full ${platformInfo.color} flex items-center justify-center text-white text-sm font-bold shadow-sm`}
                            >
                              {platformInfo.icon}
                            </div>
                          )}
                          <span
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ${platformInfo.color} flex items-center justify-center text-[8px] text-white ring-2 ring-slate-950`}
                          >
                            {platformInfo.icon}
                          </span>
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h5 className="text-xs font-bold text-white truncate">{profile.name}</h5>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Ready
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            {profile.handle}
                          </p>

                          <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                              {profile.network === 'twitter'
                                ? 'X / Twitter'
                                : profile.network === 'linkedin'
                                ? profile.profileType === 'page'
                                  ? 'LinkedIn Page'
                                  : 'LinkedIn Profile'
                                : profile.network.charAt(0).toUpperCase() + profile.network.slice(1)}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-950/80 text-slate-400 font-mono border border-slate-800 text-[9px]">
                              {profile.service === 'typefully' ? 'Typefully v2' : 'Buffer GraphQL'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: API KEYS */}
          {activeTab === 'apikeys' && (
            <form onSubmit={handleSaveKeys} className="space-y-5">
              {saveFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 font-medium ${
                    saveFeedback.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {saveFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  )}
                  <span>{saveFeedback.message}</span>
                </div>
              )}

              {/* 1. Typefully API Keys (Multi-key support) */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Typefully API Keys (X / Twitter &amp; Threads)
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Powers draft creation and scheduling for X and Threads.
                    </p>
                  </div>
                  <a
                    href="https://typefully.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    typefully.com <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="space-y-2">
                  {typefullyApiKeys.map((key, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showTypefullyIndices[idx] ? 'text' : 'password'}
                          value={key}
                          onChange={(e) => handleTypefullyKeyChange(idx, e.target.value)}
                          placeholder={
                            typefullyApiKeys.length > 1
                              ? `Typefully API Key #${idx + 1}`
                              : 'Enter Typefully API Key'
                          }
                          className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => toggleTypefullyVisibility(idx)}
                          className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                        >
                          {showTypefullyIndices[idx] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {typefullyApiKeys.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTypefullyKey(idx)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
                          title="Remove this key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addTypefullyKey}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Typefully Key</span>
                  </button>
                </div>
              </div>

              {/* 2. Buffer Access Tokens (Multi-key support, NO channel IDs required) */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Buffer Access Tokens (LinkedIn &amp; Instagram)
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Powers multi-account publishing. Channel IDs are automatically detected!
                    </p>
                  </div>
                  <a
                    href="https://buffer.com/developers/api"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    buffer.com <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="space-y-2">
                  {bufferAccessTokens.map((token, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showBufferIndices[idx] ? 'text' : 'password'}
                          value={token}
                          onChange={(e) => handleBufferTokenChange(idx, e.target.value)}
                          placeholder={
                            bufferAccessTokens.length > 1
                              ? `Buffer Access Token #${idx + 1}`
                              : 'Enter Buffer Access Token'
                          }
                          className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => toggleBufferVisibility(idx)}
                          className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                        >
                          {showBufferIndices[idx] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {bufferAccessTokens.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBufferToken(idx)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
                          title="Remove this token"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addBufferToken}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Buffer Token</span>
                  </button>
                </div>
              </div>

              {/* 3. Supabase Cloud (Database & Media Storage) */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Supabase Cloud Storage &amp; Database
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Persistent storage for queue, founder ideas, and carousel media uploads.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Supabase Project URL
                    </label>
                    <input
                      type="text"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      placeholder="https://your-project.supabase.co"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Service Role Key
                      </label>
                      <div className="relative">
                        <input
                          type={showSupabaseKey ? 'text' : 'password'}
                          value={supabaseServiceKey}
                          onChange={(e) => setSupabaseServiceKey(e.target.value)}
                          placeholder="your_service_role_key"
                          className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                          className="absolute right-3 top-2 text-slate-500 hover:text-slate-300"
                        >
                          {showSupabaseKey ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Storage Bucket
                      </label>
                      <input
                        type="text"
                        value={supabaseBucket}
                        onChange={(e) => setSupabaseBucket(e.target.value)}
                        placeholder="media"
                        className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Dashboard Passkey */}
              <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h5 className="text-xs font-bold text-white">Dashboard Passkey</h5>
                  <p className="text-[11px] text-slate-400">Used to access this dashboard.</p>
                </div>
                <input
                  type="text"
                  value={dashboardPasskey}
                  onChange={(e) => setDashboardPasskey(e.target.value)}
                  className="w-40 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-200 font-mono text-xs text-right focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSavingKeys}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingKeys ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
