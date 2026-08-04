import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, User as UserIcon, Settings, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsAuthenticated, clearSession, useAuthStore } from "@/lib/auth-store";
import { signOutFn } from "@/lib/auth.functions";

const links = [
  { to: "/", label: "Home" },
  { to: "/workspace", label: "Workspace" },
  { to: "/timeline", label: "Timeline" },
  { to: "/content", label: "Content" },
  { to: "/certifications", label: "Certifications" },
  { to: "/contact", label: "Contact" },
] as const;

function UserMenu() {
  const router = useRouter();
  const session = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!session) return null;

  const { user, profile } = session;
  const initial = profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "?";
  const isAdmin = profile?.role === "admin";

  const handleLogout = async () => {
    if (session?.accessToken) {
      await signOutFn({ data: { accessToken: session.accessToken } });
    }
    clearSession();
    void router.navigate({ to: "/login" });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 pr-3 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent/50"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white shadow-inner">
          {initial}
        </div>
        <div className="flex flex-col items-start hidden sm:flex">
          <span className="text-xs font-medium leading-none text-white max-w-[100px] truncate">
            {profile?.full_name || "User"}
          </span>
          <span className="text-[10px] text-muted-foreground leading-tight">
            {isAdmin ? "Admin" : "Standard"}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 origin-top-right rounded-2xl border border-white/10 bg-background/80 p-2 shadow-2xl backdrop-blur-2xl"
          >
            <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">
                {initial}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium text-white">
                  {profile?.full_name || "User Account"}
                </span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
            </div>

            <div className="space-y-1">
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
                >
                  <Shield className="h-4 w-4" />
                  Admin Dashboard
                </Link>
              )}
              <Link
                to="/workspace"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
              >
                <Settings className="h-4 w-4" />
                Workspace
              </Link>
              <div className="my-1 h-px w-full bg-white/10" />
              <button
                onClick={() => void handleLogout()}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  
  const isAuthenticated = useIsAuthenticated();

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
            <span className="grid h-9 w-9 place-items-center rounded-full overflow-hidden">
              <img
                src="/logo.png"
                alt="TalentOS Logo"
                className="h-full w-full object-contain drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]"
              />
            </span>
            <span className="text-lg font-semibold tracking-tight ml-1">
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
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <Link
                to="/contact"
                className="rounded-lg bg-gradient-to-r from-primary to-accent px-3.5 py-1.5 text-sm font-medium text-white shadow-[0_10px_30px_-10px] shadow-primary/60 transition-transform hover:scale-[1.02]"
              >
                Book a demo
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            {isAuthenticated && <UserMenu />}
            <button
              onClick={() => setOpen((v) => !v)}
              className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-white/5"
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
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
