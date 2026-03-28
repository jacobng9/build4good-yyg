"use client";

import { motion } from "framer-motion";
import { AtmosphericData } from "@/lib/api";

interface Props {
  data: AtmosphericData | null;
  gravityMode: string;
}

interface MetricRow {
  label: string;
  value: string;
  unit: string;
  icon: string;
  color: string;
  barPercent: number;
  warning?: boolean;
}

export default function AtmosphericSidebar({ data, gravityMode }: Props) {
  if (!data) {
    return (
      <div className="glass-card p-5 flex-1 flex items-center justify-center">
        <p style={{ color: "var(--text-dim)" }}>Awaiting telemetry...</p>
      </div>
    );
  }

  const metrics: MetricRow[] = [
    {
      label: "Oxygen Level",
      value: data.o2_percent.toFixed(1),
      unit: "%",
      icon: "🫁",
      color: "var(--aurora-green)",
      barPercent: (data.o2_percent / 25) * 100,
      warning: data.o2_percent < 19.5,
    },
    {
      label: "Radiation",
      value:
        data.radiation_msv < 0.01
          ? data.radiation_msv.toFixed(4)
          : data.radiation_msv.toFixed(3),
      unit: "mSv/hr",
      icon: "☢️",
      color:
        data.radiation_msv > 0.1 ? "var(--danger-red)" : "var(--solar-amber)",
      barPercent: Math.min(100, (data.radiation_msv / 1) * 100),
      warning: data.radiation_msv > 0.1,
    },
    {
      label: "Gravity",
      value: data.gravity_g.toFixed(2),
      unit: "g",
      icon: "🌍",
      color: "var(--cyan-glow)",
      barPercent: data.gravity_g * 100,
    },
    {
      label: "Pressure",
      value: data.pressure_kpa.toFixed(1),
      unit: "kPa",
      icon: "🌡️",
      color: "var(--violet-plasma)",
      barPercent: (data.pressure_kpa / 110) * 100,
    },
    {
      label: "Cabin Temp",
      value: data.cabin_temp_c.toFixed(1),
      unit: "°C",
      icon: "🌡",
      color: "var(--nebula-pink)",
      barPercent: ((data.cabin_temp_c + 10) / 50) * 100,
    },
  ];

  return (
    <div className="glass-card p-5 flex flex-col gap-1 flex-1">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🛰️</span>
        <p className="section-label mb-0">Environment</p>
        <div className="flex-1" />
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            background:
              gravityMode === "microgravity"
                ? "rgba(139, 92, 246, 0.2)"
                : "rgba(0, 240, 255, 0.1)",
            color:
              gravityMode === "microgravity"
                ? "var(--violet-plasma)"
                : "var(--cyan-dim)",
            border: `1px solid ${
              gravityMode === "microgravity"
                ? "rgba(139, 92, 246, 0.3)"
                : "rgba(0, 240, 255, 0.15)"
            }`,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px",
            letterSpacing: "1px",
          }}
        >
          {gravityMode === "microgravity" ? "μG ENV" : "1G ENV"}
        </span>
      </div>

      {metrics.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className="py-3"
          style={{
            borderBottom:
              i < metrics.length - 1
                ? "1px solid rgba(255,255,255,0.04)"
                : "none",
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm">{m.icon}</span>
              <span
                className="text-xs"
                style={{
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                }}
              >
                {m.label}
              </span>
              {m.warning && (
                <span className="text-xs" style={{ color: "var(--danger-red)" }}>
                  ⚠
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className="metric-value text-sm"
                style={{ color: m.color }}
              >
                {m.value}
              </span>
              <span
                className="text-xs"
                style={{
                  color: "var(--text-dim)",
                  fontFamily: "'JetBrains Mono'",
                }}
              >
                {m.unit}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div
            className="w-full h-1 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, m.barPercent)}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                background: m.color,
                boxShadow: `0 0 8px ${m.color}40`,
              }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
