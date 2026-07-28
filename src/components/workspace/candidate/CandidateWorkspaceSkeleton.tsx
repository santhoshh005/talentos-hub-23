import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-md bg-white/[0.04] ${className}`}>
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

export function CandidateWorkspaceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-3 backdrop-blur-xl">
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
        <div className="text-sm text-muted-foreground">
          Parsing resume and extracting candidate details…
        </div>
      </div>

      {/* Snapshot skeleton */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
        <div className="bg-gradient-to-br from-primary/10 via-transparent to-accent/10 px-6 py-6 md:px-8">
          <div className="flex items-start gap-4">
            <Shimmer className="h-14 w-14 rounded-2xl" />
            <div className="flex-1 space-y-3">
              <Shimmer className="h-3 w-24" />
              <Shimmer className="h-6 w-64" />
              <Shimmer className="h-3 w-40" />
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                <Shimmer className="h-3 w-20" />
                <Shimmer className="mt-2 h-4 w-32" />
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Shimmer key={i} className="h-6 w-20 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Editor + sidebar skeleton */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <Shimmer className="h-3 w-24" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((__, j) => (
                  <div key={j} className="space-y-2">
                    <Shimmer className="h-2.5 w-16" />
                    <Shimmer className="h-9 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <Shimmer className="h-3 w-28" />
            <Shimmer className="mt-3 h-8 w-16" />
            <Shimmer className="mt-3 h-1.5 w-full rounded-full" />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
            <Shimmer className="h-3 w-24" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Shimmer key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}