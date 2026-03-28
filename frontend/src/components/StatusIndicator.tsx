"use client";

import { motion } from "framer-motion";

interface Props {
  isConnected: boolean;
  bpm: number;
  gravityMode: string;
}

export default function StatusIndicator({ isConnected, bpm, gravityMode }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card px-4 py-2 flex items-center gap-4"
    >
      {/* Connection status */}
      <div className="flex items-center gap-2">
        <div
          className={`status-dot ${!isConnected ? "critical" : ""}`}
        />
        <span
          className="text-xs"
          style={{
            color: "var(--text-dim)",
            fontFamily: "'JetBrains Mono'",
          }}
        >
          {isConnected ? "TELEMETRY LINKED" : "SIGNAL LOST"}
        </span>
      </div>

      <div
        style={{
          width: "1px",
          height: "16px",
          background: "rgba(255,255,255,0.1)",
        }}
      />

      {/* Mission info */}
      <span
        className="text-xs"
        style={{
          color: "var(--text-dim)",
          fontFamily: "'JetBrains Mono'",
        }}
      >
        CREW-01 • CDR.HARPER
      </span>

      <div
        style={{
          width: "1px",
          height: "16px",
          background: "rgba(255,255,255,0.1)",
        }}
      />

      <span
        className="text-xs"
        style={{
          color: "var(--text-dim)",
          fontFamily: "'JetBrains Mono'",
        }}
      >
        MET{" "}
        <span style={{ color: "var(--cyan-glow)" }}>
          {new Date().toISOString().slice(11, 19)}
        </span>
      </span>

      <div className="flex-1" />

      <span
        className="text-xs"
        style={{
          color: "var(--text-dim)",
          fontFamily: "'JetBrains Mono'",
          fontSize: "10px",
          letterSpacing: "1px",
        }}
      >
        ASTROSYNC v1.0
      </span>
    </motion.div>
  );
}
