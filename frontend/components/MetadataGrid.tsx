"use client";

import {
  MapPin,
  Camera,
  Clock,
  Hash,
  Code,
  Aperture,
  AlertTriangle,
} from "lucide-react";
import type { Finding } from "@/lib/api";

interface MetadataGridProps {
  readonly findings: Finding[];
}

const ICON_MAP: Record<string, typeof MapPin> = {
  "GPS Location": MapPin,
  "Camera Model": Camera,
  Timestamp: Clock,
  "Serial Number": Hash,
  Software: Code,
  "Lens Info": Aperture,
};

const RISK_STYLES: Record<
  string,
  { bg: string; text: string; border: string; leftBorder: string }
> = {
  critical: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-500/40",
    leftBorder: "border-l-red-500",
  },
  high: {
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    border: "border-orange-500/40",
    leftBorder: "border-l-[var(--color-neon)]",
  },
  medium: {
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    border: "border-yellow-500/40",
    leftBorder: "border-l-yellow-500",
  },
  low: {
    bg: "bg-slate-500/20",
    text: "text-slate-400",
    border: "border-slate-500/40",
    leftBorder: "border-l-slate-600",
  },
};

export default function MetadataGrid({ findings }: MetadataGridProps) {
  if (findings.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-surface/50 p-8 flex flex-col items-center gap-3">
        <AlertTriangle className="w-10 h-10 text-[var(--color-safe)]" />
        <p className="text-sm font-mono text-slate-400">
          No metadata leaks found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
        Detected Leaks
      </h3>
      <div className="space-y-0.5">
        {findings.map((finding, index) => {
          const Icon = ICON_MAP[finding.category] || Code;
          const style = RISK_STYLES[finding.risk] || RISK_STYLES.low;

          return (
            <div
              key={`${finding.category}-${index}`}
              className={`
                flex items-center gap-3 rounded-lg border-l-4 border
                ${style.border} ${style.leftBorder}
                bg-[var(--color-surface)]/50 px-4 py-3
                animate-fade-in-up
              `}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <Icon className={`w-4 h-4 shrink-0 ${style.text}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-slate-500">
                  {finding.category}
                </p>
                <p className="text-sm text-slate-200 truncate">
                  {finding.value}
                </p>
              </div>
              <span
                className={`
                  text-[10px] font-mono font-bold uppercase px-2 py-0.5
                  rounded-full ${style.bg} ${style.text}
                `}
              >
                {finding.risk}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
