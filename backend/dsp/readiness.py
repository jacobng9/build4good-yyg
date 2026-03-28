"""
Space Readiness Score algorithm.
Combines physiological metrics into a 0-100 score.
"""

import math


def compute_readiness_score(
    bpm: float,
    hrv_sdnn: float,
    lf_hf_ratio: float,
    gravity_mode: str = "earth"
) -> int:
    """
    Compute Space Readiness Score (0-100).
    
    Scoring logic:
    - Heart Rate component (30%): Optimal range 55-75 BPM
    - HRV component (35%): Higher SDNN = better recovery = higher score
    - Stress component (35%): Lower LF/HF ratio = less stress = higher score
    
    Microgravity adjustment:
    - In 0g, heart rate drops ~10-15 BPM (fluid shift to upper body)
    - HRV baselines shift; we adjust thresholds accordingly
    """
    
    # --- Heart Rate Score (0-30) ---
    if gravity_mode == "microgravity":
        # In microgravity, optimal HR is lower due to fluid redistribution
        optimal_center = 60.0
        optimal_range = 15.0
    else:
        optimal_center = 67.0
        optimal_range = 13.0
    
    hr_deviation = abs(bpm - optimal_center) / optimal_range
    hr_score = max(0, 30 * (1 - hr_deviation))
    
    # --- HRV Score (0-35) ---
    # SDNN > 100ms is excellent, < 20ms is very poor
    if gravity_mode == "microgravity":
        # Microgravity reduces HRV; adjust baseline
        sdnn_max = 80.0
    else:
        sdnn_max = 120.0
    
    hrv_normalized = min(hrv_sdnn / sdnn_max, 1.0)
    hrv_score = 35 * hrv_normalized
    
    # --- Stress Score (0-35) ---
    # LF/HF < 1.0 = parasympathetic dominant (calm) = high score
    # LF/HF > 4.0 = sympathetic dominant (stressed) = low score
    if gravity_mode == "microgravity":
        stress_threshold = 3.0  # More lenient in microgravity
    else:
        stress_threshold = 4.0
    
    stress_normalized = max(0, 1 - (lf_hf_ratio / stress_threshold))
    stress_score = 35 * stress_normalized
    
    total = hr_score + hrv_score + stress_score
    
    # Clamp to 0-100
    return max(0, min(100, round(total)))
