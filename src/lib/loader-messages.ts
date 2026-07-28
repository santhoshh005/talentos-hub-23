import {
  FileText,
  Users,
  LayoutTemplate,
  FileSpreadsheet,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type LoaderContext =
  | "resume-extract"
  | "bulk-extract"
  | "templates"
  | "export"
  | "route"
  | "first-visit"
  | "generic";

export interface LoaderContextConfig {
  messages: string[];
  icon: LucideIcon;
}

export const LOADER_CONTEXTS: Record<LoaderContext, LoaderContextConfig> = {
  "resume-extract": {
    icon: FileText,
    messages: [
      "Reading resume…",
      "Extracting candidate profile…",
      "Finding skills…",
      "Organizing candidate data…",
      "Almost ready…",
    ],
  },
  "bulk-extract": {
    icon: Users,
    messages: [
      "Reading resumes…",
      "Extracting profiles in parallel…",
      "Normalizing skills…",
      "Assembling batch…",
      "Almost ready…",
    ],
  },
  templates: {
    icon: LayoutTemplate,
    messages: ["Loading client templates…", "Restoring your mappings…"],
  },
  export: {
    icon: FileSpreadsheet,
    messages: [
      "Preparing spreadsheet…",
      "Applying template styling…",
      "Generating Excel…",
      "Almost ready…",
    ],
  },
  route: {
    icon: Sparkles,
    messages: ["Loading…"],
  },
  "first-visit": {
    icon: Sparkles,
    messages: [
      "Booting TalentOS…",
      "Warming the recruiter workspace…",
      "Calibrating the intelligence engine…",
      "Almost ready…",
    ],
  },
  generic: {
    icon: Sparkles,
    messages: ["Working…"],
  },
};