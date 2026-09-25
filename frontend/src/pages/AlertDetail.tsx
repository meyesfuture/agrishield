import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';
import CometDial from '../components/animations/CometDial';
import ThoughtLine from '../components/animations/ThoughtLine';

export default function AlertDetail() {
  const { id } = useParams<{ id: string }>();
  const [alert, setAlert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showData, setShowData] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:8000/api/alerts/${id}`)
      .then(res => res.json())
      .then(data => {
        setAlert(data);
        // Start thought line before showing data for aesthetic purposes
        setTimeout(() => setLoading(false), 500); 
      })
      .catch(err => {
        console.error("Error fetching alert", err);
        setLoading(false);
      });
  }, [id]);

  const signals = alert?.signals || [];
  const history = alert?.history || [];
  const timeline = alert?.timeline || [];

  if (loading || !showData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] max-w-sm mx-auto">
        <ThoughtLine 
          working={loading} 
          steps={['Fetching live data...', 'Evaluating market models...', 'Generating evidence report...']} 
          label="Thinking..."
          doneLabel="Report Ready"
          onSettle={() => setShowData(true)}
        />
      </div>
    );
  }

  if (!alert || alert.error) {
    return <div className="text-primary text-xl">Alert not found</div>;
  }

  const getSignal = (type: string) => signals.find((s: any) => s.signal_type === type);

  const priceSig = getSignal('price');
  const arrivalSig = getSignal('arrival');
  const satSig = getSignal('satellite');
  const newsSig = getSignal('news');
  const consistencySig = getSignal('consistency');

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } }
  };

  const renderHorizontalBar = (score: number | null, label: string) => {
    if (score === null) return (
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-secondary">{label}</span>
          <span className="text-secondary font-mono">N/A</span>
        </div>
        <div className="h-1 bg-[#27272A] w-full" />
      </div>
    );
    return (
      <div className="mb-4 group">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-primary dark:text-gray-300 font-medium group-hover:text-[#2457FF] transition-colors">{label}</span>
          <span className="text-primary dark:text-gray-300 font-mono group-hover:text-[#2457FF] transition-colors">{Math.round(score)}%</span>
        </div>
        <div className="h-1 bg-[#27272A] w-full flex overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-[#2457FF]" 
          />
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-12"
    >
      <motion.div variants={itemVariants}>
        <Link to="/" className="inline-flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors print:hidden">
          <ArrowLeft className="w-4 h-4" />
          Back to Overview
        </Link>

        <header className="border-b border-border pb-6 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">
              {alert.commodity_name} — {alert.location_name}
            </h1>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 text-sm font-bold uppercase tracking-wider ${alert.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800'}`}>
                {alert.severity} — INVESTIGATION SIGNAL
              </span>
              {alert.partial_signals && (
                <span className="flex items-center gap-1 px-3 py-1 text-sm font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded-sm border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="w-4 h-4" />
                  Missing: {alert.missing_signal_types}
                </span>
              )}
            </div>
          </div>
          <div className="text-right flex items-center gap-6">
            <div className="flex flex-col justify-end mb-2 print:hidden">
              <button 
                onClick={() => window.print()} 
                className="bg-primary text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-medium rounded hover:bg-black/90 transition-colors"
              >
                Export Report
              </button>
            </div>
            <CometDial value={alert.risk_score || 0} label="Anomaly Score" size={120} thickness={4} />
          </div>
        </header>
      </motion.div>

      <motion.section variants={itemVariants}>
        <h2 className="h3 mb-4">Evidence Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-6 border-t-4 border-t-[#2457FF] bg-white dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#27272A] shadow-sm">
            <div className="text-xs text-secondary font-bold tracking-wider mb-2 uppercase">Price Anomaly</div>
            {priceSig?.sufficient_data && priceSig.deviation !== null ? (
              <div className="text-3xl font-mono text-primary dark:text-white font-bold">
                {priceSig.deviation > 0 ? '+' : ''}{priceSig.deviation}%
              </div>
            ) : (
              <div className="text-secondary italic text-sm">No data / Insufficient history</div>
            )}
          </div>

          <div className="card p-6 border-t-4 border-t-[#2457FF] bg-white dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#27272A] shadow-sm">
            <div className="text-xs text-secondary font-bold tracking-wider mb-2 uppercase">Arrivals Anomaly</div>
            {arrivalSig?.sufficient_data && arrivalSig.deviation !== null ? (
              <div className="text-3xl font-mono text-primary dark:text-white font-bold">
                {arrivalSig.deviation > 0 ? '+' : ''}{arrivalSig.deviation}%
              </div>
            ) : (
              <div className="text-secondary italic text-sm">No data</div>
            )}
          </div>

          <div className="card p-6 border-t-4 border-t-[#2457FF] bg-white dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#27272A] shadow-sm">
            <div className="text-xs text-secondary font-bold tracking-wider mb-2 uppercase">Crop Signal</div>
            {satSig?.sufficient_data && satSig.deviation !== null ? (
              <div className="text-3xl font-mono text-primary dark:text-white font-bold">
                {satSig.deviation < -10 ? 'POOR' : 'NORMAL'}
              </div>
            ) : (
              <div className="text-secondary italic text-sm">No data</div>
            )}
          </div>

          <div className="card p-6 border-t-4 border-t-[#2457FF] bg-white dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#27272A] shadow-sm">
            <div className="text-xs text-secondary font-bold tracking-wider mb-2 uppercase">News Signal</div>
            {newsSig?.sufficient_data && newsSig.normalized_score !== null ? (
              <div className="text-3xl font-mono text-primary dark:text-white font-bold">
                {newsSig.normalized_score > 50 ? 'HIGH' : 'LOW'}
              </div>
            ) : (
              <div className="text-secondary italic text-sm">No data</div>
            )}
          </div>
        </div>
      </motion.section>

      <motion.section variants={itemVariants}>
        <h2 className="h3 mb-4">Score Component Breakdown</h2>
        <div className="card p-6 bg-white dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#27272A] shadow-sm max-w-2xl font-mono">
          {renderHorizontalBar(priceSig?.normalized_score ?? null, "Price Anomaly")}
          {renderHorizontalBar(arrivalSig?.normalized_score ?? null, "Arrival Anomaly")}
          {renderHorizontalBar(satSig?.normalized_score ?? null, "Crop Signal")}
          {renderHorizontalBar(newsSig?.normalized_score ?? null, "News Signal")}
          <div className="mt-8 pt-4 border-t border-[#27272A]">
            {renderHorizontalBar(consistencySig?.normalized_score ?? null, "Cross-Signal Consistency")}
            <p className="text-xs text-secondary mt-2 max-w-xl leading-relaxed font-sans">
              How closely the available signals agree. This is a derived metric representing consensus 
              among available signals — not a measure of certainty.
            </p>
          </div>
        </div>
      </motion.section>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <h2 className="h3 mb-4">Price History (INR / Quintal)</h2>
          <div className="card p-6 h-80 bg-white dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#27272A] shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272A" />
                <XAxis dataKey="date" stroke="#6B6B6B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6B6B6B" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 100', 'dataMax + 100']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', color: '#fff', border: '1px solid #27272A', borderRadius: '4px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="price" stroke="#2457FF" strokeWidth={2} dot={{ r: 3, fill: '#111111', stroke: '#2457FF', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-secondary mt-2 text-right">Source: OGD Platform India</p>
        </section>

        <section>
          <h2 className="h3 mb-4">Arrivals (Quintals)</h2>
          <div className="card p-6 h-80 bg-white dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#27272A] shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272A" />
                <XAxis dataKey="date" stroke="#6B6B6B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6B6B6B" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', color: '#fff', border: '1px solid #27272A', borderRadius: '4px' }}
                  cursor={{ fill: '#27272A' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="arrival" fill="#FFFFFF" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-secondary mt-2 text-right">Source: OGD Platform India</p>
        </section>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <h2 className="h3 mb-4">Evidence Timeline</h2>
          <div className="card p-6 h-full bg-white dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#27272A] shadow-sm">
            <div className="space-y-6">
              {timeline.map((item: any, i: number) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="w-16 flex-shrink-0 text-sm font-mono text-secondary pt-1">
                    {item.date}
                  </div>
                  <div className="flex-1 pb-6 border-b border-[#27272A] last:border-0 last:pb-0">
                    <p className="text-primary dark:text-gray-200 font-medium">{item.event}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="h3 mb-4">Recommended Action</h2>
          <div className="bg-[#1A1A1A] p-8 rounded border border-[#27272A] h-full flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#2457FF]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <p className="text-xl leading-relaxed text-white relative z-10 font-medium">
              {alert.recommended_action}
            </p>
            <p className="text-sm text-gray-500 mt-6 border-t border-[#3f3f46] pt-4 relative z-10">
              This system flags unusual multi-signal patterns. It does not replace regulatory investigation.
            </p>
          </div>
        </section>
      </motion.div>
    </motion.div>
  );
}
