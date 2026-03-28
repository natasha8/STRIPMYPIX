"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, ImageIcon, Loader2 } from "lucide-react";

interface DropZoneProps {
  readonly onFile: (file: File) => void;
  readonly loading?: boolean;
}

export default function DropZone({ onFile, loading = false }: DropZoneProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      setPreview(URL.createObjectURL(file));
      onFile(file);
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".tiff", ".webp"],
    },
    maxFiles: 1,
    disabled: loading,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        relative min-h-[340px] rounded-xl border-2 border-dashed
        flex flex-col items-center justify-center gap-4
        cursor-pointer transition-all duration-300 px-6
        ${
          loading
            ? "border-[var(--color-neon)]/50 bg-[var(--color-surface)]"
            : isDragActive
              ? "border-[var(--color-neon)] bg-[var(--color-neon)]/5 scale-[1.02]"
              : preview
                ? "border-slate-700 bg-[var(--color-surface)]/50"
                : "animate-border-glow bg-[var(--color-surface)]/30"
        }
      `}
    >
      <input {...getInputProps()} />

      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-[var(--color-neon)] animate-spin" />
          <p className="text-sm font-mono text-slate-400">
            Analyzing metadata...
          </p>
        </div>
      ) : preview ? (
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-40 h-40 rounded-lg overflow-hidden border border-slate-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-xs font-mono text-slate-500">
            Drop another image to replace
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          {isDragActive ? (
            <>
              <ImageIcon className="w-12 h-12 text-[var(--color-neon)]" />
              <p className="text-sm font-mono text-[var(--color-neon)]">
                Drop it here
              </p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-slate-500" />
              <p className="text-sm font-mono text-slate-300">
                Drag &amp; drop an image
              </p>
              <p className="text-xs font-mono text-slate-500">
                or click to browse — JPEG, PNG, TIFF, WebP
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
