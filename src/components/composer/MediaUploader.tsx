'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  UploadCloud,
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
  Layers,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Trash2,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

interface MediaUploaderProps {
  mediaUrls: string[];
  onChange: (urls: string[]) => void;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({ mediaUrls, onChange }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageType, setStorageType] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);

    // Limit maximum 10 images for carousel
    if (mediaUrls.length + fileList.length > 10) {
      setError('Carousel limit is 10 images max.');
      return;
    }

    // Validate size (25MB each)
    for (const f of fileList) {
      if (f.size > 25 * 1024 * 1024) {
        setError(`File "${f.name}" exceeds 25MB limit.`);
        return;
      }
    }

    setIsUploading(true);
    setError(null);

    const uploadedUrls: string[] = [];

    try {
      for (const file of fileList) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Upload failed for ${file.name}`);
        }

        setStorageType(data.storage === 'supabase' ? 'Supabase Storage' : 'Local Preview');
        uploadedUrls.push(data.url);
      }

      onChange([...mediaUrls, ...uploadedUrls]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  // Remove media and clean up from Supabase storage automatically
  const removeMediaAt = (index: number) => {
    const urlToRemove = mediaUrls[index];
    const updated = mediaUrls.filter((_, i) => i !== index);
    onChange(updated);

    if (previewIndex !== null) {
      if (previewIndex === index) {
        setPreviewIndex(null);
      } else if (previewIndex > index) {
        setPreviewIndex(previewIndex - 1);
      }
    }

    if (updated.length === 0) {
      setStorageType(null);
    }

    // Purge file from storage asynchronously
    if (urlToRemove) {
      fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToRemove }),
      }).catch((err) => {
        console.warn('Could not remove file from storage:', err);
      });
    }
  };

  // Reorder media positions
  const moveMedia = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= mediaUrls.length) return;
    const updated = [...mediaUrls];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onChange(updated);

    if (previewIndex === fromIndex) {
      setPreviewIndex(toIndex);
    } else if (previewIndex === toIndex) {
      setPreviewIndex(fromIndex);
    }
  };

  // Lightbox keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (previewIndex === null) return;
      if (e.key === 'Escape') {
        setPreviewIndex(null);
      } else if (e.key === 'ArrowLeft' && previewIndex > 0) {
        setPreviewIndex(previewIndex - 1);
      } else if (e.key === 'ArrowRight' && previewIndex < mediaUrls.length - 1) {
        setPreviewIndex(previewIndex + 1);
      }
    },
    [previewIndex, mediaUrls.length]
  );

  useEffect(() => {
    if (previewIndex !== null) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [previewIndex, handleKeyDown]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Carousel &amp; Media Attachments {mediaUrls.length > 0 && `(${mediaUrls.length}/10)`}</span>
        </label>
        {storageType && (
          <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {storageType}
          </span>
        )}
      </div>

      {mediaUrls.length > 0 ? (
        <div className="space-y-2">
          {/* Thumbnails grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {mediaUrls.map((url, idx) => (
              <div
                key={url + idx}
                onClick={() => setPreviewIndex(idx)}
                className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-900 aspect-square flex items-center justify-center shadow-md cursor-pointer transition-all hover:border-blue-500/70 hover:shadow-blue-500/10"
                title="Tap to preview enlarged image"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Slide ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Tap to Preview Hover Overlay */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 pointer-events-none">
                  <ZoomIn className="w-5 h-5 text-white drop-shadow" />
                  <span className="text-[10px] font-medium text-white/90 drop-shadow">Tap to preview</span>
                </div>

                {/* Slide index badge */}
                <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-md text-[10px] font-bold text-white border border-slate-700/80 shadow">
                  {idx === 0 ? '★ 1st (Cover)' : `#${idx + 1}`}
                </div>

                {/* Remove button overlay */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMediaAt(idx);
                  }}
                  className="absolute top-1.5 right-1.5 p-1.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded-md shadow opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  title="Remove from carousel and delete from storage"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Reorder controls toolbar */}
                <div
                  className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-between gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveMedia(idx, idx - 1)}
                    className={`p-1 rounded-md text-white backdrop-blur-md border shadow transition-all ${
                      idx === 0
                        ? 'opacity-30 border-slate-800 bg-slate-900/60 cursor-not-allowed'
                        : 'bg-slate-950/80 hover:bg-blue-600 border-slate-700 hover:border-blue-500 text-slate-200 hover:text-white'
                    }`}
                    title={idx === 0 ? 'Already 1st slide' : 'Move left / earlier in carousel'}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <span className="px-1.5 py-0.5 rounded bg-slate-950/80 text-[10px] text-slate-300 border border-slate-800 font-mono">
                    {idx + 1}/{mediaUrls.length}
                  </span>

                  <button
                    type="button"
                    disabled={idx === mediaUrls.length - 1}
                    onClick={() => moveMedia(idx, idx + 1)}
                    className={`p-1 rounded-md text-white backdrop-blur-md border shadow transition-all ${
                      idx === mediaUrls.length - 1
                        ? 'opacity-30 border-slate-800 bg-slate-900/60 cursor-not-allowed'
                        : 'bg-slate-950/80 hover:bg-blue-600 border-slate-700 hover:border-blue-500 text-slate-200 hover:text-white'
                    }`}
                    title={idx === mediaUrls.length - 1 ? 'Already last slide' : 'Move right / later in carousel'}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add more button if < 10 */}
            {mediaUrls.length < 10 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-800 hover:border-blue-500/50 bg-slate-900/40 hover:bg-slate-900/80 flex flex-col items-center justify-center p-2 text-slate-400 hover:text-slate-200 transition-all group"
              >
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform text-blue-400" />
                    <span className="text-[11px] font-medium">+ Add Slide</span>
                    <span className="text-[9px] text-slate-500">({10 - mediaUrls.length} left)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-xl p-5 text-center transition-all ${
            isUploading
              ? 'border-blue-500 bg-blue-500/5'
              : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/mp4,video/quicktime"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {isUploading ? (
            <div className="flex flex-col items-center py-2">
              <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-2" />
              <p className="text-xs text-blue-400 font-medium">Uploading to Storage...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-2">
              <UploadCloud className="w-7 h-7 text-slate-500 mb-1.5" />
              <p className="text-xs font-medium text-slate-300">
                Click or drag &amp; drop images (single or multi-image carousel)
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Select up to 10 images (PNG, JPG, WebP)</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-400">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Lightbox / Tap-to-Preview Modal */}
      {previewIndex !== null && mediaUrls[previewIndex] && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewIndex(null)}
        >
          {/* Top Bar Controls */}
          <div
            className="w-full max-w-4xl flex items-center justify-between pb-3 text-white border-b border-slate-800/80 mb-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold">
                {previewIndex === 0 ? 'Cover Slide (1st)' : `Slide #${previewIndex + 1}`}
              </span>
              <span className="text-xs text-slate-400">
                of {mediaUrls.length} total {mediaUrls.length === 1 ? 'slide' : 'slides'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Move buttons in preview */}
              <button
                type="button"
                disabled={previewIndex === 0}
                onClick={() => moveMedia(previewIndex, previewIndex - 1)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  previewIndex === 0
                    ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200'
                }`}
                title="Move this slide earlier (left)"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Move Earlier</span>
              </button>

              <button
                type="button"
                disabled={previewIndex === mediaUrls.length - 1}
                onClick={() => moveMedia(previewIndex, previewIndex + 1)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  previewIndex === mediaUrls.length - 1
                    ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200'
                }`}
                title="Move this slide later (right)"
              >
                <span className="hidden sm:inline">Move Later</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeMediaAt(previewIndex)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors ml-1"
                title="Delete from carousel & storage"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Remove</span>
              </button>

              {/* Close button */}
              <button
                type="button"
                onClick={() => setPreviewIndex(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors ml-2"
                title="Close preview (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Image View with Prev/Next Navigation */}
          <div
            className="relative flex items-center justify-center max-w-4xl w-full h-[70vh] max-h-[75vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev arrow */}
            {previewIndex > 0 && (
              <button
                type="button"
                onClick={() => setPreviewIndex(previewIndex - 1)}
                className="absolute left-2 z-20 p-2.5 rounded-full bg-slate-950/80 hover:bg-blue-600 text-white border border-slate-700 shadow-xl transition-all"
                title="Previous slide (Left Arrow)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Enlarged Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrls[previewIndex]}
              alt={`Slide ${previewIndex + 1} enlarged preview`}
              className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-slate-800 select-none"
            />

            {/* Next arrow */}
            {previewIndex < mediaUrls.length - 1 && (
              <button
                type="button"
                onClick={() => setPreviewIndex(previewIndex + 1)}
                className="absolute right-2 z-20 p-2.5 rounded-full bg-slate-950/80 hover:bg-blue-600 text-white border border-slate-700 shadow-xl transition-all"
                title="Next slide (Right Arrow)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Thumbnail preview strip at bottom */}
          {mediaUrls.length > 1 && (
            <div
              className="flex items-center gap-2 mt-4 max-w-4xl overflow-x-auto p-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80"
              onClick={(e) => e.stopPropagation()}
            >
              {mediaUrls.map((thumbUrl, tIdx) => (
                <button
                  type="button"
                  key={tIdx}
                  onClick={() => setPreviewIndex(tIdx)}
                  className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    tIdx === previewIndex
                      ? 'border-blue-500 scale-105 shadow-md shadow-blue-500/20'
                      : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbUrl}
                    alt={`Thumb ${tIdx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 right-0 px-1 text-[9px] font-bold bg-black/80 text-white rounded-tl">
                    {tIdx + 1}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

