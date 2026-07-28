import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LOADER_CONTEXTS, type LoaderContext } from "@/lib/loader-messages";

export type OrbitState = "loading" | "success" | "error" | "idle";
export type OrbitSize = "sm" | "md" | "xl";
export type OrbitVariant = "bare" | "chip" | "overlay";

interface NeuralOrbitProps {
  size?: OrbitSize;
  variant?: OrbitVariant;
  state?: OrbitState;
  context?: LoaderContext;
  messages?: string[];
  icon?: LucideIcon;
  label?: string;
  showMessages?: boolean;
  onExitComplete?: () => void;
  className?: string;
}

const SIZE_PX: Record<OrbitSize, number> = { sm: 20, md: 64, xl: 128 };

export function NeuralOrbit({
  size = "md",
  variant = "bare",
  state = "loading",
  context = "generic",
  messages,
  icon,
  label,
  showMessages,
  onExitComplete,
  className,
}: NeuralOrbitProps) {
  const cfg = LOADER_CONTEXTS[context];
  const Icon = icon ?? cfg.icon;
  const msgs = messages ?? cfg.messages;
  const withMessages = showMessages ?? (size !== "sm" && variant !== "bare");

  if (state === "idle") return null;

  const mark = (
    <AnimatePresence mode="wait" onExitComplete={onExitComplete}>
      {(state === "loading" || state === "success" || state === "error") && (
        <motion.div
          key={state}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={
            state === "success"
              ? { opacity: 0, scale: 0.9, transition: { duration: 0.2, delay: 0.4 } }
              : { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
          }
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {state === "success" ? (
            <SuccessMark size={size} />
          ) : (
            <OrbitMark size={size} Icon={Icon} error={state === "error"} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  const body = (
    <div className={cn("flex items-center gap-3", size === "xl" && "flex-col gap-5", className)}>
      {mark}
      {withMessages && (
        <MessageRotator
          messages={state === "success" ? ["Done"] : state === "error" ? [label ?? "Something went wrong"] : msgs}
          key={state}
          size={size}
        />
      )}
    </div>
  );

  if (variant === "chip") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 backdrop-blur-xl"
      >
        {body}
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="grid place-items-center rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-8 backdrop-blur-xl"
      >
        {body}
      </div>
    );
  }

  return <div role="status" aria-live="polite">{body}</div>;
}

function OrbitMark({ size, Icon, error }: { size: OrbitSize; Icon: LucideIcon; error: boolean }) {
  const reduce = useReducedMotion();
  const px = SIZE_PX[size];
  const showInner = size !== "sm";
  const showDots = size !== "sm";

  // Breathing rotation via cubic-bezier that lingers mid-cycle.
  const spin = reduce
    ? undefined
    : { rotate: [0, 140, 220, 360] };
  const reverse = reduce ? undefined : { rotate: [0, -160, -260, -360] };

  const gradient = error
    ? "conic-gradient(from 0deg, oklch(0.62 0.23 27), transparent 60%, oklch(0.62 0.23 27))"
    : "conic-gradient(from 0deg, var(--primary), var(--accent) 40%, transparent 70%, var(--primary))";

  return (
    <div
      className="relative"
      style={{ width: px, height: px }}
      aria-hidden
    >
      {/* Outer glow */}
      <motion.div
        className="absolute inset-[-15%] rounded-full blur-2xl"
        style={{
          background: error
            ? "radial-gradient(circle, oklch(0.62 0.23 27 / 0.35), transparent 65%)"
            : "radial-gradient(circle, oklch(0.555 0.22 264 / 0.45), transparent 65%)",
        }}
        animate={reduce ? undefined : { opacity: [0.55, 0.95, 0.55], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Conic gradient ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: gradient,
          WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${Math.max(2, px * 0.09)}px), #000 calc(100% - ${Math.max(2, px * 0.09)}px))`,
          mask: `radial-gradient(farthest-side, transparent calc(100% - ${Math.max(2, px * 0.09)}px), #000 calc(100% - ${Math.max(2, px * 0.09)}px))`,
          filter: `drop-shadow(0 0 ${px * 0.15}px oklch(0.555 0.22 264 / 0.6))`,
        }}
        animate={spin}
        transition={{ duration: 2.6, repeat: Infinity, ease: [0.65, 0.05, 0.36, 1] }}
      />

      {/* Inner dashed counter-ring */}
      {showInner && (
        <motion.div
          className="absolute rounded-full border border-dashed border-white/15"
          style={{
            inset: `${px * 0.16}px`,
          }}
          animate={reverse}
          transition={{ duration: 4.2, repeat: Infinity, ease: [0.45, 0.05, 0.55, 0.95] }}
        />
      )}

      {/* Orbiting dots */}
      {showDots && !reduce && (
        <>
          <OrbitDot px={px} radius={0.44} duration={2.4} color="var(--primary)" delay={0} />
          <OrbitDot px={px} radius={0.36} duration={3.4} color="var(--accent)" delay={0.4} reverse />
          <OrbitDot px={px} radius={0.5} duration={4.8} color="rgba(255,255,255,0.7)" delay={0.9} />
        </>
      )}

      {/* Center icon with breathing scale */}
      <motion.div
        className="absolute inset-0 grid place-items-center"
        animate={reduce ? undefined : { scale: [0.94, 1, 0.94], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon
          className={cn(error ? "text-destructive" : "text-foreground")}
          style={{ width: px * 0.34, height: px * 0.34 }}
        />
      </motion.div>
    </div>
  );
}

function OrbitDot({
  px,
  radius,
  duration,
  color,
  delay = 0,
  reverse = false,
}: {
  px: number;
  radius: number;
  duration: number;
  color: string;
  delay?: number;
  reverse?: boolean;
}) {
  const r = px * radius;
  const dot = Math.max(2.5, px * 0.05);
  const rot = reverse ? [0, -360] : [0, 360];
  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{ width: 0, height: 0 }}
      animate={{ rotate: rot }}
      transition={{ duration, repeat: Infinity, ease: [0.5, 0, 0.5, 1], delay }}
    >
      <div
        className="rounded-full"
        style={{
          width: dot,
          height: dot,
          background: color,
          boxShadow: `0 0 ${dot * 3}px ${color}`,
          transform: `translate(${r}px, -50%)`,
        }}
      />
    </motion.div>
  );
}

function SuccessMark({ size }: { size: OrbitSize }) {
  const px = SIZE_PX[size];
  return (
    <div className="relative grid place-items-center" style={{ width: px, height: px }}>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, oklch(0.75 0.18 160 / 0.5), transparent 65%)",
        }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 0.9, 0.4], scale: [0.6, 1.15, 1] }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="grid place-items-center rounded-full border border-emerald-400/40 bg-emerald-500/10"
        style={{ width: px * 0.72, height: px * 0.72 }}
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
        >
          <Check
            className="text-emerald-300"
            style={{ width: px * 0.36, height: px * 0.36 }}
            strokeWidth={2.5}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

function MessageRotator({ messages, size }: { messages: string[]; size: OrbitSize }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (messages.length <= 1) return;
    const t = setInterval(() => setI((n) => (n + 1) % messages.length), 1800);
    return () => clearInterval(t);
  }, [messages]);

  const current = messages[i] ?? messages[0] ?? "";
  const cls = useMemo(() => {
    if (size === "xl") return "text-base md:text-lg text-muted-foreground";
    if (size === "md") return "text-sm text-muted-foreground";
    return "text-xs text-muted-foreground";
  }, [size]);

  return (
    <div className={cn("min-h-[1.25em] tabular-nums", cls)} aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.span
          key={current}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
        >
          {current}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}