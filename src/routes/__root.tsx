import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { Toaster } from "sonner";
import appCss from "../styles.css?url";
import { AppLayout } from "../components/layout/AppLayout";
import { LoaderProvider } from "../components/loader/LoaderProvider";
import { FirstVisitGate } from "../components/loader/FirstVisitGate";

function NotFoundComponent() {
  return (
    <AppLayout>
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-7xl font-bold text-gradient">404</h1>
          <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-medium text-white shadow-[0_10px_30px_-10px] shadow-primary/60"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    // Error reporting can be added here
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TalentOS | AI Recruitment Platform" },
      {
        name: "description",
        content:
          "TalentOS is an AI-powered recruitment platform that helps recruiters generate job descriptions, analyze resumes, create Boolean searches, estimate salaries, and streamline hiring with AI.",
      },
      { name: "author", content: "Hemanth Kumar" },
      { property: "og:title", content: "TalentOS | AI Recruitment Platform" },
      {
        property: "og:description",
        content:
          "TalentOS is an AI-powered recruitment platform that helps recruiters generate job descriptions, analyze resumes, create Boolean searches, estimate salaries, and streamline hiring with AI.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "TalentOS" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "TalentOS | AI Recruitment Platform" },
      {
        name: "twitter:description",
        content:
          "AI-powered recruitment platform: generate JDs, analyze resumes, build Boolean searches, estimate salaries, and hire faster.",
      },
      { name: "theme-color", content: "#0F172A" },
    ],
    links: [
      {
        rel: "icon",
        type: "image/png",
        href: "/logo.png",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <LoaderProvider>
        <FirstVisitGate>
          <Outlet />
        </FirstVisitGate>
        <Toaster theme="dark" position="top-center" richColors />
      </LoaderProvider>
    </QueryClientProvider>
  );
}
