// ---------------------------------------------------------------------------
// Usage stats aggregation — pure, shared by the server and tests.
// ---------------------------------------------------------------------------

export interface MyStats {
  analyses: number;
  jds: number;
  reports: number;
  averageScore: number;
  scoredCount: number;
  scoreBuckets: { strong: number; good: number; review: number; low: number };
  techs: Record<string, number>;
  recent: Array<{
    id: string;
    type: "analysis" | "jd" | "report";
    label: string;
    score?: number;
    timestamp: number;
  }>;
}

export interface UsageEventRow {
  id: string;
  event_type: string;
  created_at: string;
  metadata: unknown;
}

/** Rows must be ordered newest first; `recent` keeps the first 20. */
export function aggregateUserStats(rows: UsageEventRow[]): MyStats {
  const stats: MyStats = {
    analyses: 0,
    jds: 0,
    reports: 0,
    averageScore: 0,
    scoredCount: 0,
    scoreBuckets: { strong: 0, good: 0, review: 0, low: 0 },
    techs: {},
    recent: [],
  };
  let scoreSum = 0;
  const pushRecent = (entry: MyStats["recent"][number]) => {
    if (stats.recent.length < 20) stats.recent.push(entry);
  };

  for (const row of rows) {
    const meta = (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<
      string,
      unknown
    >;
    const timestamp = Date.parse(row.created_at) || Date.now();
    const title = typeof meta.title === "string" ? meta.title : "";
    if (row.event_type === "analysis") {
      stats.analyses += 1;
      const score =
        typeof meta.score === "number" && Number.isFinite(meta.score) ? meta.score : undefined;
      if (score !== undefined) {
        scoreSum += score;
        stats.scoredCount += 1;
        const band = score >= 80 ? "strong" : score >= 65 ? "good" : score >= 45 ? "review" : "low";
        stats.scoreBuckets[band] += 1;
      }
      if (Array.isArray(meta.techs)) {
        for (const t of meta.techs) {
          if (typeof t === "string" && t) stats.techs[t] = (stats.techs[t] ?? 0) + 1;
        }
      }
      pushRecent({
        id: row.id,
        type: "analysis",
        label: title ? `Resume analyzed for ${title}` : "Resume analyzed",
        score,
        timestamp,
      });
    } else if (row.event_type === "jd_generation") {
      stats.jds += 1;
      pushRecent({
        id: row.id,
        type: "jd",
        label: title ? `JD generated: ${title}` : "JD generated",
        timestamp,
      });
    } else if (row.event_type === "report_download") {
      stats.reports += 1;
      pushRecent({ id: row.id, type: "report", label: "Report downloaded", timestamp });
    }
  }
  stats.averageScore = stats.scoredCount ? Math.round(scoreSum / stats.scoredCount) : 0;
  return stats;
}
