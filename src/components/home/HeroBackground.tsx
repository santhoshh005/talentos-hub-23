import { useEffect, useRef, memo } from "react";
import { motion } from "framer-motion";

/**
 * Ambient hero backdrop: animated gradient, blurred glowing orbs,
 * subtle grid, mouse-follow glow, and floating particles.
 * Pointer-events disabled so it never blocks the hero UI.
 */
export const HeroBackground = memo(function HeroBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    // Set initial values
    el.style.setProperty("--mouse-x", "50%");
    el.style.setProperty("--mouse-y", "35%");

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      // Use CSS variables to bypass React state entirely for mouse moves
      el.style.setProperty("--mouse-x", `${x * 100}%`);
      el.style.setProperty("--mouse-y", `${y * 100}%`);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const particles = Array.from({ length: 22 });

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* Animated conic/linear gradient wash */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 0%, oklch(0.555 0.22 264 / 0.28), transparent 70%), radial-gradient(45% 40% at 80% 60%, oklch(0.78 0.15 220 / 0.18), transparent 70%), radial-gradient(40% 40% at 10% 70%, oklch(0.6 0.2 280 / 0.15), transparent 70%)",
        }}
      />

      {/* Slow moving gradient sheen */}
      <motion.div
        className="absolute -inset-[20%] opacity-40"
        style={{
          background:
            "conic-gradient(from 90deg at 50% 50%, transparent 0deg, oklch(0.555 0.22 264 / 0.15) 90deg, transparent 180deg, oklch(0.78 0.15 220 / 0.18) 270deg, transparent 360deg)",
          filter: "blur(80px)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />

      {/* Glowing orbs */}
      <motion.div
        className="absolute -top-32 left-1/4 h-[420px] w-[420px] rounded-full bg-primary/25 blur-[120px]"
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 right-[10%] h-[360px] w-[360px] rounded-full bg-accent/25 blur-[120px]"
        animate={{ x: [0, -30, 20, 0], y: [0, 40, -20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-[15%] h-[300px] w-[300px] rounded-full bg-[oklch(0.6_0.2_280)]/20 blur-[120px]"
        animate={{ x: [0, 30, -15, 0], y: [0, 20, -25, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.05] [mask-image:radial-gradient(60%_50%_at_50%_35%,black,transparent_80%)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      {/* Mouse-follow glow */}
      <div
        className="absolute inset-0 transition-[background] duration-200"
        style={{
          background: `radial-gradient(320px circle at var(--mouse-x) var(--mouse-y), oklch(0.78 0.15 220 / 0.18), transparent 60%)`,
        }}
      />

      {/* Floating particles */}
      {particles.map((_, i) => {
        const left = (i * 53) % 100;
        const top = (i * 37) % 100;
        const size = 2 + ((i * 7) % 4);
        const dur = 8 + ((i * 3) % 10);
        const delay = (i % 6) * 0.6;
        return (
          <motion.span
            key={i}
            className="absolute rounded-full bg-white/60 shadow-[0_0_10px_2px_rgba(56,189,248,0.6)]"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.15, 0.9, 0.15],
            }}
            transition={{
              duration: dur,
              delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </div>
  );
});
