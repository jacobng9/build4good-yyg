"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

interface Props {
  value: number;
  className?: string;
  style?: React.CSSProperties;
  format?: (v: number) => string | number;
}

export default function SmoothCounter({ 
  value, 
  className = "", 
  style = {}, 
  format = (v) => Math.round(v) 
}: Props) {
  const animatedValue = useSpring(value, {
    stiffness: 100,
    damping: 20,
    restDelta: 0.5
  });

  useEffect(() => {
    animatedValue.set(value);
  }, [value, animatedValue]);

  const display = useTransform(animatedValue, (latest) => String(format(latest)));

  return <motion.span style={style} className={className}>{display as any}</motion.span>;
}
