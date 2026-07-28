import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const ghostCards = ["Resume", "JD", "Candidate", "Offer", "LinkedIn", "Boolean Search", "Interview"];

export function LoaderBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      setPos({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduce]);

  const particles = reduce ? [] : Array.from({ length: 22 });

  return (
    <div ref={ref} aria-hidden className="absolute inset-0 overflow-hidden" style={{ backgroundColor: "#020617" }}>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 10%, oklch(0.555 0.22 264 / 0.35), transparent 70%), radial-gradient(45% 40% at 80% 70%, oklch(0.78 0.15 220 / 0.22), transparent 70%), radial-gradient(40% 40% at 10% 80%, oklch(0.6 0.2 280 / 0.18), transparent 70%)",
        }}
      />

      {!reduce && (
        <motion.div
          className="absolute -inset-[20%] opacity-40"
          style={{
            background:
              "conic-gradient(from 90deg at 50% 50%, transparent 0deg, oklch(0.555 0.22 264 / 0.18) 90deg, transparent 180deg, oklch(0.78 0.15 220 / 0.2) 270deg, transparent 360deg)",
            filter: "blur(80px)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
      )}

      {!reduce && (
        <>
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
        </>
      )}

      <div
        className="absolute inset-0 opacity-[0.06] [mask-image:radial-gradient(60%_50%_at_50%_50%,black,transparent_80%)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          filter: "blur(0.5px)",
        }}
      />

      {!reduce && (
        <div
          className="absolute inset-0 transition-[background] duration-200"
          style={{
            background: `radial-gradient(320px circle at ${pos.x * 100}% ${pos.y * 100}%, oklch(0.78 0.15 220 / 0.18), transparent 60%)`,
          }}
        />
      )}

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
            style={{ left: `${left}%`, top: `${top}%`, width: size, height: size }}
            animate={{ y: [0, -30, 0], opacity: [0.15, 0.9, 0.15] }}
            transition={{ duration: dur, delay, repeat: Infinity, ease: "easeInOut" }}
          />
        );
      })}

      {!reduce &&
        ghostCards.map((label, i) => {
          const left = (i * 137) % 90;
          const top = (i * 79) % 80;
          const dur = 18 + (i % 5) * 3;
          return (
            <motion.div
              key={label}
              className="absolute rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/60 backdrop-blur-md"
              style={{ left: `${left}%`, top: `${top}%`, filter: "blur(1px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0], y: [0, -40, -80], x: [0, 10, -10] }}
              transition={{ duration: dur, delay: i * 1.3, repeat: Infinity, ease: "easeInOut" }}
            >
              {label}
            </motion.div>
          );
        })}
    </div>
  );
}