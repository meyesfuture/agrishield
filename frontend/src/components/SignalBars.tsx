import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface SignalBarsProps {
  signals: any[];
}

export default function SignalBars({ signals }: SignalBarsProps) {
  if (!signals || signals.length === 0) return null;

  return (
    <div className="space-y-4">
      {signals.map((sig, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-mono text-[#A1A1AA] uppercase tracking-wider">{sig.signal_type}</span>
            <span className="font-mono font-bold text-white">Score: {Math.round(sig.normalized_score)}</span>
          </div>
          <div className="h-1.5 w-full bg-[#1A1A1A] rounded-full overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${sig.normalized_score}%` }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 * i }}
              className={`absolute left-0 top-0 bottom-0 rounded-full ${sig.normalized_score > 70 ? 'bg-red-500' : sig.normalized_score > 40 ? 'bg-orange-500' : 'bg-[#2457FF]'}`}
            />
          </div>
          {/* Missing data warning */}
          {!sig.sufficient_data && (
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-amber-500/70 uppercase">
              <AlertCircle className="w-3 h-3" />
              Insufficient Data (Ignored)
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
