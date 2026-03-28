"use client";

import { useEffect, useState } from "react";

interface PrivacyGaugeProps {
  readonly score: number;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 50) return "#eab308";
  if (score >= 20) return "#ff6b00";
  return "#ef4444";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "SAFE";
  if (score >= 50) return "MODERATE";
  if (score >= 20) return "AT RISK";
  return "CRITICAL";
}

const RADIUS = 70;
const STROKE = 12;
const CIRCUMFERENCE = Math.PI * RADIUS;

export default function PrivacyGauge({ score }: PrivacyGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const offset = CIRCUMFERENCE - (animatedScore / 100) * CIRCUMFERENCE;
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 200 120" className="w-full max-w-[200px]">
        <path
          d={`M ${100 - RADIUS} 100 A ${RADIUS} ${RADIUS} 0 0 1 ${100 + RADIUS} 100`}
          fill="none"
          stroke="#1e293b"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        <path
          d={`M ${100 - RADIUS} 100 A ${RADIUS} ${RADIUS} 0 0 1 ${100 + RADIUS} 100`}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        <text
          x="100"
          y="85"
          textAnchor="middle"
          className="font-mono"
          fill={color}
          fontSize="36"
          fontWeight="bold"
        >
          {animatedScore}
        </text>
        <text
          x="100"
          y="102"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="11"
          className="font-mono"
        >
          / 100
        </text>
      </svg>
      <span
        className="text-sm font-bold font-mono tracking-wider"
        style={{ color }}
      >
        {label}
      </span>
      <span className="text-xs text-slate-500 font-mono">Privacy Score</span>
    </div>
  );
}
