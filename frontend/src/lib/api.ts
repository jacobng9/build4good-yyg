const API_BASE = "http://localhost:8000/api";

export interface HRVData {
  sdnn: number;
  rmssd: number;
  mean_rr: number;
  nn50: number;
}

export interface FFTPoint {
  freq: number;
  magnitude: number;
}

export interface AtmosphericData {
  o2_percent: number;
  radiation_msv: number;
  gravity_g: number;
  pressure_kpa: number;
  cabin_temp_c: number;
}

export interface FrequencyBands {
  lf_power: number;
  hf_power: number;
  total_power: number;
}

export interface StreamResponse {
  offset: number;
  bpm: number;
  hrv: HRVData;
  lf_hf_ratio: number;
  frequency_bands: FrequencyBands;
  readiness_score: number;
  fft: FFTPoint[];
  atmospheric: AtmosphericData;
  raw_window: number[];
  gravity_mode: string;
}

export async function fetchStreamData(
  offset: number,
  gravity: string = "earth"
): Promise<StreamResponse> {
  const res = await fetch(
    `${API_BASE}/stream?offset=${offset}&gravity=${gravity}`
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchHealth(): Promise<{ status: string; samples_loaded: number }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
