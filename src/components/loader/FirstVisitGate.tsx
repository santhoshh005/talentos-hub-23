import { useEffect, useState, type ReactNode } from "react";
import { TalentOSLoader } from "./TalentOSLoader";

const KEY = "talentos.visited";

export function FirstVisitGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      setReady(true);
      return;
    }
    const visited = window.localStorage.getItem(KEY);
    if (visited) {
      setReady(true);
      return;
    }
    setShowLoader(true);
    const t = setTimeout(() => {
      window.localStorage.setItem(KEY, "1");
      setShowLoader(false);
      setReady(true);
    }, 3600);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <TalentOSLoader show={showLoader} autoDurationMs={3400} />
      <div style={{ visibility: ready ? "visible" : "hidden" }}>{children}</div>
    </>
  );
}