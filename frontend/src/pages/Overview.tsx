import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, MapPin, Package, ShieldAlert, ArrowRight, TrendingUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Map from '../components/Map';
import GlideSelect from '../components/animations/GlideSelect';
import ScrollReveal from '../components/animations/ScrollReveal';
import { StaggerList, StaggerItem } from '../components/animations/StaggerList';
import PageTransition from '../components/animations/PageTransition';
import AnimatedCounter from '../components/animations/AnimatedCounter';
import { Canvas } from '@react-three/fiber';
import Globe from '../canvas/Globe';
import { OrbitControls } from '@react-three/drei';
import SignalBars from '../components/SignalBars';

function KPICard({
  label,
  value,
  icon: Icon,
  accent = '#2457FF',
  decimals = 0,
  delay = 0,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
  decimals?: number;
  delay?: number;
}) {
  return (
    <ScrollReveal delay={delay}>
      <motion.div
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
        className="card p-6 flex flex-col gap-3 group relative overflow-hidden cursor-default"
      >
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded"
          style={{
            background: `radial-gradient(circle at 70% 20%, ${accent}18, transparent 60%)`,
          }}
        />
        <span className="text-[#71717A] text-[10px] tracking-widest uppercase font-bold">{label}</span>
        <div className="flex items-end justify-between">
          <AnimatedCounter
            value={value}
            decimals={decimals}
            className="text-5xl font-mono text-white font-bold leading-none"
          />
          <Icon className="w-5 h-5 transition-colors" />
        </div>
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 rounded"
          initial={{ width: 0 }}
          whileInView={{ width: '100%' }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: delay + 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ backgroundColor: accent, opacity: 0.3 }}
        />
      </motion.div>
    </ScrollReveal>
  );
}

