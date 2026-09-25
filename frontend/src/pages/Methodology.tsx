import { useState, Suspense } from 'react';
import { Database, GitMerge, ShieldAlert } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import BranchedMenu from '../components/animations/BranchedMenu';
import ScrollReveal from '../components/animations/ScrollReveal';
import PageTransition from '../components/animations/PageTransition';
import AbstractNodes from '../canvas/AbstractNodes';

const sections = [
  {
    id: 'core',
    label: '1. Core Philosophy',
    icon: ShieldAlert,
    content: (
      <p className="text-[#A1A1AA] leading-relaxed text-base">
        AgriShield detects unusual market conditions before they become larger supply problems.
        It is an <strong className="text-white">early-warning investigation lead</strong>, not proof of wrongdoing or hoarding.
        When the system flags a location, it means the observed data has deviated significantly from
        historical baselines across multiple independent dimensions, and field verification is recommended.
      </p>
    ),
  },
  {
    id: 'signals',
    label: '2. Signal Processing',
    icon: GitMerge,
    content: (
      <div className="space-y-4">
        <p className="text-[#A1A1AA] leading-relaxed">
          The prototype risk score is calculated using four distinct signals. If a signal has insufficient
          historical data (fewer than 14 observations) or is missing, it is excluded and the remaining weights
          are renormalized. The system never fabricates data to fill gaps.
        </p>
        {[
          { id: 'price', title: 'Price Anomaly', weight: '35% weight', desc: 'Current mandi modal prices compared against a historical baseline (minimum 14 observations). A high percentage deviation indicates acute market stress.' },
          { id: 'arrival', title: 'Arrival Anomaly', weight: '35% weight', desc: 'Daily arrival volumes at the mandi compared against historical averages. A sharp decline in arrivals, especially when paired with a price spike, is a primary supply-stress indicator.' },
          { id: 'crop', title: 'Crop / Satellite Signal', weight: '20% weight', desc: 'Derived from optical vegetation indices (e.g., Copernicus Sentinel-2). Identifies if the supply disruption is likely caused by genuine crop failure in the catchment area.' },
          { id: 'news', title: 'News & Context Signal', weight: '10% weight', desc: 'NLP-driven classification of local news and reporting. Identifies known supply disruptions like transportation strikes, weather events, or official storage reports.' },
        ].map((s, i) => (
          <ScrollReveal key={s.id} delay={i * 0.08}>
            <div id={s.id} className="bg-[#050508] border border-[#27272A] rounded p-6 relative overflow-hidden group scroll-mt-24">
              <div className="absolute top-0 left-0 h-full w-0.5 bg-gradient-to-b from-[#2457FF] to-transparent" />
              <div className="pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white">{s.title}</h3>
                  <span className="text-[10px] font-mono text-[#2457FF] bg-[#2457FF]/10 border border-[#2457FF]/20 px-2 py-0.5 rounded">{s.weight}</span>
                </div>
                <p className="text-[#71717A] text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    ),
  },
  {
    id: 'consistency',
    label: '3. Cross-Signal Consistency',
    icon: GitMerge,
    content: (
      <p className="text-[#A1A1AA] leading-relaxed">
        In addition to the risk score, the system provides a "Cross-Signal Consistency" metric. This is not
        a 5th piece of evidence, but a measure of how closely the available signals agree with each other.
        High consistency means all signals are pointing in the same direction (e.g., prices are up, arrivals
        are down, and crop health is poor). Low consistency means the signals are mixed, suggesting a more
        complex or localized issue.
      </p>
    ),
  },
  {
    id: 'provenance',
    label: '4. Data Provenance',
    icon: Database,
    content: (
      <ul className="space-y-4">
        {[
          { key: 'Market Data', val: 'Sourced from Open Government Data (OGD) Platform India.' },
          { key: 'Satellite Data', val: 'Copernicus Data Space Ecosystem (Sentinel-2).' },
          { key: 'Demo Mode', val: 'For expo purposes, data may be served from a cached fixture to ensure reliability. This data is explicitly marked as "Live Feed".' },
        ].map((item) => (
          <li key={item.key} className="flex gap-3">
            <span className="text-[10px] font-mono text-[#2457FF] bg-[#2457FF]/10 border border-[#2457FF]/20 px-2 py-0.5 rounded h-fit mt-0.5 uppercase tracking-wider whitespace-nowrap">{item.key}</span>
            <span className="text-[#A1A1AA] text-sm leading-relaxed">{item.val}</span>
          </li>
        ))}
      </ul>
    ),
  },
];

export default function Methodology() {
  const [_activeSection, setActiveSection] = useState('core');

  const menuItems = [
    { value: 'core', label: '1. Core Philosophy', icon: ShieldAlert },
    {
      label: '2. Signal Processing',
      icon: GitMerge,
      children: [
        { value: 'price', label: 'Price Anomaly' },
        { value: 'arrival', label: 'Arrival Anomaly' },
        { value: 'crop', label: 'Crop / Satellite' },
        { value: 'news', label: 'News & Context' },
      ],
    },
    { value: 'consistency', label: '3. Cross-Signal Consistency', icon: GitMerge },
    { value: 'provenance', label: '4. Data Provenance', icon: Database },
  ];

  const handleSelect = (value: string) => {
    setActiveSection(value);
    const el = document.getElementById(value);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <PageTransition>
      <div className="space-y-12">
        {/* 3D Banner */}
        <div className="relative h-56 w-full rounded border border-[#27272A] overflow-hidden bg-[#020204]">
          <Canvas camera={{ position: [0, 0, 6], fov: 60 }} gl={{ antialias: true, alpha: true }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.3} />
              <pointLight position={[5, 5, 5]} intensity={1} color="#2457FF" />
              <pointLight position={[-5, -5, -5]} intensity={0.5} color="#ffffff" />
              <AbstractNodes />
            </Suspense>
          </Canvas>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center z-10">
              <ScrollReveal>
                <div className="text-[10px] font-mono text-[#2457FF] uppercase tracking-widest mb-3">Documentation</div>
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <h1 className="text-4xl font-bold text-white">Methodology</h1>
              </ScrollReveal>
              <ScrollReveal delay={0.2}>
                <p className="text-[#71717A] text-xs font-mono uppercase tracking-wider mt-2">
                  How AgriShield calculates the Supply Anomaly Risk Score.
                </p>
              </ScrollReveal>
            </div>
          </div>
          {/* gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row gap-12 items-start">
          {/* Sidebar */}
          <aside className="w-full md:w-64 sticky top-24 hidden md:block border-r border-[#27272A] pr-4">
            <div className="text-[10px] font-bold text-[#71717A] uppercase tracking-widest mb-6 pl-2">Sections</div>
            <BranchedMenu
              items={menuItems}
              defaultOpen={[1]}
              defaultActive="core"
              onSelect={handleSelect}
              color="#71717A"
              accentColor="#2457FF"
              lineColor="#27272A"
            />
          </aside>

          <div className="flex-1 space-y-16 pb-24">
            {sections.map((section) => (
              <ScrollReveal key={section.id}>
                <section id={section.id} className="space-y-6 scroll-mt-24">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#27272A]">
                    <section.icon className="w-5 h-5 text-[#2457FF]" />
                    <h2 className="text-xl font-bold text-white">{section.label}</h2>
                  </div>
                  <div>{section.content}</div>
                </section>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
