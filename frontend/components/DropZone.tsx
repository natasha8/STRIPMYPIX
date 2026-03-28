"use client";

import { useCallback, useState, type ReactNode } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, ImageIcon, Loader2 } from "lucide-react";

interface DropZoneProps {
  readonly onFile: (file: File) => void;
  readonly loading?: boolean;
}

function dropzoneStateClasses(
  loading: boolean,
  isDragActive: boolean,
  hasPreview: boolean
): string {
  if (loading) {
    return "border-[var(--color-neon)]/50 bg-[var(--color-surface)]";
  }
  if (isDragActive) {
    return "border-[var(--color-neon)] bg-[var(--color-neon)]/5 sm:scale-[1.02]";
  }
  if (hasPreview) {
    return "border-slate-700 bg-[var(--color-surface)]/50";
  }
  return "animate-border-glow bg-[var(--color-surface)]/30";
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

  const stateClasses = dropzoneStateClasses(loading, isDragActive, Boolean(preview));

  let inner: ReactNode;
  if (loading) {
    inner = (
      <div className="flex flex-col items-center gap-2 sm:gap-3">
        <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--color-neon)] animate-spin" />
        <p className="text-xs sm:text-sm font-mono text-slate-400 text-center px-2">
          Analyzing metadata...
        </p>
      </div>
    );
  } else if (preview) {
    inner = (
      <div className="flex flex-col items-center gap-3 sm:gap-4">
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-md sm:rounded-lg overflow-hidden border border-slate-700">
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
    );
  } else if (isDragActive) {
    inner = (
      <div className="flex flex-col items-center gap-2 sm:gap-3 text-center px-1">
        <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-[var(--color-neon)]" />
        <p className="text-xs sm:text-sm font-mono text-[var(--color-neon)]">
          Drop it here
        </p>
      </div>
    );
  } else {
    inner = (
      <div className="flex flex-col items-center gap-2 sm:gap-3 text-center px-1">
        <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-slate-500" />
        <p className="text-xs sm:text-sm font-mono text-slate-300">
          Drag &amp; drop an image
        </p>
        <p className="text-[10px] sm:text-xs font-mono text-slate-500 leading-tight max-w-[18rem] sm:max-w-none">
          or tap to browse — JPEG, PNG, TIFF, WebP
        </p>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`
        relative min-h-[220px] sm:min-h-[280px] md:min-h-[340px]
        rounded-lg sm:rounded-xl border-2 border-dashed
        flex flex-col items-center justify-center gap-3 sm:gap-4
        cursor-pointer transition-all duration-300 px-4 sm:px-6
        ${stateClasses}
      `}
    >
      <input {...getInputProps()} />
      {inner}
    </div>
  );
}
