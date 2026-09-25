import { motion, useSpring, useTransform, useMotionValueEvent } from 'framer-motion';
import { useEffect, useState } from 'react';

interface CometDialProps {
  value: number;
  label?: string;
  size?: number;
  thickness?: number;
  accent?: string;
  trackColor?: string;
}

export default function CometDial({
  value,
  label,
  size = 120,
  thickness = 4,
  accent = '#2457FF',
  trackColor = '#27272A' // Darker track for contrast
}: CometDialProps) {
  const radius = (size - thickness) / 2;
  const circumference = radius * 2 * Math.PI;

  const springValue = useSpring(0, {
    stiffness: 150,
    damping: 20,
    mass: 1,
    bounce: 0.2
  });

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  const strokeDashoffset = useTransform(
    springValue,
    [0, 100],
    [circumference, 0]
  );

  const [displayValue, setDisplayValue] = useState(0);

  useMotionValueEvent(springValue, "change", (latest) => {
    setDisplayValue(Math.round(latest));
  });

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={thickness}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={accent}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
          style={{ strokeDasharray: circumference, strokeDashoffset }}
          className="drop-shadow-[0_0_8px_rgba(36,87,255,0.6)]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-mono font-bold text-primary dark:text-white">
          {displayValue}
        </span>
        {label && (
          <span className="text-[10px] uppercase tracking-wider text-secondary mt-1 px-2 leading-tight">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
