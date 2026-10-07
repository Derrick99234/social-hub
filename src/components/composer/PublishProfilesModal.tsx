'use client';

import React, { useState } from 'react';
import { X, Send, Calendar, CheckSquare, Square, CheckCircle2 } from 'lucide-react';
import { SocialProfile } from '@/types';
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
  const [selectedIds, setSelectedIds] = useState<string[]>(
    profiles.map((p) => p.id)
  );

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

  const handlePublishClick = async () => {
    const selected = profiles.filter((p) => selectedIds.includes(p.id));
    if (selected.length === 0) return;
    await onConfirm(selected);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg glass-panel rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {isScheduling ? (
                <Calendar className="w-5 h-5 text-indigo-400" />
              ) : (
                <Send className="w-5 h-5 text-blue-400" />
              )}
              <span>{isScheduling ? 'Select Profiles to Schedule' : 'Select Profiles to Publish'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose which social accounts to dispatch this content to
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
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Select all bar */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-xs">
            <span className="text-slate-400 font-medium">
              {selectedIds.length} of {profiles.length} profiles selected
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1.5"
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

          {/* Profile options */}
          {profiles.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-slate-950/60 border border-slate-800">
              <p className="text-sm font-semibold text-white mb-1">No Social Profiles Connected</p>
              <p className="text-xs text-slate-400">
                Please add your Typefully or Buffer API keys in Settings to connect your accounts.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {profiles.map((profile) => {
                const isSelected = selectedIds.includes(profile.id);
                const meta = PLATFORMS[profile.network];

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
                    <div className="flex items-center gap-3 min-w-0">
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
                          {profile.network === 'twitter' && 'X'}
                          {profile.network === 'threads' && '@'}
                          {profile.network === 'linkedin' && 'in'}
                          {profile.network === 'instagram' && 'IG'}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-white truncate">
                            {profile.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium uppercase">
                            {meta?.name || profile.network}
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
        <div className="p-5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3">
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
