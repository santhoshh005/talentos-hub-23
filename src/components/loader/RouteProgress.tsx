import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import { NeuralOrbit } from "./NeuralOrbit";

export function RouteProgress() {
  const status = useRouterState({ select: (s) => s.status });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status === "pending") {
      // Only show if pending lasts >120ms — avoids flicker on fast nav.
      const t = setTimeout(() => setVisible(true), 120);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [status]);

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="strip"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "0% 50%" }}
            className="fixed inset-x-0 top-0 z-[90] h-[2px] bg-gradient-to-r from-primary via-accent to-primary shadow-[0_0_20px_2px] shadow-primary/50"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="chip"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="fixed right-4 top-4 z-[90]"
          >
            <NeuralOrbit size="sm" variant="chip" context="route" showMessages />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}