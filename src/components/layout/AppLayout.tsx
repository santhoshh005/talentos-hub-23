import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Ambient background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
      >
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,oklch(0.555_0.22_264/0.18),transparent_70%)]" />
        <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-[380px] w-[520px] rounded-full bg-accent/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <Navbar />
      <main className="pt-24">{children}</main>
      <Footer />
    </div>
  );
}