"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ReactNode, useRef } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function TiltCard({ children, className = "", style = {} }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth out the mouse movement
  const smoothX = useSpring(x, { damping: 20, stiffness: 300 });
  const smoothY = useSpring(y, { damping: 20, stiffness: 300 });

  // Map mouse movement to rotation. 
  // Limit rotation to a subtle amount (e.g., -5 to 5 degrees)
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-6, 6]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    
    // Calculate mouse position relative to card center, normalized to [-0.5, 0.5]
    const relativeX = (e.clientX - rect.left) / rect.width - 0.5;
    const relativeY = (e.clientY - rect.top) / rect.height - 0.5;

    x.set(relativeX);
    y.set(relativeY);
  };

  const handleMouseLeave = () => {
    // Reset back to 0 on leave
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: 1000,
        transformStyle: "preserve-3d",
        rotateX,
        rotateY,
        ...style,
      }}
      className={`glass-card ${className}`}
    >
      {/* 
        Optional subtle glare effect. When the card rotates, 
        we move a radiant gradient across the surface. 
      */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-50 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: "radial-gradient(circle at center, rgba(255,255,255,0.08) 0%, transparent 60%)",
          x: useTransform(smoothX, [-0.5, 0.5], ["-50%", "50%"]),
          y: useTransform(smoothY, [-0.5, 0.5], ["-50%", "50%"]),
        }}
      />
      
      {/* 
        Lift the children off the card background slightly 
        for a true 3D effect.
      */}
      <div 
        style={{ transform: "translateZ(30px)" }} 
        className="w-full h-full relative"
      >
        {children}
      </div>
    </motion.div>
  );
}
