'use client';

import React from 'react';
import { X, CheckCircle2, AlertCircle, Zap, Code } from 'lucide-react';
import { Post, DispatchLog } from '@/types';
import { PLATFORMS } from '@/lib/constants/platforms';

interface DispatchLogsModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DispatchLogsModal: React.FC<DispatchLogsModalProps> = ({
  post,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !post) return null;

  const logs: DispatchLog[] = post.dispatch_logs || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col glass-panel rounded-2xl shadow-2xl border border-slate-800 text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-400" />
              Platform Dispatch Audit Logs
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              Post: &quot;{post.title || post.content.slice(0, 50)}&quot;
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No external dispatch logs recorded yet for this post.
            </div>
          ) : (
            logs.map((log) => {
              const meta = PLATFORMS[log.channel];
              return (
                <div
                  key={log.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: meta?.color || '#3b82f6' }}
                      />
                      <span className="font-semibold text-xs text-white">
                        {meta?.name || log.channel}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {log.service} API
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {log.status === 'success' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Published
                        </span>
                      )}
                      {log.status === 'simulated' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <Zap className="w-3 h-3" /> Simulated Safe
                        </span>
                      )}
                      {log.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <AlertCircle className="w-3 h-3" /> Failed
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">
                        {new Date(log.dispatched_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {log.external_id && (
                    <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 p-2 rounded-lg font-mono">
                      <span>External Dispatch ID:</span>
                      <span className="text-slate-200">{log.external_id}</span>
                    </div>
                  )}

                  {log.error_message && (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                      <strong>Error:</strong> {log.error_message}
                    </div>
                  )}

                  {log.response_payload && (
                    <div>
                      <span className="block text-[11px] font-medium text-slate-400 mb-1">
                        API Payload / Response:
                      </span>
                      <pre className="p-2.5 rounded-lg bg-slate-900 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40">
                        {JSON.stringify(log.response_payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
