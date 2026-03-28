"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { StreamResponse } from "@/lib/api";
import TiltCard from "./TiltCard";

interface Props {
  history: StreamResponse[];
  current: StreamResponse | null;
}

export default function HRVChart({ history, current }: Props) {
  const data = history.map((d, i) => ({
    tick: i,
    sdnn: d.hrv.sdnn,
    rmssd: d.hrv.rmssd,
  }));

  const sdnn = current?.hrv.sdnn ?? 0;
  const rmssd = current?.hrv.rmssd ?? 0;
  const lfHf = current?.lf_hf_ratio ?? 0;

  return (
    <TiltCard className="p-5 flex flex-col h-full glow-violet">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="section-label">Heart Rate Variability</p>
          <div className="flex items-baseline gap-4">
            <div className="flex items-baseline gap-1">
              <motion.span
                key={sdnn}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="metric-value text-xl"
                style={{ color: "var(--violet-plasma)" }}
              >
                {sdnn.toFixed(1)}
              </motion.span>
              <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                SDNN
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <motion.span
                key={rmssd}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="metric-value text-xl"
                style={{ color: "var(--nebula-pink)" }}
              >
                {rmssd.toFixed(1)}
              </motion.span>
              <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                RMSSD
              </span>
            </div>
          </div>
        </div>
        <div
          className="glass-card px-3 py-1"
          style={{
            borderColor:
              lfHf > 3
                ? "rgba(239, 68, 68, 0.3)"
                : "rgba(0, 240, 255, 0.12)",
          }}
        >
          <span
            className="text-xs"
            style={{ color: "var(--text-dim)", fontFamily: "'JetBrains Mono'" }}
          >
            LF/HF
          </span>
          <span
            className="metric-value text-sm ml-2"
            style={{
              color: lfHf > 3 ? "var(--danger-red)" : "var(--aurora-green)",
            }}
          >
            {lfHf.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <XAxis dataKey="tick" hide />
            <YAxis tick={{ fontSize: 10 }} width={40} />
            <Tooltip
              contentStyle={{
                background: "rgba(10, 10, 26, 0.9)",
                border: "1px solid rgba(139, 92, 246, 0.2)",
                borderRadius: "8px",
                color: "#e8eaf6",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px",
              }}
            />
            <Legend
              iconSize={8}
              wrapperStyle={{
                fontSize: "11px",
                fontFamily: "'JetBrains Mono', monospace",
                color: "var(--text-dim)",
              }}
            />
            <Line
              type="monotone"
              dataKey="sdnn"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
              name="SDNN (ms)"
              style={{
                filter: "drop-shadow(0 0 4px rgba(139, 92, 246, 0.4))",
              }}
            />
            <Line
              type="monotone"
              dataKey="rmssd"
              stroke="#f472b6"
              strokeWidth={2}
              dot={false}
              name="RMSSD (ms)"
              style={{
                filter: "drop-shadow(0 0 4px rgba(244, 114, 182, 0.4))",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </TiltCard>
  );
}
