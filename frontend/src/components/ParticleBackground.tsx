"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let stars: Star[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const initStars = () => {
      const count = Math.floor((canvas.width * canvas.height) / 8000);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.8 + 0.2,
        speed: Math.random() * 0.15 + 0.02,
        opacity: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
      }));
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep space gradient background
      const gradient = ctx.createRadialGradient(
        canvas.width * 0.3,
        canvas.height * 0.3,
        0,
        canvas.width * 0.5,
        canvas.height * 0.5,
        canvas.width * 0.8
      );
      gradient.addColorStop(0, "#0d0d2b");
      gradient.addColorStop(0.5, "#080818");
      gradient.addColorStop(1, "#050510");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle nebula patches
      ctx.save();
      ctx.globalAlpha = 0.03;
      const nebulaGrad = ctx.createRadialGradient(
        canvas.width * 0.7, canvas.height * 0.4, 20,
        canvas.width * 0.7, canvas.height * 0.4, 300
      );
      nebulaGrad.addColorStop(0, "#8b5cf6");
      nebulaGrad.addColorStop(1, "transparent");
      ctx.fillStyle = nebulaGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const nebulaGrad2 = ctx.createRadialGradient(
        canvas.width * 0.2, canvas.height * 0.7, 10,
        canvas.width * 0.2, canvas.height * 0.7, 200
      );
      nebulaGrad2.addColorStop(0, "#00f0ff");
      nebulaGrad2.addColorStop(1, "transparent");
      ctx.fillStyle = nebulaGrad2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Draw stars
      for (const star of stars) {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
        const alpha = star.opacity * twinkle;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 210, 255, ${alpha})`;
        ctx.fill();

        // Subtle glow for larger stars
        if (star.size > 1.2) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 240, 255, ${alpha * 0.08})`;
          ctx.fill();
        }

        // Slow drift
        star.y += star.speed;
        if (star.y > canvas.height + 5) {
          star.y = -5;
          star.x = Math.random() * canvas.width;
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
