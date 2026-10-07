'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Calendar,
  CheckSquare,
  Square,
  CheckCircle2,
  Building2,
  User,
  Layers,
} from 'lucide-react';
import { SocialProfile, PlatformId } from '@/types';
import { PLATFORMS } from '@/lib/constants/platforms';

interface PublishProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: SocialProfile[];
  onConfirm: (selectedProfiles: SocialProfile[]) => Promise<void>;
  isScheduling: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
  isSubmitting: boolean;
}

export const PublishProfilesModal: React.FC<PublishProfilesModalProps> = ({
  isOpen,
  onClose,
  profiles,
  onConfirm,
  isScheduling,
  scheduledDate,
  scheduledTime,
  isSubmitting,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds((prev) => (prev.length > 0 ? prev : profiles.map((p) => p.id)));
    }
  }, [isOpen, profiles]);

  if (!isOpen) return null;

  const toggleProfile = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === profiles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(profiles.map((p) => p.id));
    }
  };

  const toggleNetwork = (network: PlatformId) => {
    const networkProfileIds = profiles.filter((p) => p.network === network).map((p) => p.id);
    const allSelected = networkProfileIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !networkProfileIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...networkProfileIds])));
    }
  };

  const handlePublishClick = async () => {
    const selected = profiles.filter((p) => selectedIds.includes(p.id));
    if (selected.length === 0) return;
    await onConfirm(selected);
  };

  // Group profiles by network for crystal-clear account distinction
  const networkOrder: PlatformId[] = ['linkedin', 'instagram', 'twitter', 'threads'];
  const groupedProfiles = networkOrder
    .map((network) => ({
      network,
      meta: PLATFORMS[network],
      items: profiles.filter((p) => p.network === network),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg glass-panel rounded-2xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {isScheduling ? (
                <Calendar className="w-5 h-5 text-indigo-400" />
              ) : (
                <Send className="w-5 h-5 text-blue-400" />
              )}
              <span>{isScheduling ? 'Select Target Profiles' : 'Select Target Profiles'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose the specific social accounts to receive this post
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profiles List */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Select all bar */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-xs">
            <span className="text-slate-400 font-medium">
              {selectedIds.length} of {profiles.length} profiles selected
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1.5 transition-colors"
            >
              {selectedIds.length === profiles.length ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Select All</span>
                </>
              )}
            </button>
          </div>

          {/* Profile options grouped by platform */}
          {profiles.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-slate-950/60 border border-slate-800">
              <p className="text-sm font-semibold text-white mb-1">No Social Profiles Connected</p>
              <p className="text-xs text-slate-400">
                Please add your Typefully or Buffer API keys in Settings to connect your accounts.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedProfiles.map(({ network, meta, items }) => {
                const allGroupSelected = items.every((p) => selectedIds.includes(p.id));
                const someGroupSelected = items.some((p) => selectedIds.includes(p.id));

                return (
                  <div key={network} className="space-y-2">
                    {/* Platform Group Header */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: meta?.color || '#3b82f6' }}
                        />
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                          {meta?.name || network}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ({items.length})
                        </span>
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => toggleNetwork(network)}
                          className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          {allGroupSelected ? 'Deselect all' : 'Select all'}
                        </button>
                      )}
                    </div>

                    {/* Platform Cards */}
                    <div className="space-y-1.5">
                      {items.map((profile) => {
                        const isSelected = selectedIds.includes(profile.id);
                        const isPage = profile.profileType === 'page';

                        return (
                          <div
                            key={profile.id}
                            onClick={() => toggleProfile(profile.id)}
                            className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-slate-900 border-blue-500/50 shadow-sm'
                                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 opacity-75'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Avatar photo or network badge */}
                              {profile.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={profile.avatarUrl}
                                  alt={profile.name}
                                  className="w-10 h-10 rounded-full object-cover shadow-sm flex-shrink-0 border border-slate-700"
                                />
                              ) : (
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm flex-shrink-0"
                                  style={{ backgroundColor: meta?.color || '#3b82f6' }}
                                >
                                  {profile.name.charAt(0).toUpperCase()}
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-xs text-white truncate max-w-[200px]">
                                    {profile.name}
                                  </span>

                                  {/* Profile type badge */}
                                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                                    {isPage ? (
                                      <>
                                        <Building2 className="w-2.5 h-2.5 text-blue-400" />
                                        <span>Company Page</span>
                                      </>
                                    ) : (
                                      <>
                                        <User className="w-2.5 h-2.5 text-emerald-400" />
                                        <span>Personal</span>
                                      </>
                                    )}
                                  </span>

                                  {/* Service badge */}
                                  <span className="text-[9px] px-1 rounded bg-slate-800/60 text-slate-400 uppercase font-mono">
                                    {profile.service}
                                  </span>
                                </div>

                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {profile.handle}
                                </p>
                              </div>
                            </div>

                            {/* Checkbox indicator */}
                            <div className="flex items-center justify-center pl-3">
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                  isSelected
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'border border-slate-700 bg-slate-900'
                                }`}
                              >
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Scheduling timing badge if scheduling */}
          {isScheduling && scheduledDate && (
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span>
                Queueing for: <strong>{scheduledDate} at {scheduledTime || '09:00'}</strong> (Local Time)
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-all"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handlePublishClick}
            disabled={isSubmitting || selectedIds.length === 0}
            className={`px-5 py-2.5 rounded-xl font-medium text-xs text-white shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 ${
              isScheduling
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-500/25'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25'
            }`}
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isScheduling ? (
              <Calendar className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>
              {isScheduling
                ? `Confirm & Schedule (${selectedIds.length} Profiles)`
                : `Confirm & Publish (${selectedIds.length} Profiles)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
