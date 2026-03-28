"""
Generate synthetic PPG (photoplethysmography) data for AstroSync demo.
Produces a realistic heart-rate waveform with noise at 100 Hz sample rate.
"""

import numpy as np
import pandas as pd
import os

def generate_ppg(duration_s=60, sample_rate=100, heart_rate_bpm=72, seed=42):
    """Generate synthetic PPG signal."""
    np.random.seed(seed)
    
    t = np.arange(0, duration_s, 1.0 / sample_rate)
    n_samples = len(t)
    
    # Fundamental frequency from heart rate
    f_hr = heart_rate_bpm / 60.0  # ~1.2 Hz for 72 BPM
    
    # PPG waveform: fundamental + harmonics (realistic pulse shape)
    signal = np.zeros(n_samples)
    signal += 1.0 * np.sin(2 * np.pi * f_hr * t)                    # Fundamental
    signal += 0.5 * np.sin(2 * np.pi * 2 * f_hr * t + np.pi / 4)   # 2nd harmonic
    signal += 0.25 * np.sin(2 * np.pi * 3 * f_hr * t + np.pi / 3)  # 3rd harmonic
    
    # Respiratory modulation (~0.25 Hz / 15 breaths per min)
    respiratory = 0.15 * np.sin(2 * np.pi * 0.25 * t)
    signal += respiratory
    
    # Slow baseline drift
    drift = 0.1 * np.sin(2 * np.pi * 0.02 * t)
    signal += drift
    
    # Add slight heart rate variability (wander the phase)
    hrv_mod = 0.05 * np.sin(2 * np.pi * 0.1 * t)
    signal += hrv_mod * np.sin(2 * np.pi * f_hr * t)
    
    # Gaussian noise
    noise = 0.08 * np.random.randn(n_samples)
    signal += noise
    
    # Normalize to 0–1
    signal = (signal - signal.min()) / (signal.max() - signal.min())
    
    return t, signal


if __name__ == "__main__":
    t, ppg = generate_ppg(duration_s=60)
    
    df = pd.DataFrame({
        "timestamp": t,
        "ppg_value": ppg
    })
    
    out_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "ppg_norm.csv")
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} samples -> {out_path}")
