import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { TalentOSLoader } from "./TalentOSLoader";

interface LoaderContextValue {
  show: (progress?: number) => void;
  hide: () => void;
  setProgress: (p: number) => void;
}

const LoaderContext = createContext<LoaderContextValue | null>(null);

export function useLoader() {
  const ctx = useContext(LoaderContext);
  if (!ctx) throw new Error("useLoader must be used within LoaderProvider");
  return ctx;
}

export function LoaderProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgressState] = useState<number | undefined>(undefined);

  const value = useMemo<LoaderContextValue>(
    () => ({
      show: (p) => {
        setProgressState(p);
        setVisible(true);
      },
      hide: () => setVisible(false),
      setProgress: (p) => setProgressState(p),
    }),
    [],
  );

  const hideCb = useCallback(() => setVisible(false), []);

  return (
    <LoaderContext.Provider value={value}>
      {children}
      <TalentOSLoader show={visible} progress={progress} onDone={hideCb} />
    </LoaderContext.Provider>
  );
}