import {
  buildSurvShapFeatureMeta,
  encodeRawFeatureVector,
  type PatientInput,
} from "@/lib/coxModel";

export interface SurvShapCumulativeRow {
  displayName: string;
  importance: number;
}

export interface SurvShapTimeSeries {
  times: number[];
  series: { displayName: string; values: number[] }[];
}

export interface SurvShapResponse {
  cumulative: SurvShapCumulativeRow[];
  timeSeries: SurvShapTimeSeries;
  error: string | null;
}

function apiBase(): string {
  return import.meta.env.VITE_SURVSHAP_API_URL ?? "";
}

export async function fetchSurvShap(input: PatientInput): Promise<SurvShapResponse> {
  const rawFeatures = encodeRawFeatureVector(input);
  const meta = buildSurvShapFeatureMeta();
  const res = await fetch(`${apiBase()}/api/survshap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rawFeatures, meta }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `SurvSHAP request failed (${res.status})`);
  }
  return res.json() as Promise<SurvShapResponse>;
}
