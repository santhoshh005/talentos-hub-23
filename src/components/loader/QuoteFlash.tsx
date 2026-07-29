import { useMemo } from "react";
import { motion } from "framer-motion";

const QUOTES = [
  "Every great company starts with one great hire.",
  "Behind every successful team is an exceptional recruiter.",
  "AI assists. Recruiters decide.",
  "The future of hiring starts here.",
];

export function QuoteFlash() {
  const quote = useMemo(() => {
    if (Math.random() > 0.05) return null;
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }, []);
  if (!quote) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.8 }}
      className="mt-6 max-w-md text-center text-xs italic text-white/50"
    >
      "{quote}"
    </motion.p>
  );
}
