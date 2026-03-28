
"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

interface Props {
  gravityMode: "earth" | "microgravity";
  onToggle: () => void;
}

export default function GravityToggle({ gravityMode, onToggle }: Props) {
  const isMicro = gravityMode === "microgravity";
  const ref = useRef<HTMLButtonElement>(null);
  
  // Magnetic state
  const x = useSpring(0, { stiffness: 150, damping: 15, mass: 0.1 });
  const y = useSpring(0, { stiffness: 150, damping: 15, mass: 0.1 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current.getBoundingClientRect();
    
    // Magnetic pull distance (how far it moves towards cursor)
    const pullDistance = 15; 
    
    const xPos = clientX - (left + width / 2);
    const yPos = clientY - (top + height / 2);
    
    x.set((xPos / width) * pullDistance);
    y.set((yPos / height) * pullDistance);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      onClick={onToggle}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x, y }}
      id="gravity-toggle"
      className="glass-card px-5 py-3 flex items-center gap-4 cursor-pointer group relative overflow-hidden"
      animate={{
        borderColor: isMicro ? "rgba(139, 92, 246, 0.4)" : "rgba(0, 240, 255, 0.2)",
      }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Background glow reacting to hover */}
      <motion.div 
        className="absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none"
        style={{
           background: isMicro ? "var(--violet-plasma)" : "var(--cyan-glow)"
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Animated gravity icon */}
      <motion.div
        animate={{
          y: isMicro ? [0, -4, 0] : 0,
        }}
        transition={{
          duration: 2,
          repeat: isMicro ? Infinity : 0,
          ease: "easeInOut",
        }}
        className="text-2xl"
      >
        {isMicro ? "🚀" : "🌍"}
      </motion.div>

      {/* Labels */}
      <div className="flex flex-col items-start">
        <span
          className="text-xs"
          style={{
            color: "var(--text-dim)",
            fontFamily: "'JetBrains Mono'",
            letterSpacing: "1px",
            fontSize: "10px",
          }}
        >
          GRAVITY MODE
        </span>
        <motion.span
          key={gravityMode}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-semibold"
          style={{
            color: isMicro ? "var(--violet-plasma)" : "var(--cyan-glow)",
            fontFamily: "'JetBrains Mono'",
          }}
        >
          {isMicro ? "Microgravity (0g)" : "Earth Standard (1g)"}
        </motion.span>
      </div>

      {/* Toggle track */}
      <div className="ml-auto">
        <div
          className="relative w-12 h-6 rounded-full"
          style={{
            background: isMicro
              ? "rgba(139, 92, 246, 0.25)"
              : "rgba(255, 255, 255, 0.08)",
            border: `1px solid ${
              isMicro ? "rgba(139, 92, 246, 0.4)" : "rgba(255,255,255,0.1)"
            }`,
          }}
        >
          <motion.div
            className="absolute top-0.5 w-5 h-5 rounded-full"
            animate={{
              left: isMicro ? "calc(100% - 22px)" : "2px",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{
              background: isMicro ? "var(--violet-plasma)" : "var(--text-dim)",
              boxShadow: isMicro
                ? "0 0 10px rgba(139, 92, 246, 0.5)"
                : "none",
            }}
          />
        </div>
      </div>
    </motion.button>
  );
}
