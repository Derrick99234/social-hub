'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Lightbulb,
  Plus,
  Sparkles,
  ArrowRight,
  Mic,
  MicOff,
  Tag,
  Clock,
  Trash2,
  RefreshCw,
  AlertCircle,
  Radio,
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
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'inbox' | 'converted'>('all');

  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>('');

  const availableTags = ['Growth', 'SaaS', 'Product', 'BehindTheScenes', 'Strategy', 'Hiring', 'CaseStudy'];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleDropIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    if (isRecording) {
      stopVoiceRecording();
    }

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

  // Real Speech-to-Text Voice Dictation via Web Speech API
  const startVoiceRecording = () => {
    setSpeechError(null);

    const SpeechRecognition =
      (typeof window !== 'undefined' &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;

    if (!SpeechRecognition) {
      setSpeechError(
        'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari for voice dictation.'
      );
      return;
    }

    try {
      baseTextRef.current = rawText;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        const base = baseTextRef.current ? baseTextRef.current.trim() + ' ' : '';
        setRawText(base + transcript.trim());
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission was denied. Please allow microphone access in your browser settings.');
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Voice error: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not activate microphone';
      setSpeechError(message);
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const handleToggleVoiceRecording = () => {
    if (isRecording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
    };
  }, []);


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
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-6 glass-panel rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Founder Idea Inbox</h2>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400">
            Zero-friction dropzone for the founder to dump raw thoughts, bullet points &amp; voice memos. The marketer turns them into scheduled campaigns.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
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
      <div className="glass-panel rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-2xl">
        <form onSubmit={handleDropIdea} className="space-y-3 sm:space-y-4">
          <div className="relative">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Drop a raw thought, bullet points, client quote, or hook idea here... (e.g. 'Why 90% of SaaS founders fail at social media...')"
              rows={3}
              className="w-full p-3 sm:p-4 bg-slate-950/70 text-slate-100 placeholder-slate-500 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-xs sm:text-sm resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleToggleVoiceRecording}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  isRecording
                    ? 'border-rose-500 bg-rose-500/15 text-rose-300 shadow-lg shadow-rose-500/20 animate-pulse'
                    : 'border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white'
                }`}
                title={isRecording ? 'Click to stop dictation' : 'Click to dictate thoughts into text'}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-rose-400" />
                    <span>Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-amber-400" />
                    <span>Voice Note</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !rawText.trim()}
                className="flex-1 sm:flex-none px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Drop Idea</span>
              </button>
            </div>
          </div>

          {/* Live Voice Recording Status Feedback */}
          {isRecording && (
            <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Listening to microphone... Speak clearly to dictate your idea live.</span>
            </div>
          )}

          {/* Speech Error Banner */}
          {speechError && (
            <div className="mt-2 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{speechError}</span>
              </div>
              <button
                type="button"
                onClick={() => setSpeechError(null)}
                className="text-amber-400 hover:text-amber-200 text-xs px-1"
              >
                ✕
              </button>
            </div>
          )}

        </form>
      </div>

      {/* Ideas Feed / Board */}
      <div className="space-y-3 sm:space-y-4">
        {/* Filter bar */}
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
            <span className="text-slate-400 font-medium">Filter:</span>
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
                activeFilter === 'all'
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              All ({ideas.length})
            </button>
            <button
              onClick={() => setActiveFilter('inbox')}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
                activeFilter === 'inbox'
                  ? 'bg-amber-500/20 text-amber-300 font-medium'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Inbox ({ideas.filter((i) => i.status === 'inbox').length})
            </button>
            <button
              onClick={() => setActiveFilter('converted')}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
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
                className="p-4 sm:p-5 glass-card rounded-2xl border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 group"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed break-words whitespace-pre-line">
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
                        <div className="flex items-center gap-1 flex-wrap">
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
                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onLoadIdeaIntoComposer(idea.raw_text)}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 hover:border-blue-600 font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
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
