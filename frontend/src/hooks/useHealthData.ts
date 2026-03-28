"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchStreamData, StreamResponse } from "@/lib/api";

interface HealthDataState {
  current: StreamResponse | null;
  history: StreamResponse[];
  isConnected: boolean;
  error: string | null;
  gravityMode: "earth" | "microgravity";
  toggleGravity: () => void;
}

const POLL_INTERVAL = 1000; // 1 second
const HISTORY_LENGTH = 30; // Keep last 30 readings
const SAMPLES_PER_TICK = 100; // Advance 1 second of data per poll

export function useHealthData(): HealthDataState {
  const [current, setCurrent] = useState<StreamResponse | null>(null);
  const [history, setHistory] = useState<StreamResponse[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gravityMode, setGravityMode] = useState<"earth" | "microgravity">("earth");
  const offsetRef = useRef(0);

  const toggleGravity = useCallback(() => {
    setGravityMode((prev) => (prev === "earth" ? "microgravity" : "earth"));
  }, []);

  useEffect(() => {
    let active = true;
    let timer: NodeJS.Timeout;

    const poll = async () => {
      try {
        const data = await fetchStreamData(offsetRef.current, gravityMode);
        if (!active) return;

        setCurrent(data);
        setHistory((prev) => {
          const next = [...prev, data];
          return next.slice(-HISTORY_LENGTH);
        });
        setIsConnected(true);
        setError(null);

        offsetRef.current += SAMPLES_PER_TICK;
      } catch (err) {
        if (!active) return;
        setIsConnected(false);
        setError(err instanceof Error ? err.message : "Connection failed");
      }

      if (active) {
        timer = setTimeout(poll, POLL_INTERVAL);
      }
    };

    poll();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [gravityMode]);

  return { current, history, isConnected, error, gravityMode, toggleGravity };
}
