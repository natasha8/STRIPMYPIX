"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Shield, Trash2 } from "lucide-react";
import DropZone from "@/components/DropZone";
import { analyzeImage } from "@/lib/api";

const FEATURES = [
  {
    icon: Eye,
    title: "Detect",
    description:
      "Scans EXIF for GPS, camera model, serials, timestamps, software, and lens data.",
  },
  {
    icon: Shield,
    title: "Score",
    description:
      "Rates exposure from 0 (critical) to 100 (safe) from what metadata leaks.",
  },
  {
    icon: Trash2,
    title: "Strip",
    description:
      "Removes metadata and returns a clean file. Nothing stored, no accounts.",
  },
] as const;

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const result = await analyzeImage(file);

      sessionStorage.setItem("analysisResult", JSON.stringify(result));
      sessionStorage.setItem("originalFileName", file.name);
      sessionStorage.setItem("originalFileType", file.type);

      const reader = new FileReader();
      reader.onload = () => {
        sessionStorage.setItem("originalFileData", reader.result as string);
        router.push("/analysis");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up flex flex-col gap-5 sm:gap-7 md:gap-9">
      <section className="text-center max-w-xl sm:max-w-2xl mx-auto space-y-2 sm:space-y-3">
        <h2 className="text-[1.35rem] leading-tight font-bold tracking-tight sm:text-3xl md:text-4xl">
          Your images are{" "}
          <span className="text-(--color-neon) uppercase">talking</span>.
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-snug sm:leading-relaxed px-0.5">
          Photos can hide GPS, serial numbers, and timestamps. StripMyPix shows what
          leaks and lets you remove it in{" "}
          <span className="text-(--color-neon) font-bold uppercase whitespace-nowrap">
            one click
          </span>.
        </p>
      </section>

      <div className="w-full max-w-2xl mx-auto space-y-2 sm:space-y-3">
        <DropZone onFile={handleFile} loading={loading} />
        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 sm:px-4 sm:py-3">
            <p className="text-xs sm:text-sm font-mono text-red-400 break-words">
              {error}
            </p>
          </div>
        )}
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {FEATURES.map((feat) => (
          <div
            key={feat.title}
            className="rounded-lg sm:rounded-xl border border-slate-800 bg-[var(--color-surface)]/50 p-4 sm:p-5 flex gap-3 sm:flex-col sm:gap-3 md:gap-3 items-start sm:items-stretch"
          >
            <feat.icon className="w-6 h-6 shrink-0 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[var(--color-neon)]" />
            <div className="min-w-0 text-left sm:text-left flex-1 space-y-1">
              <h3 className="text-sm sm:text-base font-semibold text-white">
                {feat.title}
              </h3>
              <p className="text-[11px] sm:text-xs md:text-sm text-slate-400 leading-snug">
                {feat.description}
              </p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
