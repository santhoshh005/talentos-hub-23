import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const MESSAGES = [
  "🔍 Searching Top Talent...",
  "📄 Reading Resume...",
  "🤖 AI is Screening Candidates...",
  "🧠 Matching Skills...",
  "💼 Preparing Recruitment Dashboard...",
  "📊 Analyzing Hiring Trends...",
  "🚀 Launching TalentOS...",
  "🎯 Finding the Perfect Candidate...",
  "💬 Generating Interview Questions...",
  "📈 Calculating Match Score...",
  "✨ Optimizing Recruiter Experience...",
];

export function LoadingMessageRotator() {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const id = setInterval(() => {
      setI((prev) => {
        let next = Math.floor(Math.random() * MESSAGES.length);
        if (next === prev) next = (next + 1) % MESSAGES.length;
        return next;
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-7 w-full text-center text-sm md:text-base text-white/80">
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {MESSAGES[i]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}