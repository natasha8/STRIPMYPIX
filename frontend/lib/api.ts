const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface GpsCoord {
  readonly lat: number;
  readonly lng: number;
}

export interface Finding {
  readonly category: string;
  readonly value: string;
  readonly risk: "critical" | "high" | "medium" | "low";
}

export interface AnalysisResult {
  readonly risk_score: number;
  readonly findings: Finding[];
  readonly gps: GpsCoord | null;
  readonly filename: string;
  readonly downscaled: boolean;
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

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/analyze`, {
      method: "POST",
      body: form,
    });
  } catch {
    throw new Error(
      "Unable to reach the analysis server. Please check that the backend is running."
    );
  }

  if (!res.ok) {
    const message = await parseErrorMessage(res);
    throw new Error(message);
  }

  return res.json();
}

export async function stripImage(file: File): Promise<Blob> {
  const form = new FormData();
  form.append("file", file);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/strip`, {
      method: "POST",
      body: form,
    });
  } catch {
    throw new Error(
      "Unable to reach the server. Please check that the backend is running."
    );
  }

  if (!res.ok) {
    const message = await parseErrorMessage(res);
    throw new Error(message);
  }

  return res.blob();
}
