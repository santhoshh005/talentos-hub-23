import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "./AppLayout";

interface PageShellProps {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  children?: ReactNode;
}

export function PageShell({ eyebrow, title, description, children }: PageShellProps) {
  return (
    <AppLayout>
      <section className="mx-auto max-w-7xl px-4 pb-24 pt-12 md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          {eyebrow && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
              {eyebrow}
            </span>
          )}
          <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
          {description && (
            <p className="mt-4 text-base text-muted-foreground md:text-lg">{description}</p>
          )}
        </motion.div>

        {children && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12"
          >
            {children}
          </motion.div>
        )}
      </section>
    </AppLayout>
  );
}
