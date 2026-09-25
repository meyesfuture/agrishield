import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ThoughtLineProps {
  working: boolean;
  steps: string[];
  label?: string;
  doneLabel?: string;
  onSettle?: () => void;
}

export default function ThoughtLine({
  working,
  steps,
  label = "Processing...",
  doneLabel = "Completed",
  onSettle
}: ThoughtLineProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!working) return;
    
    // Simulate steps progressing
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [working, steps.length]);

  useEffect(() => {
    if (!working && onSettle) {
      onSettle();
    }
  }, [working, onSettle]);

  return (
    <div className="flex flex-col gap-2 p-4 bg-[#111111] rounded border border-[#27272A] font-mono text-sm max-w-sm">
      <div className="text-secondary mb-2 flex items-center gap-2 tracking-wider uppercase text-[10px]">
        {working ? (
          <>
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="w-2 h-2 rounded-full bg-[#2457FF] drop-shadow-[0_0_4px_rgba(36,87,255,0.8)]"
            />
            {label}
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-green-500" />
            {doneLabel}
          </>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {working && steps.map((step, index) => {
          if (index > currentStepIndex) return null;
          
          const isActive = index === currentStepIndex;
          
          return (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: isActive ? 1 : 0.5, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center gap-2 ${isActive ? 'text-white' : 'text-gray-500'}`}
            >
              <span className="opacity-50">{'>'}</span>
              {step}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
