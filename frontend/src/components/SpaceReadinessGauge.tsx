"use client";

import { motion } from "framer-motion";
import TiltCard from "./TiltCard";
import SmoothCounter from "./SmoothCounter";

interface Props {
  score: number;
}

export default function SpaceReadinessGauge({ score }: Props) {
  // Arc geometry
  const size = 220;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const startAngle = 135;
  const totalAngle = 270;

  // Score to arc
  const clampedScore = Math.max(0, Math.min(100, score));
  const fillAngle = (clampedScore / 100) * totalAngle;
  const dashOffset = circumference - (fillAngle / 360) * circumference;

  // Color gradient stops based on score
  const getColor = (s: number) => {
    if (s >= 80) return { main: "#34d399", glow: "rgba(52, 211, 153, 0.4)" };
    if (s >= 60) return { main: "#00f0ff", glow: "rgba(0, 240, 255, 0.4)" };
    if (s >= 40) return { main: "#f59e0b", glow: "rgba(245, 158, 11, 0.4)" };
    return { main: "#ef4444", glow: "rgba(239, 68, 68, 0.4)" };
  };

  const color = getColor(clampedScore);

  // Status text
  const getStatus = (s: number) => {
    if (s >= 80) return "OPTIMAL";
    if (s >= 60) return "NOMINAL";
    if (s >= 40) return "ELEVATED";
    return "CRITICAL";
  };

  return (
    <TiltCard className="p-6 flex flex-col items-center justify-center">
      <p className="section-label text-center mb-2">Space Readiness</p>

      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: `rotate(${startAngle}deg)` }}
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${(totalAngle / 360) * circumference} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Animated fill arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color.main}
            strokeWidth={strokeWidth}
            strokeDasharray={`${(totalAngle / 360) * circumference} ${circumference}`}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              filter: `drop-shadow(0 0 8px ${color.glow})`,
            }}
          />
        </svg>

        {/* Center content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{ paddingTop: 10 }}
        >
          <SmoothCounter
            value={clampedScore}
            className="metric-value text-5xl"
            style={{
              color: color.main,
              textShadow: `0 0 20px ${color.glow}`,
            }}
          />
          <motion.span
            key={getStatus(clampedScore)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs mt-1"
            style={{
              color: color.main,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "3px",
              fontWeight: 600,
            }}
          >
            {getStatus(clampedScore)}
          </motion.span>
        </div>
      </div>
    </TiltCard>
  );
}
