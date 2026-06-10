"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface BannerUploadProps {
  value:     string;     // current URL (empty = no banner)
  onChange:  (url: string) => void;
  dark?:     boolean;    // dark-background variant
  className?: string;
}

export default function BannerUpload({ value, onChange, dark = false, className }: BannerUploadProps) {
  const inputRef              = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");

  const handleFile = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/upload/module-banner", { method: "POST", credentials: "include", body: fd });
      const data = await res.json();
      if (!data.success) { setError(data.error ?? "Upload failed."); return; }
      onChange(data.url);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const wrapperCls = dark
    ? cn("rounded-xl border border-white/10 overflow-hidden bg-slate-800/60", className)
    : cn("rounded-xl border border-[#DDE8DF] dark:border-[#1E3524] overflow-hidden bg-[#EBF0EC] dark:bg-[#0A180E]", className);

  return (
    <div className={wrapperCls}>
      {value ? (
        /* Preview */
        <div className="relative group">
          <img
            src={value}
            alt="Module banner"
            className="w-full h-40 object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white text-[#1E293B] text-xs font-bold hover:bg-[#F1F5F9] transition-colors"
            >
              ✏️ Change
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="px-3 py-1.5 rounded-lg bg-[#E05C5C] text-white text-xs font-bold hover:bg-[#c94a4a] transition-colors"
            >
              🗑 Remove
            </button>
          </div>
        </div>
      ) : (
        /* Drop zone */
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "h-36 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors",
            dark
              ? "hover:bg-slate-700/40 text-slate-400"
              : "hover:bg-[#DDE8DF] dark:hover:bg-[#132018] text-[#5A7860] dark:text-[#7BAF84]"
          )}
        >
          {uploading ? (
            <span className="text-sm font-semibold animate-pulse">Uploading…</span>
          ) : (
            <>
              <span className="text-3xl">🖼️</span>
              <p className="text-sm font-semibold">Click or drag & drop a banner image</p>
              <p className="text-[11px] opacity-60">JPG, PNG, WebP · max 4 MB · recommended 1200 × 400 px</p>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="px-3 py-2 text-xs text-[#E05C5C] font-semibold border-t border-[#E05C5C]/20 bg-[#FEE2E2]/40">
          ⚠️ {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
    </div>
  );
}
