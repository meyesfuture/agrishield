import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

interface GlideSelectProps {
  options: { value: string; label: string; tag?: string }[];
  value: string;
  onChange: (val: string) => void;
  ariaLabel?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function GlideSelect({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md'
}: GlideSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#1A1A1A] border border-[#27272A] rounded px-4 py-2 text-sm text-white hover:bg-[#27272A] transition-colors"
      >
        <span className="font-medium">{selectedOption.label}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute z-50 top-full left-0 mt-2 min-w-[200px] p-1 bg-[#1A1A1A] border border-[#27272A] rounded shadow-xl"
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              const isHovered = option.value === hoveredValue;

              return (
                <div
                  key={option.value}
                  className="relative px-3 py-2 cursor-pointer rounded"
                  onMouseEnter={() => setHoveredValue(option.value)}
                  onMouseLeave={() => setHoveredValue(null)}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  {isHovered && (
                    <motion.div
                      layoutId="glide-highlight"
                      className="absolute inset-0 bg-[#27272A] rounded z-0"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <div className="relative z-10 flex items-center justify-between pointer-events-none">
                    <span className={`text-sm ${isSelected ? 'text-[#2457FF] font-bold' : 'text-gray-300'}`}>
                      {option.label}
                    </span>
                    {option.tag && (
                      <span className="text-[10px] uppercase tracking-wider text-gray-500 bg-[#111111] px-1.5 py-0.5 rounded border border-[#27272A]">
                        {option.tag}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
