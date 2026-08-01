import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home" },
  { to: "/workspace", label: "Workspace" },
  { to: "/timeline", label: "Timeline" },
  { to: "/content", label: "Content" },
  { to: "/certifications", label: "Certifications" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "py-2" : "py-4",
      )}
    >
      <div className="mx-auto max-w-7xl px-4">
        <nav
          className={cn(
            "flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300",
            scrolled ? "glass-panel" : "border border-transparent",
          )}
        >
          <Link to="/" className="flex items-center gap-2 group">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-[0_0_20px_-4px] shadow-primary/60">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <span className="text-base font-semibold tracking-tight">
              Talent<span className="text-gradient">OS</span>
            </span>
          </Link>

          <ul className="hidden lg:flex items-center gap-1">
            {links.map((l) => {
              const active = l.to === "/" ? pathname === "/" : pathname.startsWith(l.to);
              return (
                <li key={l.to} className="relative">
                  <Link
                    to={l.to}
                    className="relative rounded-lg px-3 py-1.5 text-sm transition-colors"
                    activeProps={{ className: "text-foreground" }}
                    inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
                    activeOptions={{ exact: l.to === "/" }}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-lg bg-white/5 ring-1 ring-white/10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative">{l.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="hidden lg:flex items-center gap-2">
            <Link
              to="/contact"
              className="rounded-lg bg-gradient-to-r from-primary to-accent px-3.5 py-1.5 text-sm font-medium text-white shadow-[0_10px_30px_-10px] shadow-primary/60 transition-transform hover:scale-[1.02]"
            >
              Book a demo
            </Link>
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-white/5"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden mt-2 glass-panel rounded-2xl p-2"
            >
              <ul className="flex flex-col">
                {links.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="block rounded-lg px-3 py-2 text-sm"
                      activeProps={{ className: "bg-white/5 text-foreground" }}
                      inactiveProps={{
                        className: "text-muted-foreground hover:text-foreground hover:bg-white/5",
                      }}
                      activeOptions={{ exact: l.to === "/" }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
