import React, { useState } from 'react';
import { Lock, KeyRound, ShieldCheck, Eye, EyeOff, Bot, ArrowRight, Loader2 } from 'lucide-react';

export default function AuthScreen({ isSetup, onAuthSuccess }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isSetup) {
      if (password.length < 4) {
        setError('Password must be at least 4 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/auth/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to setup password');
        onAuthSuccess(data.token);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      if (!password) {
        setError('Please enter your password');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Incorrect password');
        onAuthSuccess(data.token);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#202123] px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-gray-700/60 bg-[#2b2c2f] p-8 shadow-2xl">
        {/* App Icon */}
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#10a37f] text-white shadow-lg shadow-[#10a37f]/20">
          {isSetup ? <Lock size={28} /> : <ShieldCheck size={30} />}
        </div>

        {/* Title & Description */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            {isSetup ? 'ChatGPT Access' : 'Create Master Password'}
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            {isSetup
              ? 'This private instance is password protected. Enter your password to unlock.'
              : 'Set a secret password to prevent unauthorized access over the public tunnel.'}
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-500/40 bg-red-950/40 px-3.5 py-2.5 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-300">
              {isSetup ? 'Password' : 'New Master Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                autoFocus
                required
                className="w-full rounded-xl border border-gray-700 bg-[#202123] px-4 py-3 pr-11 text-sm text-white placeholder-gray-500 transition-colors focus:border-[#10a37f] focus:outline-none focus:ring-1 focus:ring-[#10a37f]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isSetup && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-300">
                Confirm Master Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password..."
                required
                className="w-full rounded-xl border border-gray-700 bg-[#202123] px-4 py-3 text-sm text-white placeholder-gray-500 transition-colors focus:border-[#10a37f] focus:outline-none focus:ring-1 focus:ring-[#10a37f]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#10a37f] py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#0e8e6e] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <span>{isSetup ? 'Unlock ChatGPT' : 'Secure & Continue'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-gray-700/60 pt-4 text-center">
          <p className="text-[11px] text-gray-500 flex items-center justify-center gap-1.5">
            <KeyRound size={12} />
            <span>SQLite-Backed Session Encryption</span>
          </p>
        </div>
      </div>
    </div>
  );
}
