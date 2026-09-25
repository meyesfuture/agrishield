import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Database, GitMerge, ShieldAlert } from 'lucide-react';
import BranchedMenu from '../components/animations/BranchedMenu';

export default function Methodology() {
  const [activeSection, setActiveSection] = useState('core');

  const menuItems = [
    {
      value: 'core',
      label: '1. Core Philosophy',
      icon: ShieldAlert
    },
    {
      label: '2. Signal Processing',
      icon: GitMerge,
      children: [
        { value: 'price', label: 'Price Anomaly' },
        { value: 'arrival', label: 'Arrival Anomaly' },
        { value: 'crop', label: 'Crop / Satellite' },
        { value: 'news', label: 'News & Context' },
      ]
    },
    {
      value: 'consistency',
      label: '3. Cross-Signal Consistency',
      icon: GitMerge
    },
    {
      value: 'provenance',
      label: '4. Data Provenance',
      icon: Database
    }
  ];

  const handleMenuSelect = (value: string) => {
    setActiveSection(value);
    const el = document.getElementById(value);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-12 max-w-6xl mx-auto items-start">
      <aside className="w-full md:w-64 sticky top-24 hidden md:block border-r border-[#27272A] pr-4 h-[calc(100vh-8rem)]">
        <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-6 pl-2">Documentation</div>
        <BranchedMenu 
          items={menuItems} 
          defaultOpen={[1]} 
          defaultActive="core"
          onSelect={handleMenuSelect}
          color="#A1A1AA"
          accentColor="#2457FF"
          lineColor="#27272A"
        />
      </aside>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 space-y-16"
      >
        <header className="border-b border-[#27272A] pb-6">
          <h1 className="h1">Methodology & Architecture</h1>
          <p className="text-secondary mt-2 text-lg font-mono text-sm uppercase tracking-wider">
            How AgriShield calculates the Supply Anomaly Risk Score.
          </p>
        </header>

        <section id="core" className="space-y-4 scroll-mt-24">
          <h2 className="h2 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#2457FF]" />
            1. Core Philosophy
          </h2>
          <div className="card p-8 bg-gradient-to-br from-[#111111] to-[#1A1A1A]">
            <p className="text-gray-300 leading-relaxed text-lg">
              AgriShield detects unusual market conditions before they become larger supply problems. 
              It is an <strong className="text-white">early-warning investigation lead</strong>, not proof of wrongdoing or hoarding. 
              When the system flags a location, it means the observed data has deviated significantly from 
              historical baselines across multiple independent dimensions, and field verification is recommended.
            </p>
          </div>
        </section>

        <section id="signals" className="space-y-8 scroll-mt-24">
          <div>
            <h2 className="h2 flex items-center gap-2 mb-4">
              <GitMerge className="w-6 h-6 text-[#2457FF]" />
              2. Signal Processing
            </h2>
            <p className="text-secondary leading-relaxed">
              The prototype risk score is calculated using four distinct signals. If a signal has insufficient 
              historical data (fewer than 14 observations) or is missing, it is excluded and the remaining weights 
              are renormalized. The system never fabricates data to fill gaps.
            </p>
          </div>

          <div className="grid gap-6">
            <div id="price" className="card p-6 border-l-4 border-l-[#2457FF] scroll-mt-24">
              <h3 className="font-bold text-xl text-white mb-2">Price Anomaly (35% weight)</h3>
              <p className="text-secondary leading-relaxed">
                Current mandi modal prices compared against a historical baseline (minimum 14 observations). 
                A high percentage deviation indicates acute market stress.
              </p>
            </div>
            
            <div id="arrival" className="card p-6 border-l-4 border-l-[#2457FF] scroll-mt-24">
              <h3 className="font-bold text-xl text-white mb-2">Arrival Anomaly (35% weight)</h3>
              <p className="text-secondary leading-relaxed">
                Daily arrival volumes at the mandi compared against historical averages. A sharp decline in arrivals, 
                especially when paired with a price spike, is a primary supply-stress indicator.
              </p>
            </div>

            <div id="crop" className="card p-6 border-l-4 border-l-[#2457FF] scroll-mt-24">
              <h3 className="font-bold text-xl text-white mb-2">Crop / Satellite Signal (20% weight)</h3>
              <p className="text-secondary leading-relaxed">
                Derived from optical vegetation indices (e.g., Copernicus Sentinel-2). Identifies if the supply 
                disruption is likely caused by genuine crop failure in the catchment area.
              </p>
            </div>

            <div id="news" className="card p-6 border-l-4 border-l-[#2457FF] scroll-mt-24">
              <h3 className="font-bold text-xl text-white mb-2">News & Context Signal (10% weight)</h3>
              <p className="text-secondary leading-relaxed">
                NLP-driven classification of local news and reporting. Identifies known supply disruptions 
                like transportation strikes, weather events, or official storage reports.
              </p>
            </div>
          </div>
        </section>

        <section id="consistency" className="space-y-4 scroll-mt-24">
          <h2 className="h2 flex items-center gap-2">
            <GitMerge className="w-6 h-6 text-[#2457FF]" />
            3. Cross-Signal Consistency
          </h2>
          <div className="card p-8">
            <p className="text-gray-300 leading-relaxed">
              In addition to the risk score, the system provides a "Cross-Signal Consistency" metric. This is not 
              a 5th piece of evidence, but a measure of how closely the available signals agree with each other. 
              High consistency means all signals are pointing in the same direction (e.g., prices are up, arrivals 
              are down, and crop health is poor). Low consistency means the signals are mixed, suggesting a more 
              complex or localized issue.
            </p>
          </div>
        </section>

        <section id="provenance" className="space-y-4 scroll-mt-24 mb-24">
          <h2 className="h2 flex items-center gap-2">
            <Database className="w-6 h-6 text-[#2457FF]" />
            4. Data Provenance
          </h2>
          <div className="card p-8 bg-gradient-to-br from-[#111111] to-[#1A1A1A]">
            <ul className="list-disc pl-5 space-y-4 text-gray-300">
              <li><strong className="text-white font-mono uppercase text-xs tracking-wider">Market Data:</strong> Sourced from Open Government Data (OGD) Platform India.</li>
              <li><strong className="text-white font-mono uppercase text-xs tracking-wider">Satellite Data:</strong> Copernicus Data Space Ecosystem (Sentinel-2).</li>
              <li><strong className="text-white font-mono uppercase text-xs tracking-wider">Demo Mode:</strong> For expo purposes, data may be served from a cached fixture to ensure reliability. This data is explicitly marked as "Live Feed".</li>
            </ul>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
