import { createFileRoute, Outlet, Link, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useIsAdmin, clearSession, useAuthStore } from "@/lib/auth-store";
import { signOutFn } from "@/lib/auth.functions";
import { useEffect } from "react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "TalentOS | Admin Panel" }],
  }),
  component: AdminLayout,
});

const NAV_LINKS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Users", icon: Users, exact: false },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3, exact: false },
] as const;

function AdminLayout() {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const session = useAuthStore();

  useEffect(() => {
    if (!session) {
      void router.navigate({ to: "/login" });
      return;
    }
    if (!isAdmin) {
      void router.navigate({ to: "/" });
    }
  }, [session, isAdmin, router]);

  const handleSignOut = async () => {
    if (session?.accessToken) {
      await signOutFn({ data: { accessToken: session.accessToken } });
    }
    clearSession();
    void router.navigate({ to: "/login" });
  };

  if (!session || !isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-white/10 bg-black/60 backdrop-blur-2xl">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.06]">
            <img
              src="/logo.png"
              alt="TalentOS"
              className="h-7 w-7 object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
            />
          </div>
          <div>
            <div className="text-sm font-bold text-gradient">TalentOS</div>
            <div className="flex items-center gap-1 text-[10px] text-amber-400/80">
              <Shield className="h-2.5 w-2.5" />
              Admin Panel
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-white/[0.06] hover:text-white [&.active]:bg-white/[0.08] [&.active]:text-white"
              activeOptions={{ exact: to === "/admin" }}
            >
              <Icon className="h-4 w-4 shrink-0 transition-colors group-hover:text-accent [.active_&]:text-accent" />
              {label}
              <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-50" />
            </Link>
          ))}
        </nav>

        {/* User info + signout */}
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <p className="truncate text-xs font-medium text-white">{session.user.email}</p>
            <p className="text-[10px] text-amber-400">Administrator</p>
          </div>
          <button
            type="button"
            onClick={() => {
              void handleSignOut();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-400"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
          <Link
            to="/"
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Back to TalentOS
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="p-8"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
