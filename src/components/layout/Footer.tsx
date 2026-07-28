import { Link } from "@tanstack/react-router";
import { Sparkles, Linkedin, Instagram, Mail } from "lucide-react";

const columns = [
  {
    title: "Platform",
    links: [
      { to: "/dashboard", label: "Dashboard" },
      { to: "/workspace", label: "Recruiter Workspace" },
      { to: "/timeline", label: "Timeline" },
    ],
  },
  {
    title: "Resources",
    links: [
      { to: "/content", label: "Content" },
      { to: "/certifications", label: "Certifications" },
      { to: "/contact", label: "Contact" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-white/5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
      />
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-[0_0_20px_-4px] shadow-primary/60">
                <Sparkles className="h-4 w-4 text-white" />
              </span>
              <span className="text-base font-semibold tracking-tight">
                Talent<span className="text-gradient">OS</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Building the Future of AI Recruitment.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { icon: Mail, href: "mailto:hemanthhemu1104@gmail.com", label: "Email" },
                { icon: Linkedin, href: "https://www.linkedin.com/in/hemanth-kumar-235078270", label: "LinkedIn" },
                { icon: Instagram, href: "https://www.instagram.com/heyyy.m_ant/", label: "Instagram" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.02] text-muted-foreground transition-all hover:text-foreground hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-sm text-muted-foreground/90 transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Stay in the loop
            </h4>
            <p className="mt-4 text-sm text-muted-foreground">
              Product updates and AI recruitment insights.
            </p>
            <form className="mt-3 flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="you@company.com"
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
              <button className="shrink-0 rounded-lg bg-gradient-to-r from-primary to-accent px-3 py-2 text-sm font-medium text-white shadow-[0_10px_30px_-10px] shadow-primary/60">
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/5 pt-6 text-sm text-muted-foreground md:flex-row md:items-center">
          <p>
            <span className="font-semibold text-foreground">TalentOS</span> — Building the Future of AI Recruitment.
          </p>
          <p>Designed &amp; Built by Hemanth Kumar.</p>
        </div>
      </div>
    </footer>
  );
}