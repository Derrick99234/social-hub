'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, X, Plus, CheckCircle2, AlertCircle, Layers } from 'lucide-react';

interface MediaUploaderProps {
  mediaUrls: string[];
  onChange: (urls: string[]) => void;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({ mediaUrls, onChange }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageType, setStorageType] = useState<string | null>(null);
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

  const removeMediaAt = (index: number) => {
    const updated = mediaUrls.filter((_, i) => i !== index);
    onChange(updated);
    if (updated.length === 0) {
      setStorageType(null);
    }
  };

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
                key={idx}
                className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-900 aspect-square flex items-center justify-center shadow-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Slide ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Slide index badge */}
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[10px] font-semibold text-white border border-slate-700">
                  {idx + 1}
                </div>

                {/* Remove button overlay */}
                <button
                  type="button"
                  onClick={() => removeMediaAt(idx)}
                  className="absolute top-1.5 right-1.5 p-1 bg-rose-600/90 hover:bg-rose-500 text-white rounded-md shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove slide"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Add more button if < 10 */}
            {mediaUrls.length < 10 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900 flex flex-col items-center justify-center p-2 text-slate-400 hover:text-slate-200 transition-all"
              >
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium">+ Add Slide</span>
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
          className={`cursor-pointer border-2 border-dashed rounded-xl p-4 text-center transition-all ${
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
              <UploadCloud className="w-6 h-6 text-slate-500 mb-1" />
              <p className="text-xs font-medium text-slate-300">
                Click or drag &amp; drop images (single or multi-image carousel)
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Select up to 10 images (PNG, JPG, WebP)</p>
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
    </div>
  );
};
