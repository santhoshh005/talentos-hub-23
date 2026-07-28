import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Users,
  Brain,
  FileText,
  SearchCode,
  MessageSquareQuote,
  LayoutTemplate,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/workspace/candidate", label: "Candidate Workspace", icon: Users, status: "live" as const },
  { to: "/workspace/intelligence", label: "Resume Intelligence", icon: Brain, status: "live" as const },
  { to: "/workspace/templates", label: "Client Templates", icon: LayoutTemplate, status: "live" as const },
  { to: "/workspace/jd", label: "JD Studio", icon: FileText, status: "soon" as const },
  { to: "/workspace/boolean", label: "Boolean Builder", icon: SearchCode, status: "soon" as const },
  { to: "/workspace/interview", label: "Interview Studio", icon: MessageSquareQuote, status: "soon" as const },
];

export function WorkspaceSubNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-1.5 backdrop-blur-xl">
      <div className="grid grid-cols-2 gap-1 md:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => {
          const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group relative flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="workspace-active-tab"
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/25 to-accent/15 ring-1 ring-white/10"
                  transition={{ type: "spring", damping: 26, stiffness: 260 }}
                />
              )}
              <span className="relative z-10 grid h-6 w-6 place-items-center rounded-md bg-white/[0.04]">
                <Icon className="h-3.5 w-3.5 text-accent" />
              </span>
              <span className="relative z-10 truncate">{item.label}</span>
              {item.status === "soon" && (
                <span className="relative z-10 ml-auto hidden text-[9px] uppercase tracking-wider text-muted-foreground lg:inline">
                  Soon
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}