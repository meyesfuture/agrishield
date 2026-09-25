import { useEffect, useState, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import CometDial from '../components/animations/CometDial';
import ThoughtLine from '../components/animations/ThoughtLine';
import ScrollReveal from '../components/animations/ScrollReveal';

import PageTransition from '../components/animations/PageTransition';
import CropModel from '../canvas/CropModel';

function EvidenceCard({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <ScrollReveal delay={delay}>
      <motion.div
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="bg-[#0a0a0a] border border-[#27272A] rounded p-6 flex flex-col gap-2 group relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#2457FF] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#2457FF]/0 group-hover:from-[#2457FF]/5 to-transparent transition-all duration-500" />
        <div className="text-[10px] text-[#71717A] font-bold tracking-widest uppercase mb-1">{title}</div>
        {children}
      </motion.div>
    </ScrollReveal>
  );
}

function AnimatedBar({ score, label, delay = 0 }: { score: number | null; label: string; delay?: number }) {
  if (score === null) {
    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-[#71717A] font-mono text-xs">{label}</span>
          <span className="text-[#71717A] font-mono text-xs">N/A</span>
        </div>
        <div className="h-px bg-[#27272A] w-full" />
      </div>
    );
  }
  return (
    <div className="mb-5 group">
      <div className="flex justify-between mb-1.5">
        <span className="text-[#A1A1AA] font-mono text-xs group-hover:text-white transition-colors">{label}</span>
        <span className="text-[#A1A1AA] font-mono text-xs group-hover:text-[#2457FF] transition-colors">{Math.round(score)}%</span>
      </div>
      <div className="h-px bg-[#27272A] w-full overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${score}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
          className="h-full bg-gradient-to-r from-[#2457FF] to-[#2457FF]/60 absolute top-0 left-0"
        />
        {/* Glow pulse */}
        <motion.div
          initial={{ width: 0, opacity: 0.8 }}
          whileInView={{ width: `${score}%`, opacity: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, delay, ease: [0.16, 1, 0.3, 1] }}
          className="h-full bg-[#2457FF] absolute top-0 left-0 blur-sm"
        />
      </div>
    </div>
  );
}

export default function AlertDetail() {
  const { id } = useParams<{ id: string }>();
  const [alert, setAlert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showData, setShowData] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:8000/api/alerts/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setAlert(data);
        setTimeout(() => setLoading(false), 400);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const signals = alert?.signals || [];
  const history = alert?.history || [];
  const timeline = alert?.timeline || [];

  const handleExport = () => {
    if (!alert) return;
    const content = `AgriShield Investigation Report
=============================
Alert ID: ${alert.id}
Generated: ${new Date().toLocaleString()}

LOCATION: ${alert.location_name}
COMMODITY: ${alert.commodity_name}
SEVERITY: ${alert.severity.toUpperCase()}
RISK SCORE: ${alert.risk_score?.toFixed(1) || 'N/A'}/100

EXPLANATION:
${alert.explanation}

RECOMMENDED ACTION:
${alert.recommended_action || 'None'}

SIGNALS ANALYZED:
${signals.map((s: any) => `- ${s.signal_type.toUpperCase()}: Score ${Math.round(s.normalized_score || 0)} (Weight: ${s.weight})`).join('\n')}
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AgriShield_Report_${alert.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  if (loading || !showData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-sm mx-auto">
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
    return <div className="text-white text-xl">Alert not found</div>;
  }

  const getSignal = (type: string) => signals.find((s: any) => s.signal_type === type);
  const priceSig = getSignal('price');
  const arrivalSig = getSignal('arrival');
  const satSig = getSignal('satellite');
  const newsSig = getSignal('news');
  const consistencySig = getSignal('consistency');

  const isCritical = alert.severity === 'critical';

  return (
    <PageTransition>
      <div className="space-y-14">
        {/* Back */}
        <ScrollReveal>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[#71717A] hover:text-white text-sm transition-colors mb-2 print:hidden"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Overview
          </Link>
        </ScrollReveal>

        {/* HERO: Header + 3D Model */}
        <section className="relative flex flex-col lg:flex-row items-start gap-10">
          {/* Left: meta */}
          <div className="flex-1 space-y-4">
            <ScrollReveal>
              <div
                className={`inline-flex items-center gap-2 px-2.5 py-1 rounded border text-[9px] font-bold uppercase tracking-widest font-mono ${
                  isCritical
                    ? 'bg-red-900/20 text-red-400 border-red-900/50'
                    : 'bg-orange-900/20 text-orange-400 border-orange-900/50'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    isCritical ? 'bg-red-400' : 'bg-orange-400'
                  }`}
                />
                {alert.severity} — Investigation Signal
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                {alert.commodity_name}
                <span className="text-[#71717A] font-light"> — </span>
                <span className="text-[#A1A1AA] text-3xl">{alert.location_name}</span>
              </h1>
            </ScrollReveal>

            {alert.partial_signals && (
              <ScrollReveal delay={0.15}>
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-900/10 border border-amber-900/40 rounded text-amber-400 text-xs font-mono">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Partial signals — Missing: {alert.missing_signal_types}
                </div>
              </ScrollReveal>
            )}

            <ScrollReveal delay={0.2}>
              <div className="flex items-center gap-8 pt-2">
                <CometDial value={alert.risk_score || 0} label="Anomaly Score" size={130} thickness={5} />
                <div className="flex flex-col gap-1">
                  <button
                    onClick={handleExport}
                    className="bg-white text-black px-4 py-2 text-xs font-bold rounded hover:bg-gray-200 transition-colors print:hidden"
                  >
                    Export Report
                  </button>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right: 3D Crop Model */}
          <ScrollReveal direction="left" className="w-full lg:w-80 h-72 flex-shrink-0">
            <div className="w-full h-full relative rounded border border-[#27272A] overflow-hidden bg-[#050508]">
              <Canvas camera={{ position: [0, 0, 3.5], fov: 55 }} gl={{ antialias: true, alpha: true }}>
                <Suspense fallback={null}>
                  <ambientLight intensity={0.4} />
                  <pointLight
                    position={[3, 3, 3]}
                    intensity={1.5}
                    color={isCritical ? '#ef4444' : '#2457FF'}
                  />
                  <pointLight position={[-3, -3, -3]} intensity={0.5} color="#ffffff" />
                  <CropModel commodity={alert.commodity_name} riskScore={alert.risk_score || 0} />
                </Suspense>
              </Canvas>
              <div className="absolute bottom-3 left-3 text-[9px] font-mono text-[#71717A] uppercase tracking-wider">
                {alert.commodity_name} — 3D Model
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* Evidence Cards */}
        <section>
          <ScrollReveal>
            <div className="text-[10px] font-mono text-[#71717A] uppercase tracking-widest mb-4">Evidence Breakdown</div>
          </ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <EvidenceCard title="Price Anomaly" delay={0}>
              {priceSig?.sufficient_data && priceSig.deviation !== null ? (
                <div className="text-3xl font-mono text-white font-bold">
                  {priceSig.deviation > 0 ? '+' : ''}{priceSig.deviation}%
                </div>
              ) : (
                <div className="text-[#71717A] italic text-sm">No data</div>
              )}
            </EvidenceCard>
            <EvidenceCard title="Arrivals Anomaly" delay={0.08}>
              {arrivalSig?.sufficient_data && arrivalSig.deviation !== null ? (
                <div className="text-3xl font-mono text-white font-bold">
                  {arrivalSig.deviation > 0 ? '+' : ''}{arrivalSig.deviation}%
                </div>
              ) : (
                <div className="text-[#71717A] italic text-sm">No data</div>
              )}
            </EvidenceCard>
            <EvidenceCard title="Crop Signal" delay={0.16}>
              {satSig?.sufficient_data && satSig.deviation !== null ? (
                <div className="text-3xl font-mono text-white font-bold">
                  {satSig.deviation < -10 ? 'POOR' : 'NORMAL'}
                </div>
              ) : (
                <div className="text-[#71717A] italic text-sm">No data</div>
              )}
            </EvidenceCard>
            <EvidenceCard title="News Signal" delay={0.24}>
              {newsSig?.sufficient_data && newsSig.normalized_score !== null ? (
                <div className="text-3xl font-mono text-white font-bold">
                  {newsSig.normalized_score > 50 ? 'HIGH' : 'LOW'}
                </div>
              ) : (
                <div className="text-[#71717A] italic text-sm">No data</div>
              )}
            </EvidenceCard>
          </div>
        </section>

        {/* Score Breakdown */}
        <ScrollReveal>
          <section>
            <div className="text-[10px] font-mono text-[#71717A] uppercase tracking-widest mb-4">Score Component Breakdown</div>
            <div className="bg-[#050508] border border-[#27272A] rounded p-8 max-w-2xl font-mono">
              <AnimatedBar score={priceSig?.normalized_score ?? null} label="Price Anomaly" delay={0.1} />
              <AnimatedBar score={arrivalSig?.normalized_score ?? null} label="Arrival Anomaly" delay={0.2} />
              <AnimatedBar score={satSig?.normalized_score ?? null} label="Crop Signal" delay={0.3} />
              <AnimatedBar score={newsSig?.normalized_score ?? null} label="News Signal" delay={0.4} />
              <div className="mt-6 pt-6 border-t border-[#27272A]">
                <AnimatedBar score={consistencySig?.normalized_score ?? null} label="Cross-Signal Consistency" delay={0.5} />
                <p className="text-[10px] text-[#71717A] mt-3 max-w-xl leading-relaxed font-sans">
                  How closely the available signals agree. This is a derived metric representing consensus — not a measure of certainty.
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ScrollReveal direction="left">
            <section>
              <div className="text-[10px] font-mono text-[#71717A] uppercase tracking-widest mb-3">Price History (INR / Quintal)</div>
              <div className="bg-[#050508] border border-[#27272A] rounded p-6 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" />
                    <XAxis dataKey="date" stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false} domain={['dataMin - 100', 'dataMax + 100']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a0a0a', color: '#fff', border: '1px solid #27272A', borderRadius: '4px', fontSize: '12px' }}
                      itemStyle={{ color: '#2457FF' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#2457FF"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#050508', stroke: '#2457FF', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#2457FF', strokeWidth: 0 }}
                      isAnimationActive
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-[#71717A] mt-2 text-right font-mono">Source: OGD Platform India</p>
            </section>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <section>
              <div className="text-[10px] font-mono text-[#71717A] uppercase tracking-widest mb-3">Arrivals (Quintals)</div>
              <div className="bg-[#050508] border border-[#27272A] rounded p-6 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" />
                    <XAxis dataKey="date" stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a0a0a', color: '#fff', border: '1px solid #27272A', borderRadius: '4px', fontSize: '12px' }}
                      cursor={{ fill: '#1A1A1A' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar
                      dataKey="arrival"
                      fill="#27272A"
                      radius={[2, 2, 0, 0]}
                      isAnimationActive
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-[#71717A] mt-2 text-right font-mono">Source: OGD Platform India</p>
            </section>
          </ScrollReveal>
        </div>

        {/* Timeline + Recommended Action */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ScrollReveal direction="left">
            <section>
              <div className="text-[10px] font-mono text-[#71717A] uppercase tracking-widest mb-4">Evidence Timeline</div>
              <div className="bg-[#050508] border border-[#27272A] rounded p-6">
                <div className="space-y-0">
                  {timeline.map((item: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.12, ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
                      className="flex gap-4 relative pb-6 last:pb-0"
                    >
                      {/* Vertical line */}
                      {i < timeline.length - 1 && (
                        <div className="absolute left-[2.15rem] top-5 bottom-0 w-px bg-[#27272A]" />
                      )}
                      {/* Dot */}
                      <div className="w-5 h-5 mt-0.5 rounded-full bg-[#1A1A1A] border border-[#27272A] flex items-center justify-center flex-shrink-0 ml-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#2457FF]" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] font-mono text-[#71717A] mb-0.5">{item.date}</div>
                        <p className="text-[#A1A1AA] text-sm">{item.event}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <section>
              <div className="text-[10px] font-mono text-[#71717A] uppercase tracking-widest mb-4">Recommended Action</div>
              <div className="bg-[#050508] border border-[#27272A] rounded p-8 h-full flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2457FF]/0 group-hover:from-[#2457FF]/5 to-transparent transition-all duration-700" />
                <p className="text-lg leading-relaxed text-white relative z-10 font-medium">
                  {alert.recommended_action}
                </p>
                <p className="text-xs text-[#71717A] mt-6 border-t border-[#27272A] pt-4 relative z-10 font-mono">
                  This system flags unusual multi-signal patterns. It does not replace regulatory investigation.
                </p>
              </div>
            </section>
          </ScrollReveal>
        </div>
      </div>
    </PageTransition>
  );
}
