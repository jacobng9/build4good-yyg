"""
Heart Rate Variability (HRV) computation module.
"""

import numpy as np
from scipy.signal import find_peaks


def detect_peaks(signal: np.ndarray, sample_rate: float = 100.0):
    """
    Detect R-peaks (systolic peaks) in PPG signal.
    Returns peak indices and RR intervals in milliseconds.
    """
    # Minimum distance between peaks: ~0.4s (150 BPM max)
    min_distance = int(0.4 * sample_rate)
    
    peaks, properties = find_peaks(
        signal,
        distance=min_distance,
        height=np.mean(signal),
        prominence=0.05
    )
    
    if len(peaks) < 2:
        return peaks, np.array([])
    
    # RR intervals in milliseconds
    rr_intervals = np.diff(peaks) / sample_rate * 1000.0
    
    return peaks, rr_intervals


def compute_hrv(rr_intervals: np.ndarray):
    """
    Compute time-domain HRV metrics.
    - SDNN: Standard deviation of RR intervals (overall variability)
    - RMSSD: Root mean square of successive differences (short-term variability)
    - mean_rr: Mean RR interval
    """
    if len(rr_intervals) < 2:
        return {"sdnn": 0.0, "rmssd": 0.0, "mean_rr": 0.0, "nn50": 0}
    
    sdnn = float(np.std(rr_intervals, ddof=1))
    
    successive_diffs = np.diff(rr_intervals)
    rmssd = float(np.sqrt(np.mean(successive_diffs ** 2)))
    
    mean_rr = float(np.mean(rr_intervals))
    
    # NN50: number of successive differences > 50ms
    nn50 = int(np.sum(np.abs(successive_diffs) > 50))
    
    return {
        "sdnn": round(sdnn, 2),
        "rmssd": round(rmssd, 2),
        "mean_rr": round(mean_rr, 2),
        "nn50": nn50
    }


def compute_lf_hf_ratio(frequency_bands: dict) -> float:
    """
    Compute LF/HF ratio from frequency band powers.
    Higher ratio = more sympathetic (stress) dominance.
    Typical range: 0.5 - 6.0
    """
    hf = frequency_bands.get("hf_power", 0.0)
    lf = frequency_bands.get("lf_power", 0.0)
    
    if hf <= 0:
        return 2.0  # neutral fallback
    
    return round(float(lf / hf), 3)
