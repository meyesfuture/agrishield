import { Outlet, Link, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, FileText, LogOut } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { motion } from 'framer-motion';

export default function MainLayout() {
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col relative z-0">
      <header className="bg-[#111111]/80 backdrop-blur-md border-b border-[#27272A] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-[#2457FF] blur-md opacity-20 group-hover:opacity-60 transition-opacity rounded-full" />
                <Activity className="w-6 h-6 text-[#2457FF] relative z-10" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-gray-200 transition-colors">AgriShield</span>
            </Link>
            
            <nav className="flex items-center gap-6">
              <Link 
                to="/" 
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  location.pathname === '/' ? 'text-white' : 'text-secondary hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
                {location.pathname === '/' && (
                  <motion.div layoutId="nav-indicator" className="absolute bottom-0 h-0.5 bg-[#2457FF] w-20 shadow-[0_-2px_8px_rgba(36,87,255,0.8)]" />
                )}
              </Link>
              <Link 
                to="/methodology" 
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  location.pathname === '/methodology' ? 'text-white' : 'text-secondary hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                Methodology
                {location.pathname === '/methodology' && (
                  <motion.div layoutId="nav-indicator" className="absolute bottom-0 h-0.5 bg-[#2457FF] w-24 shadow-[0_-2px_8px_rgba(36,87,255,0.8)]" />
                )}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-6">
            {import.meta.env.VITE_DEMO_MODE === 'true' && (
              <div className="text-[10px] uppercase tracking-widest font-mono text-[#2457FF] flex items-center gap-2 bg-[#1A1A1A] px-3 py-1.5 rounded border border-[#27272A]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2457FF] animate-pulse shadow-[0_0_8px_rgba(36,87,255,1)]" />
                <span>Live Feed</span>
              </div>
            )}
            
            <div className="flex items-center gap-4 border-l border-[#27272A] pl-6">
              <span className="text-sm text-secondary truncate max-w-[150px] font-mono text-xs">
                {user?.email}
              </span>
              <button 
                onClick={signOut}
                className="text-secondary hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="sr-only sm:not-sr-only">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
