"""
Fourier decomposition module for PPG signal analysis.
"""

import numpy as np
from scipy.fft import fft, fftfreq


def compute_fft(signal: np.ndarray, sample_rate: float = 100.0):
    """
    Compute the FFT of a signal.
    Returns (frequencies, magnitudes) for positive frequencies only.
    """
    n = len(signal)
    # Remove DC offset
    signal_centered = signal - np.mean(signal)
    
    # Apply Hanning window to reduce spectral leakage
    window = np.hanning(n)
    windowed = signal_centered * window
    
    yf = fft(windowed)
    xf = fftfreq(n, 1.0 / sample_rate)
    
    # Take only positive frequencies
    pos_mask = xf > 0
    freqs = xf[pos_mask]
    magnitudes = 2.0 / n * np.abs(yf[pos_mask])
    
    return freqs, magnitudes


def extract_heart_rate(freqs: np.ndarray, magnitudes: np.ndarray,
                       min_hr=40, max_hr=200) -> float:
    """
    Extract dominant heart rate from FFT result.
    Returns BPM.
    """
    # Heart rate frequency range
    min_f = min_hr / 60.0
    max_f = max_hr / 60.0
    
    mask = (freqs >= min_f) & (freqs <= max_f)
    if not np.any(mask):
        return 72.0  # fallback
    
    hr_freqs = freqs[mask]
    hr_mags = magnitudes[mask]
    
    dominant_idx = np.argmax(hr_mags)
    dominant_freq = hr_freqs[dominant_idx]
    
    return dominant_freq * 60.0  # Convert Hz to BPM


def get_frequency_bands(freqs: np.ndarray, magnitudes: np.ndarray):
    """
    Extract LF and HF power bands for HRV frequency-domain analysis.
    LF: 0.04 - 0.15 Hz (sympathetic + parasympathetic)
    HF: 0.15 - 0.40 Hz (parasympathetic / vagal)
    """
    lf_mask = (freqs >= 0.04) & (freqs < 0.15)
    hf_mask = (freqs >= 0.15) & (freqs <= 0.40)
    
    lf_power = np.trapezoid(magnitudes[lf_mask] ** 2, freqs[lf_mask]) if np.any(lf_mask) else 0.0
    hf_power = np.trapezoid(magnitudes[hf_mask] ** 2, freqs[hf_mask]) if np.any(hf_mask) else 0.0
    
    return {
        "lf_power": float(lf_power),
        "hf_power": float(hf_power),
        "total_power": float(lf_power + hf_power)
    }
