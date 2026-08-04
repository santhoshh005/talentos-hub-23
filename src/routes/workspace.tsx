import { Outlet, createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { WorkspaceHero } from "@/components/workspace/WorkspaceHero";
import { WorkspaceSubNav } from "@/components/workspace/SubNav";
import { useAuthStore } from "@/lib/auth-store";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Recruiter Workspace — TalentOS" },
      {
        name: "description",
        content:
          "The Recruiter's Operating System. Extract candidate data from resumes, edit records, export to any client Excel template — in minutes.",
      },
      { property: "og:title", content: "Recruiter Workspace — TalentOS" },
      {
        property: "og:description",
        content:
          "Candidate Workspace, Resume Intelligence, JD Studio and more — TalentOS' recruiter productivity hub.",
      },
    ],
  }),
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const session = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!session?.accessToken) {
      void router.navigate({ to: "/login" });
    }
  }, [session, router]);

  if (!session?.accessToken) return null;

  return (
    <AppLayout>
      <WorkspaceHero
        eyebrow="The Recruiter's Operating System"
        title={
          <>
            Recruiter <span className="text-gradient">Workspace</span>
          </>
        }
        description="Turn resumes into recruiter-ready candidate records — extract, edit, and export into any client Excel template."
      />
      <section className="mx-auto max-w-7xl px-4 pb-24">
        <WorkspaceSubNav />
        <div className="mt-6">
          <Outlet />
        </div>
      </section>
    </AppLayout>
  );
}
