import { z } from "zod";
import { fallback } from "@tanstack/zod-adapter";

export const ALL_TECHS = ["React", "Node.js", "Python", "Go", "AWS/Cloud", "Data/ML"] as const;
export const ALL_SOURCES = ["LinkedIn", "Referrals", "Boolean Search", "Inbound"] as const;
export const RANGE_KEYS = [3, 6, 8] as const;

export type Tech = (typeof ALL_TECHS)[number];
export type Source = (typeof ALL_SOURCES)[number];
export type RangeKey = (typeof RANGE_KEYS)[number];

export const dashboardSearchSchema = z.object({
  range: fallback(z.number(), 8).default(8),
  techs: fallback(z.string().array(), [...ALL_TECHS]).default([...ALL_TECHS]),
  sources: fallback(z.string().array(), [...ALL_SOURCES]).default([...ALL_SOURCES]),
});

export type DashboardSearch = z.infer<typeof dashboardSearchSchema>;

export function normalizeDashboardSearch(s: Partial<DashboardSearch> | undefined) {
  const range = (RANGE_KEYS as readonly number[]).includes(s?.range ?? 8)
    ? (s!.range as RangeKey)
    : 8;
  const techs = (s?.techs ?? [...ALL_TECHS]).filter((t): t is Tech =>
    (ALL_TECHS as readonly string[]).includes(t),
  );
  const sources = (s?.sources ?? [...ALL_SOURCES]).filter((x): x is Source =>
    (ALL_SOURCES as readonly string[]).includes(x),
  );
  return {
    range,
    techs: techs.length ? techs : [...ALL_TECHS],
    sources: sources.length ? sources : [...ALL_SOURCES],
  };
}
