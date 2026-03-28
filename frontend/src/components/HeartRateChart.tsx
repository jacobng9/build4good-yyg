"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { motion } from "framer-motion";
import { StreamResponse } from "@/lib/api";
import TiltCard from "./TiltCard";
import SmoothCounter from "./SmoothCounter";

interface Props {
  history: StreamResponse[];
  current: StreamResponse | null;
}

export default function HeartRateChart({ history, current }: Props) {
  const data = history.map((d, i) => ({
    tick: i,
    bpm: d.bpm,
  }));

  const bpm = current?.bpm ?? 0;

  // Color based on BPM range
  const getStatusColor = (bpm: number) => {
    if (bpm < 50 || bpm > 120) return "#ef4444"; // danger
    if (bpm < 55 || bpm > 100) return "#f59e0b"; // warning
    return "#00f0ff"; // good
  };

  const statusColor = getStatusColor(bpm);

  return (
    <TiltCard className="p-5 flex flex-col h-full glow-cyan">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="section-label">Heart Rate</p>
          <div className="flex items-baseline gap-2">
            <SmoothCounter 
              value={bpm} 
              format={(v) => Math.round(v)}
              className="metric-value text-3xl"
              style={{ color: statusColor }}
            />
            <span className="text-sm" style={{ color: "var(--text-dim)" }}>
              BPM
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full animate-pulse-glow"
            style={{ backgroundColor: statusColor }}
          />
          <span
            className="text-xs"
            style={{
              color: "var(--text-dim)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            LIVE
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="bpmGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#00f0ff" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="tick" hide />
            <YAxis
              domain={["dataMin - 5", "dataMax + 5"]}
              tick={{ fontSize: 10 }}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(10, 10, 26, 0.9)",
                border: "1px solid rgba(0, 240, 255, 0.2)",
                borderRadius: "8px",
                color: "#e8eaf6",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px",
              }}
              formatter={(value: any) => [`${Number(value).toFixed(1)} BPM`, "Heart Rate"]}
            />
            <Area
              type="monotone"
              dataKey="bpm"
              stroke="#00f0ff"
              strokeWidth={2}
              fill="url(#bpmGradient)"
              animationDuration={300}
              dot={false}
              style={{
                filter: "drop-shadow(0 0 6px rgba(0, 240, 255, 0.4))",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </TiltCard>
  );
}
