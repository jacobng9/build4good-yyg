"""
AstroSync FastAPI Backend
Serves processed physiological data from synthetic PPG signals.
"""

import os
import math
import random
import numpy as np
import pandas as pd
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from dsp.fourier import compute_fft, extract_heart_rate, get_frequency_bands
from dsp.hrv import detect_peaks, compute_hrv, compute_lf_hf_ratio
from dsp.readiness import compute_readiness_score

app = FastAPI(title="AstroSync API", version="1.0.0")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load PPG data at startup
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "ppg_norm.csv")
SAMPLE_RATE = 100.0  # Hz
WINDOW_SIZE = 500  # 5 seconds of data per analysis window

ppg_data = None


@app.on_event("startup")
async def load_data():
    global ppg_data
    if os.path.exists(DATA_PATH):
        ppg_data = pd.read_csv(DATA_PATH)
        print(f"Loaded {len(ppg_data)} PPG samples from {DATA_PATH}")
    else:
        print(f"WARNING: {DATA_PATH} not found. Run generate_data.py first.")


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "AstroSync DSP Engine",
        "samples_loaded": len(ppg_data) if ppg_data is not None else 0
    }


@app.get("/api/stream")
async def stream_data(
    offset: int = Query(0, ge=0, description="Sample offset into PPG data"),
    gravity: str = Query("earth", description="Gravity mode: 'earth' or 'microgravity'")
):
    """
    Returns a processed data chunk from the PPG signal.
    The frontend polls this endpoint to simulate real-time streaming.
    """
    if ppg_data is None:
        return {"error": "No data loaded"}
    
    total_samples = len(ppg_data)
    
    # Wrap around for continuous playback
    start = offset % total_samples
    end = start + WINDOW_SIZE
    
    if end <= total_samples:
        window = ppg_data["ppg_value"].values[start:end]
    else:
        # Wrap around
        part1 = ppg_data["ppg_value"].values[start:]
        part2 = ppg_data["ppg_value"].values[:end - total_samples]
        window = np.concatenate([part1, part2])
    
    # --- DSP Processing ---
    # FFT
    freqs, magnitudes = compute_fft(window, SAMPLE_RATE)
    
    # Heart Rate
    bpm = extract_heart_rate(freqs, magnitudes)
    
    # Add slight natural variation to make it feel alive
    bpm_display = bpm + random.gauss(0, 1.5)
    bpm_display = max(45, min(180, bpm_display))
    
    # Frequency bands
    bands = get_frequency_bands(freqs, magnitudes)
    
    # HRV
    peaks, rr_intervals = detect_peaks(window, SAMPLE_RATE)
    hrv_metrics = compute_hrv(rr_intervals)
    
    # LF/HF ratio
    lf_hf = compute_lf_hf_ratio(bands)
    
    # Space Readiness Score
    readiness = compute_readiness_score(
        bpm=bpm_display,
        hrv_sdnn=hrv_metrics["sdnn"],
        lf_hf_ratio=lf_hf,
        gravity_mode=gravity
    )
    
    # Simulated atmospheric data
    if gravity == "microgravity":
        o2_level = 20.5 + random.gauss(0, 0.3)
        radiation = 0.48 + random.gauss(0, 0.05)
        gravity_g = 0.0
        pressure = 101.3 + random.gauss(0, 0.5)
        cabin_temp = 22.0 + random.gauss(0, 0.3)
    else:
        o2_level = 20.9 + random.gauss(0, 0.1)
        radiation = 0.003 + random.gauss(0, 0.0005)
        gravity_g = 1.0
        pressure = 101.325 + random.gauss(0, 0.2)
        cabin_temp = 21.0 + random.gauss(0, 0.2)
    
    # FFT data for visualization (downsample for frontend)
    fft_display_count = 64
    step = max(1, len(freqs) // fft_display_count)
    fft_data = [
        {"freq": round(float(freqs[i]), 3), "magnitude": round(float(magnitudes[i]), 5)}
        for i in range(0, min(len(freqs), fft_display_count * step), step)
    ]
    
    return {
        "offset": start,
        "bpm": round(bpm_display, 1),
        "hrv": hrv_metrics,
        "lf_hf_ratio": lf_hf,
        "frequency_bands": bands,
        "readiness_score": readiness,
        "fft": fft_data,
        "atmospheric": {
            "o2_percent": round(o2_level, 2),
            "radiation_msv": round(radiation, 4),
            "gravity_g": gravity_g,
            "pressure_kpa": round(pressure, 2),
            "cabin_temp_c": round(cabin_temp, 1)
        },
        "raw_window": [round(float(v), 4) for v in window[::5]],  # downsampled raw PPG
        "gravity_mode": gravity
    }


@app.get("/api/fft")
async def fft_data(
    offset: int = Query(0, ge=0, description="Sample offset")
):
    """Raw FFT data for detailed visualization."""
    if ppg_data is None:
        return {"error": "No data loaded"}
    
    total = len(ppg_data)
    start = offset % total
    end = start + WINDOW_SIZE
    
    if end <= total:
        window = ppg_data["ppg_value"].values[start:end]
    else:
        part1 = ppg_data["ppg_value"].values[start:]
        part2 = ppg_data["ppg_value"].values[:end - total]
        window = np.concatenate([part1, part2])
    
    freqs, magnitudes = compute_fft(window, SAMPLE_RATE)
    
    return {
        "frequencies": [round(float(f), 4) for f in freqs],
        "magnitudes": [round(float(m), 6) for m in magnitudes]
    }
