import React, { useState } from 'react';
import { supabase } from '../api/supabase';
import { Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import AbstractNodes from '../canvas/AbstractNodes';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else setError('Check your email for the confirmation link!');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#000000] relative overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 7], fov: 65 }} gl={{ antialias: true, alpha: true }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.2} />
            <pointLight position={[5, 5, 5]} intensity={1} color="#2457FF" />
            <AbstractNodes />
          </Suspense>
        </Canvas>
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(36,87,255,0.1) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Dark gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/40 to-black/80" />

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="bg-[#050508]/90 backdrop-blur-xl border border-[#27272A] rounded-lg p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-[#2457FF] blur-xl opacity-40 rounded-full" />
              <Activity className="w-10 h-10 text-[#2457FF] relative z-10" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Agri<span className="text-[#2457FF]">Shield</span>
            </h1>
            <p className="text-[#71717A] text-xs font-mono mt-1 uppercase tracking-wider">
              Agricultural Intelligence System
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-900/20 border border-red-900/50 text-red-400 text-xs font-mono rounded"
            >
              {error}
            </motion.div>
          )}

          <form className="space-y-4">
            {[{ label: 'Email', type: 'email', value: email, onChange: setEmail, placeholder: 'analyst@example.com' },
              { label: 'Password', type: 'password', value: password, onChange: setPassword, placeholder: '••••••••' }]
              .map((field) => (
                <div key={field.label}>
                  <label className="block text-xs font-mono font-bold text-[#71717A] uppercase tracking-wider mb-2">
                    {field.label}
                  </label>
                  <motion.input
                    whileFocus={{ borderColor: '#2457FF', boxShadow: '0 0 0 2px rgba(36,87,255,0.15)' }}
                    type={field.type}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#27272A] rounded text-white text-sm font-mono focus:outline-none transition-all"
                    placeholder={field.placeholder}
                    required
                  />
                </div>
              ))}

            <div className="flex gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogin}
                disabled={loading}
                className="flex-1 bg-[#2457FF] text-white py-2.5 px-4 text-xs font-bold rounded uppercase tracking-wider hover:bg-[#1a46e8] transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSignUp}
                disabled={loading}
                className="flex-1 bg-transparent text-white border border-[#27272A] py-2.5 px-4 text-xs font-bold rounded uppercase tracking-wider hover:border-[#2457FF] transition-colors disabled:opacity-50"
              >
                Sign Up
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
