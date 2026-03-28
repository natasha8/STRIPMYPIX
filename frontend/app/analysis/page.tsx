"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, ShieldAlert, ShieldCheck } from "lucide-react";
import type { AnalysisResult } from "@/lib/api";
import PrivacyGauge from "@/components/PrivacyGauge";
import MetadataGrid from "@/components/MetadataGrid";
import StripButton from "@/components/StripButton";

const LocationMap = dynamic(() => import("@/components/LocationMap"), {
  ssr: false,
});

function dataURLtoFile(dataUrl: string, name: string, type: string): File {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || type;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], name, { type: mime });
}

export default function AnalysisPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("analysisResult");
    const fileName = sessionStorage.getItem("originalFileName");
    const fileType = sessionStorage.getItem("originalFileType");
    const fileData = sessionStorage.getItem("originalFileData");

    if (!raw || !fileName || !fileData || !fileType) {
      router.push("/");
      return;
    }

    setResult(JSON.parse(raw));
    setPreviewUrl(fileData);
    setFile(dataURLtoFile(fileData, fileName, fileType));
  }, [router]);

  if (!result || !file) return null;

  const hasCritical = result.findings.some((f) => f.risk === "critical");

  return (
    <div className="animate-fade-in-up space-y-8">
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-2 text-[var(--color-neon)] font-mono text-sm
                   hover:underline cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Analyze another image
      </button>

      <div className="flex items-center gap-3">
        {hasCritical ? (
          <ShieldAlert className="w-7 h-7 text-[var(--color-danger)]" />
        ) : (
          <ShieldCheck className="w-7 h-7 text-[var(--color-safe)]" />
        )}
        <div>
          <h2 className="text-2xl font-bold">Analysis Report</h2>
          <p className="text-sm font-mono text-slate-500">{result.filename}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--color-neon)]/30 bg-[var(--color-surface)]/50 p-6">
            <PrivacyGauge score={result.risk_score} />
          </div>

          {previewUrl && (
            <div className="rounded-xl border border-slate-800 bg-[var(--color-surface)]/50 p-4">
              <p className="text-xs font-mono text-slate-500 mb-3">
                Image Preview
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Uploaded preview"
                className="w-full rounded-lg border border-slate-700"
              />
              {result.downscaled && (
                <p className="text-xs font-mono text-yellow-500 mt-2">
                  Image was downscaled for processing
                </p>
              )}
            </div>
          )}

          <StripButton file={file} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <MetadataGrid findings={result.findings} />
          {result.gps && (
            <LocationMap lat={result.gps.lat} lng={result.gps.lng} />
          )}
        </div>
      </div>
    </div>
  );
}
