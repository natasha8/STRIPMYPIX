"use client";

import { useState } from "react";
import { ShieldCheck, Loader2, Download } from "lucide-react";
import { stripImage } from "@/lib/api";

interface StripButtonProps {
  readonly file: File;
}

type StripState = "idle" | "loading" | "done";

export default function StripButton({ file }: StripButtonProps) {
  const [state, setState] = useState<StripState>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleStrip = async () => {
    setState("loading");
    setError(null);
    try {
      const blob = await stripImage(file);
      const url = URL.createObjectURL(blob);
      const stem = file.name.replace(/\.[^.]+$/, "");
      const ext = file.name.split(".").pop() || "jpg";

      const a = document.createElement("a");
      a.href = url;
      a.download = `${stem}_stripped.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Strip failed");
      setState("idle");
    }
  };

  if (state === "done") {
    return (
      <button
        disabled
        className="w-full rounded-xl bg-green-600/20 border border-green-500/40
                   text-green-400 font-bold font-mono py-3 px-6
                   flex items-center justify-center gap-2 cursor-not-allowed"
      >
        <Download className="w-5 h-5" />
        Stripped &amp; Downloaded
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleStrip}
        disabled={state === "loading"}
        className={`
          w-full rounded-xl font-bold font-mono py-3 px-6
          flex items-center justify-center gap-2 transition-all
          ${
            state === "loading"
              ? "bg-[var(--color-neon)]/60 text-black/60 cursor-wait"
              : "bg-[var(--color-neon)] text-black hover:bg-[var(--color-neon-dim)] cursor-pointer"
          }
        `}
      >
        {state === "loading" ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Stripping image...
          </>
        ) : (
          <>
            <ShieldCheck className="w-5 h-5" />
            Download Stripped Image
          </>
        )}
      </button>
      {error && (
        <p className="text-xs font-mono text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
