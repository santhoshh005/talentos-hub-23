import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-white/[0.04]", className)}>
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="glass-panel rounded-2xl p-5">
      <Shimmer className="h-4 w-24" />
      <Shimmer className="mt-4 h-8 w-32" />
      <Shimmer className="mt-3 h-3 w-20" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="glass-panel rounded-2xl p-5">
      <Shimmer className="h-4 w-40" />
      <Shimmer className="mt-4 h-56 w-full" />
    </div>
  );
}

export function TableRowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-panel rounded-2xl p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Shimmer className="h-9 w-9 rounded-full" />
          <Shimmer className="h-4 flex-1" />
          <Shimmer className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function AiLabCardSkeleton() {
  return (
    <div className="glass-panel rounded-2xl p-6">
      <Shimmer className="h-10 w-10 rounded-xl" />
      <Shimmer className="mt-5 h-5 w-36" />
      <Shimmer className="mt-3 h-3 w-full" />
      <Shimmer className="mt-2 h-3 w-3/4" />
      <Shimmer className="mt-6 h-8 w-28 rounded-full" />
    </div>
  );
}

export function UploadBoxSkeleton() {
  return (
    <div className="glass-panel rounded-2xl p-8 flex flex-col items-center gap-4">
      <Shimmer className="h-14 w-14 rounded-2xl" />
      <Shimmer className="h-4 w-56" />
      <Shimmer className="h-3 w-40" />
    </div>
  );
}

export function BlogCardSkeleton() {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <Shimmer className="aspect-video w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Shimmer className="h-3 w-20" />
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-3 w-full" />
      </div>
    </div>
  );
}

export function TimelineMilestoneSkeleton() {
  return (
    <div className="glass-panel rounded-2xl p-5">
      <Shimmer className="h-20 w-full rounded-xl" />
      <Shimmer className="mt-4 h-4 w-28" />
      <Shimmer className="mt-2 h-5 w-40" />
      <Shimmer className="mt-3 h-3 w-full" />
    </div>
  );
}

export function CertificateCardSkeleton() {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <Shimmer className="aspect-[4/3] w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function useMountDelay(delay = 500) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return ready;
}