import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Runs `load` immediately and then every `intervalMs`, pausing while the tab
 * is hidden. Exposes loading / error state and a manual refresh. Pass a
 * `key` that changes whenever the query inputs change.
 */
export function usePolling<T>(load: () => Promise<T>, intervalMs: number, key: string = "") {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadRef = useRef(load);
  loadRef.current = load;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await loadRef.current();
      setData(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const isVisible = () =>
      typeof document === "undefined" || document.visibilityState === "visible";
    const id = setInterval(() => {
      if (isVisible()) void refresh();
    }, intervalMs);
    const onVisible = () => {
      if (isVisible()) void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh, intervalMs, key]);

  return { data, error, loading, refresh };
}
