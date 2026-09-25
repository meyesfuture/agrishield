import React, { useState } from 'react';
import { supabase } from '../api/supabase';
import { Activity } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setError("Check your email for the confirmation link!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="w-full max-w-md p-8 bg-background border border-border shadow-sm">
        <div className="flex flex-col items-center mb-8">
          <Activity className="w-12 h-12 text-accent mb-4" />
          <h1 className="h2 text-center">AgriShield</h1>
          <p className="text-secondary text-center mt-2">
            Sign in to access the investigation dashboard
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-border bg-background focus:outline-none focus:border-accent"
              placeholder="analyst@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-border bg-background focus:outline-none focus:border-accent"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="flex-1 bg-primary text-background py-2 px-4 hover:bg-black transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <button
              onClick={handleSignUp}
              disabled={loading}
              className="flex-1 bg-muted text-primary border border-border py-2 px-4 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
