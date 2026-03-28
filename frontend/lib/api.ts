const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface GpsCoord {
  lat: number;
  lng: number;
}

export interface Finding {
  category: string;
  value: string;
  risk: "critical" | "high" | "medium" | "low";
}

export interface AnalysisResult {
  risk_score: number;
  findings: Finding[];
  gps: GpsCoord | null;
  filename: string;
  downscaled: boolean;
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body.detail === "string") return body.detail;
    if (body.detail?.detail) return body.detail.detail;
    return JSON.stringify(body.detail ?? body);
  } catch {
    return res.statusText || `Request failed (${res.status})`;
  }
}

export async function analyzeImage(file: File): Promise<AnalysisResult> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const message = await parseErrorMessage(res);
    throw new Error(message);
  }

  return res.json();
}

export async function stripImage(file: File): Promise<Blob> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/strip`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const message = await parseErrorMessage(res);
    throw new Error(message);
  }

  return res.blob();
}
