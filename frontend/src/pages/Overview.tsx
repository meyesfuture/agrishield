import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, MapPin, Package, ShieldAlert, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Map from '../components/Map';
import GlideSelect from '../components/animations/GlideSelect';

export default function Overview() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>({
    monitored_locations: 0,
    active_alerts: 0,
    commodities: 0,
    highest_risk: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:8000/api/overview').then(res => res.json()),
      fetch('http://localhost:8000/api/alerts').then(res => res.json())
    ])
      .then(([overviewData, alertsData]) => {
        setOverview(overviewData);
        setAlerts(alertsData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching data", err);
        setLoading(false);
      });
  }, []);

  const filterOptions = useMemo(() => {
    const uniqueCommodities = Array.from(new Set(alerts.map(a => a.commodity_name)));
    const options = [{ value: 'all', label: 'All Commodities', tag: alerts.length.toString() }];
    uniqueCommodities.forEach(c => {
      const count = alerts.filter(a => a.commodity_name === c).length;
      options.push({ value: c, label: c, tag: count.toString() });
    });
    return options;
  }, [alerts]);

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(a => a.commodity_name === filter);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-12"
    >
      <motion.section variants={itemVariants} className="space-y-4">
        <h1 className="h1">Agricultural Supply Intelligence</h1>
        <p className="text-secondary max-w-2xl text-lg font-mono text-sm">
          DETECT UNUSUAL MARKET CONDITIONS BEFORE THEY BECOME MACRO SUPPLY DISRUPTIONS.
        </p>
      </motion.section>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-6 flex flex-col gap-3 group hover:border-[#2457FF] transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#2457FF] opacity-0 group-hover:opacity-5 rounded-full blur-2xl transition-opacity" />
          <span className="text-secondary text-xs tracking-wider uppercase font-bold">Active Alerts</span>
          <div className="flex items-center justify-between">
            <span className="text-5xl font-mono text-white">{overview.active_alerts}</span>
            <ShieldAlert className="w-6 h-6 text-[#2457FF]" />
          </div>
        </div>
        <div className="card p-6 flex flex-col gap-3 group hover:border-[#2457FF] transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#2457FF] opacity-0 group-hover:opacity-5 rounded-full blur-2xl transition-opacity" />
          <span className="text-secondary text-xs tracking-wider uppercase font-bold">Markets Monitored</span>
          <div className="flex items-center justify-between">
            <span className="text-5xl font-mono text-white">{overview.monitored_locations}</span>
            <MapPin className="w-6 h-6 text-secondary group-hover:text-[#2457FF] transition-colors" />
          </div>
        </div>
        <div className="card p-6 flex flex-col gap-3 group hover:border-[#2457FF] transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#2457FF] opacity-0 group-hover:opacity-5 rounded-full blur-2xl transition-opacity" />
          <span className="text-secondary text-xs tracking-wider uppercase font-bold">Commodities</span>
          <div className="flex items-center justify-between">
            <span className="text-5xl font-mono text-white">{overview.commodities || 0}</span>
            <Package className="w-6 h-6 text-secondary group-hover:text-[#2457FF] transition-colors" />
          </div>
        </div>
        <div className="card p-6 flex flex-col gap-3 group hover:border-red-500 transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500 opacity-0 group-hover:opacity-10 rounded-full blur-2xl transition-opacity" />
          <span className="text-secondary text-xs tracking-wider uppercase font-bold text-red-500/80">Highest Risk</span>
          <div className="flex items-center justify-between">
            <span className="text-5xl font-mono text-red-500">{overview.highest_risk ? overview.highest_risk.toFixed(1) : 0}</span>
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
        </div>
      </motion.div>

      <motion.section variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="h2">National Overview Map</h2>
        </div>
        <div className="h-[400px] w-full card p-1 bg-[#111111]">
          <Map alerts={filteredAlerts} />
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#27272A]">
          <h2 className="h2 flex items-center gap-2">
            Intelligence Feed 
            <span className="text-xs font-mono bg-[#27272A] text-white px-2 py-1 rounded">{filteredAlerts.length}</span>
          </h2>
          <GlideSelect 
            options={filterOptions} 
            value={filter} 
            onChange={setFilter} 
            ariaLabel="Filter Commodities" 
          />
        </div>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          layout
        >
          {filteredAlerts.map(alert => (
            <motion.div 
              key={alert.id}
              layoutId={`card-${alert.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="card p-6 flex flex-col justify-between hover:border-[#2457FF] transition-all group relative cursor-pointer"
            >
              <Link to={`/alert/${alert.id}`} className="absolute inset-0 z-10" aria-label={`View ${alert.commodity_name}`} />
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#2457FF] transition-colors">{alert.commodity_name}</h3>
                    <p className="text-secondary font-mono text-xs uppercase tracking-wider">{alert.location_name}</p>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${alert.severity === 'critical' ? 'bg-red-900/20 text-red-400 border-red-900' : 'bg-orange-900/20 text-orange-400 border-orange-900'}`}>
                    {alert.severity}
                  </span>
                </div>
                
                <p className="text-secondary text-sm mb-6 line-clamp-3 leading-relaxed">
                  {alert.explanation}
                </p>
                
                {alert.partial_signals && (
                  <p className="text-[10px] font-mono text-amber-500 mb-4 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    INCOMPLETE DATA
                  </p>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-[#27272A] flex items-center justify-between">
                <div>
                  <div className="text-3xl font-mono text-white font-bold group-hover:text-[#2457FF] transition-colors">
                    {alert.risk_score != null ? alert.risk_score.toFixed(1) : 'N/A'}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center group-hover:bg-[#2457FF] transition-colors">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>
    </motion.div>
  );
}
