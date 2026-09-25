import { Outlet, Link, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, FileText, LogOut } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingParticles from '../components/animations/FloatingParticles';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/methodology', label: 'Methodology', icon: FileText },
];

export default function MainLayout() {
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col relative z-0 bg-[#000000]">
      {/* Global particle background */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <FloatingParticles count={35} />
      </div>

      {/* Grid dot background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          backgroundImage:
            'radial-gradient(circle, rgba(36,87,255,0.12) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Nav */}
      <header className="bg-[#000000]/80 backdrop-blur-md border-b border-[#27272A] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="absolute inset-0 bg-[#2457FF] blur-md opacity-30 group-hover:opacity-70 transition-opacity rounded-full" />
                <Activity className="w-5 h-5 text-[#2457FF] relative z-10" />
              </div>
              <span className="font-bold text-base tracking-tight text-white">
                Agri<span className="text-[#2457FF]">Shield</span>
              </span>
            </Link>

            <nav className="flex items-center gap-1">
              {NAV.map(({ to, label, icon: Icon }) => {
                const active =
                  to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`relative flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded transition-colors ${
                      active ? 'text-white' : 'text-[#71717A] hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    {active && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-[#1A1A1A] border border-[#27272A] rounded"
                        style={{ zIndex: -1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {import.meta.env.VITE_DEMO_MODE === 'true' && (
              <div className="text-[10px] uppercase tracking-widest font-mono text-[#2457FF] flex items-center gap-2 bg-[#0a0a1a] px-3 py-1.5 rounded border border-[#2457FF]/30">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2457FF] animate-pulse shadow-[0_0_8px_rgba(36,87,255,1)]" />
                <span>Live Feed</span>
              </div>
            )}
            <div className="flex items-center gap-3 border-l border-[#27272A] pl-4">
              <span className="text-xs text-[#71717A] truncate max-w-[140px] font-mono">
                {user?.email}
              </span>
              <button
                onClick={signOut}
                className="text-[#71717A] hover:text-white transition-colors flex items-center gap-1.5 text-sm"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full relative z-10">
        <AnimatePresence mode="wait">
          <Outlet />
        </AnimatePresence>
      </main>
    </div>
  );
}