export default function Overview() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>({
    monitored_locations: 0,
    active_alerts: 0,
    commodities: 0,
    highest_risk: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:8000/api/overview').then((r) => r.json()),
      fetch('http://localhost:8000/api/alerts').then((r) => r.json()),
    ])
      .then(([ov, al]) => {
        setOverview(ov);
        setAlerts(al);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filterOptions = useMemo(() => {
    const uniq = Array.from(new Set(alerts.map((a) => a.commodity_name)));
    const opts = [{ value: 'all', label: 'All Commodities', tag: alerts.length.toString() }];
    uniq.forEach((c) => {
      opts.push({ value: c, label: c, tag: alerts.filter((a) => a.commodity_name === c).length.toString() });
    });
    return opts;
  }, [alerts]);

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter((a) => a.commodity_name === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#2457FF] border-t-transparent rounded-full animate-spin shadow-[0_0_12px_rgba(36,87,255,0.6)]" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-20">
        {/* HERO: Globe + headline */}
        <section className="relative flex flex-col lg:flex-row items-center gap-8 min-h-[520px]">
          {/* Text */}
          <div className="flex-1 space-y-6 z-10">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-[#2457FF]/30 bg-[#2457FF]/5 text-[10px] font-mono text-[#2457FF] uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2457FF] animate-pulse" />
                Agricultural Intelligence System
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-white leading-none">
                Supply Anomaly
                <br />
                <span className="text-[#2457FF]">Intelligence</span>
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="text-[#71717A] max-w-lg font-mono text-xs uppercase tracking-wider leading-relaxed">
                Detect unusual market conditions before they become macro supply disruptions.
                Real-time multi-signal analysis across India's agricultural markets.
              </p>
            </ScrollReveal>
          </div>

          {/* 3D Globe */}
          <div className="flex-1 h-[420px] lg:h-[520px] w-full relative">
            <Canvas camera={{ position: [0, 0, 3.5], fov: 55 }} gl={{ antialias: true, alpha: true }}>
              <Suspense fallback={null}>
                <ambientLight intensity={0.5} />
                <pointLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
                <pointLight position={[-5, -5, -5]} intensity={0.5} color="#2457FF" />
                <Globe alerts={alerts} />
                <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
              </Suspense>
            </Canvas>
            <div className="absolute bottom-4 right-4 text-[10px] font-mono text-[#71717A] uppercase tracking-wider">
              {alerts.length} active signals plotted
            </div>
          </div>
        </section>

        {/* KPI row */}
        <section>
          <ScrollReveal>
            <div className="text-[10px] font-mono text-[#71717A] uppercase tracking-widest mb-4">System Overview</div>
          </ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard label="Active Alerts" value={overview.active_alerts} icon={ShieldAlert} delay={0} />
            <KPICard label="Markets Monitored" value={overview.monitored_locations} icon={MapPin} delay={0.08} />
            <KPICard label="Commodities" value={overview.commodities || 0} icon={Package} delay={0.16} />
            <KPICard label="Highest Risk" value={overview.highest_risk || 0} icon={AlertTriangle} accent="#ef4444" decimals={1} delay={0.24} />
          </div>
        </section>

        {/* Map */}
        <ScrollReveal>
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-[#71717A] uppercase tracking-widest mb-1">Geographic View</div>
                <h2 className="text-2xl font-bold text-white">National Overview Map</h2>
              </div>
            </div>
            <div className="h-[400px] w-full rounded border border-[#27272A] overflow-hidden relative">
              <Map alerts={filteredAlerts} />
            </div>
          </section>
        </ScrollReveal>

        {/* Intelligence Feed */}
        <section className="space-y-6">
          <ScrollReveal>
            <div className="flex items-center justify-between pb-4 border-b border-[#27272A]">
              <div>
                <div className="text-[10px] font-mono text-[#71717A] uppercase tracking-widest mb-1">Real-time</div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  Intelligence Feed
                  <span className="text-xs font-mono bg-[#1A1A1A] border border-[#27272A] text-[#71717A] px-2 py-0.5 rounded">
                    {filteredAlerts.length}
                  </span>
                </h2>
              </div>
              <GlideSelect
                options={filterOptions}
                value={filter}
                onChange={setFilter}
                ariaLabel="Filter Commodities"
              />
            </div>
          </ScrollReveal>

          <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAlerts.map((alert) => (
              <StaggerItem key={alert.id}>
                <motion.div
                  layoutId={`card-${alert.id}`}
                  whileHover={{
                    y: -4,
                    boxShadow: '0 16px 48px rgba(36,87,255,0.12)',
                    borderColor: '#2457FF',
                    transition: { duration: 0.2 },
                  }}
                  onClick={() => setSelectedAlert(alert)}
                  className="card p-6 flex flex-col justify-between group relative cursor-pointer h-full border border-[#27272A] rounded"
                >

                  {/* glow on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2457FF]/0 to-[#2457FF]/0 group-hover:from-[#2457FF]/5 group-hover:to-transparent transition-all duration-500 rounded" />

                  <div>
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#2457FF] transition-colors">
                          {alert.commodity_name}
                        </h3>
                        <p className="text-[#71717A] font-mono text-[10px] uppercase tracking-wider">
                          {alert.location_name}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded border ${
                          alert.severity === 'critical'
                            ? 'bg-red-900/20 text-red-400 border-red-900/50'
                            : 'bg-orange-900/20 text-orange-400 border-orange-900/50'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>

                    <p className="text-[#71717A] text-sm mb-5 line-clamp-3 leading-relaxed">
                      {alert.explanation}
                    </p>

                    {alert.partial_signals && (
                      <p className="text-[9px] font-mono text-amber-500 mb-4 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        INCOMPLETE DATA
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#27272A] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-[#71717A]" />
                      <span className="text-3xl font-mono text-white font-bold group-hover:text-[#2457FF] transition-colors">
                        {alert.risk_score != null ? alert.risk_score.toFixed(1) : 'N/A'}
                      </span>
                      <span className="text-[10px] text-[#71717A] font-mono">/100</span>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-[#1A1A1A] flex items-center justify-center border border-[#27272A] group-hover:bg-[#2457FF] group-hover:border-[#2457FF] transition-all">
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerList>
        </section>
      </div>

      <AnimatePresence>
        {selectedAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedAlert(null)}
          >
            <motion.div
              layoutId={`card-${selectedAlert.id}`}
              className="bg-[#0a0a0a] border border-[#27272A] w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-[#27272A] flex items-start justify-between relative bg-[#050508]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2457FF]/5 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold text-white">{selectedAlert.commodity_name}</h2>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded border ${
                      selectedAlert.severity === 'critical'
                        ? 'bg-red-900/20 text-red-400 border-red-900/50'
                        : 'bg-orange-900/20 text-orange-400 border-orange-900/50'
                    }`}>
                      {selectedAlert.severity}
                    </span>
                  </div>
                  <p className="text-[#A1A1AA] font-mono text-xs uppercase tracking-wider">{selectedAlert.location_name}</p>
                </div>
                <button 
                  onClick={() => setSelectedAlert(null)}
                  className="p-2 text-[#71717A] hover:text-white transition-colors relative z-10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-[10px] font-mono text-[#71717A] uppercase tracking-widest">Risk Score</div>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-mono text-white font-bold leading-none">{selectedAlert.risk_score?.toFixed(1) || 'N/A'}</span>
                    <span className="text-[#71717A] font-mono text-sm mb-1">/100</span>
                  </div>
                </div>
                
                <div className="bg-[#050508] border border-[#27272A] rounded p-6">
                  <div className="text-[10px] font-mono text-[#71717A] uppercase tracking-widest mb-4">Signal Breakdown</div>
                  <SignalBars signals={selectedAlert.signals || []} />
                </div>
              </div>
              
              <div className="p-6 border-t border-[#27272A] flex justify-end bg-[#050508]">
                <Link
                  to={`/alert/${selectedAlert.id}`}
                  className="bg-[#2457FF] text-white px-6 py-2.5 rounded font-bold text-sm hover:bg-[#2457FF]/90 transition-colors shadow-[0_0_15px_rgba(36,87,255,0.3)] flex items-center gap-2"
                >
                  View Full Investigation <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
