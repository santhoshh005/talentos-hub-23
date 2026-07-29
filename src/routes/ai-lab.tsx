import { createFileRoute, redirect } from "@tanstack/react-router";

// AI Lab has been renamed to Recruiter Workspace. Keep this route so old
// links continue to work by redirecting to the new workspace.
export const Route = createFileRoute("/ai-lab")({
  beforeLoad: () => {
    throw redirect({ to: "/workspace/candidate" });
  },
});
