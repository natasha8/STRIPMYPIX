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
      "Scans EXIF data for GPS coordinates, camera model, serial numbers, timestamps, software, and lens info.",
  },
  {
    icon: Shield,
    title: "Score",
    description:
      "Rates your privacy exposure from 0 (critical) to 100 (safe) based on what metadata is leaking.",
  },
  {
    icon: Trash2,
    title: "Strip",
    description:
      "Removes all metadata and returns a clean file. No data stored. No accounts. No tracking.",
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
    <div className="animate-fade-in-up space-y-16">
      <section className="text-center space-y-4 pt-8">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Your images are{" "}
          <span className="text-[var(--color-neon)]">talking</span>.
        </h2>
        <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
          Every photo you share may contain hidden metadata — GPS coordinates,
          camera serial numbers, timestamps. StripMyPix reveals what&apos;s
          leaking and lets you remove it in{" "}
          <span className="text-[var(--color-neon)] font-bold uppercase">
            one click
          </span>
          .
        </p>
      </section>

      <div className="max-w-2xl mx-auto space-y-4">
        <DropZone onFile={handleFile} loading={loading} />
        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3">
            <p className="text-sm font-mono text-red-400">{error}</p>
          </div>
        )}
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {FEATURES.map((feat) => (
          <div
            key={feat.title}
            className="rounded-xl border border-slate-800 bg-[var(--color-surface)]/50 p-6 space-y-3"
          >
            <feat.icon className="w-8 h-8 text-[var(--color-neon)]" />
            <h3 className="font-semibold text-white">{feat.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {feat.description}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
