'use client';

import React, { useState } from 'react';
import {
  Lightbulb,
  Plus,
  Sparkles,
  ArrowRight,
  Mic,
  Tag,
  Clock,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Idea } from '@/types';

interface IdeaInboxProps {
  ideas: Idea[];
  onLoadIdeaIntoComposer: (ideaText: string) => void;
  onRefreshIdeas: () => void;
  userRole?: 'founder' | 'marketer';
}

export const IdeaInbox: React.FC<IdeaInboxProps> = ({
  ideas,
  onLoadIdeaIntoComposer,
  onRefreshIdeas,
  userRole = 'founder',
}) => {
  const [rawText, setRawText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Growth']);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'inbox' | 'converted'>('all');

  const availableTags = ['Growth', 'SaaS', 'Product', 'BehindTheScenes', 'Strategy', 'Hiring', 'CaseStudy'];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleDropIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: rawText,
          author: userRole,
          tags: selectedTags,
        }),
      });

      if (res.ok) {
        setRawText('');
        onRefreshIdeas();
      }
    } catch (err) {
      console.error('Failed to create idea', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateVoiceNote = () => {
    setIsRecording(true);
    setTimeout(() => {
      setRawText(
        'Voice memo transcription: We just crossed 10k users without spending any money on paid marketing. The secret was turning our release notes into storytelling threads on Twitter and carousel breakdowns on LinkedIn. We need to write up the step-by-step framework.'
      );
      setIsRecording(false);
    }, 1200);
  };

  const handleDeleteIdea = async (id: string) => {
    try {
      await fetch(`/api/ideas/${id}`, { method: 'DELETE' });
      onRefreshIdeas();
    } catch (err) {
      console.error('Failed to delete idea', err);
    }
  };

  const filteredIdeas = ideas.filter((idea) => {
    if (activeFilter === 'all') return true;
    return idea.status === activeFilter;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 glass-panel rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Lightbulb className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">Founder Idea Inbox</h2>
          </div>
          <p className="text-xs text-slate-400">
            Zero-friction dropzone for the founder to dump raw thoughts, bullet points &amp; voice memos. The marketer turns them into scheduled campaigns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshIdeas}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all text-xs flex items-center gap-1.5"
            title="Refresh Ideas"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Idea Quick Capture Input Box */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-5 shadow-2xl">
        <form onSubmit={handleDropIdea} className="space-y-4">
          <div className="relative">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Drop a raw thought, bullet points, client quote, or hook idea here... (e.g. 'Why 90% of SaaS founders fail at social media...')"
              rows={3}
              className="w-full p-4 bg-slate-950/70 text-slate-100 placeholder-slate-500 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-sm resize-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Tag selector */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Tags:
              </span>
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSimulateVoiceNote}
                disabled={isRecording}
                className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all"
                title="Dictate or drop voice note transcript"
              >
                <Mic className={`w-3.5 h-3.5 ${isRecording ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
                <span>{isRecording ? 'Listening...' : 'Voice Note'}</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !rawText.trim()}
                className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Drop Idea</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Ideas Feed / Board */}
      <div className="space-y-4">
        {/* Filter bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Filter:</span>
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg ${
                activeFilter === 'all'
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              All ({ideas.length})
            </button>
            <button
              onClick={() => setActiveFilter('inbox')}
              className={`px-2.5 py-1 rounded-lg ${
                activeFilter === 'inbox'
                  ? 'bg-amber-500/20 text-amber-300 font-medium'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Inbox ({ideas.filter((i) => i.status === 'inbox').length})
            </button>
            <button
              onClick={() => setActiveFilter('converted')}
              className={`px-2.5 py-1 rounded-lg ${
                activeFilter === 'converted'
                  ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Polished &amp; Scheduled ({ideas.filter((i) => i.status === 'converted').length})
            </button>
          </div>
        </div>

        {/* Ideas List Cards */}
        {filteredIdeas.length === 0 ? (
          <div className="p-8 text-center glass-panel rounded-2xl border border-slate-800 text-slate-500 text-xs">
            No ideas in this view. Drop one above!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredIdeas.map((idea) => (
              <div
                key={idea.id}
                className="p-5 glass-card rounded-2xl border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-2 flex-1">
                  <p className="text-sm text-slate-200 leading-relaxed break-words whitespace-pre-line">
                    {idea.raw_text}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(idea.created_at).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span className="capitalize text-slate-400">By {idea.author}</span>
                    {idea.tags && idea.tags.length > 0 && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          {idea.tags.map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded bg-slate-900 text-amber-400/90 border border-slate-800"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onLoadIdeaIntoComposer(idea.raw_text)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 hover:border-blue-600 font-medium text-xs flex items-center gap-1.5 transition-all shadow-sm"
                    title="Send to Marketer: Open in Composer and apply multi-platform formatting"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-400 group-hover:text-white" />
                    <span>Move to Composer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteIdea(idea.id)}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
                    title="Delete idea"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
