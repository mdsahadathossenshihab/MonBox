import React, { useState, useEffect } from 'react';
import { useChat } from '../ChatProvider';
import { Mail, Lock, ArrowRight, MessageSquare, User as UserIcon, ArrowLeft, ShieldCheck, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Auth() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword } = useChat();
  const [mode, setMode] = useState<'initial' | 'login' | 'signup' | 'reset'>('initial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else if (mode === 'signup') {
        await registerWithEmail(email, password, name, gender);
        setSuccess('Verification email sent! Please check your inbox and verify before logging in.');
        setMode('login');
      } else {
        await resetPassword(email);
        setSuccess('Reset link sent to your email.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderInitial = () => (
    <div className="space-y-4">
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white text-slate-950 hover:bg-slate-100 font-bold py-4 px-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-white/5"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </button>

      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
          <span className="bg-[#020617] px-4 text-slate-500">Or Secure Access</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setMode('login')}
          className="flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all group"
        >
          <Mail className="w-4 h-4 text-slate-400 group-hover:text-monbox-teal transition-colors" /> Login
        </button>
        <button
          onClick={() => setMode('signup')}
          className="flex items-center justify-center gap-2 py-4 bg-monbox-teal/10 hover:bg-monbox-teal/20 text-monbox-teal font-bold rounded-2xl border border-monbox-teal/20 transition-all"
        >
          <UserIcon className="w-4 h-4" /> Sign Up
        </button>
      </div>
    </div>
  );

  const renderForm = () => (
    <form onSubmit={handleEmailAuth} className="space-y-4">
      <div className="flex items-center gap-3 mb-8">
        <button 
          type="button"
          onClick={() => setMode('initial')}
          className="p-2.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
        </h2>
      </div>

      {mode === 'signup' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input 
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-11 pr-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-monbox-teal/50 focus:border-monbox-teal transition-all text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Gender</label>
            <select 
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-monbox-teal/50 focus:border-monbox-teal transition-all text-sm appearance-none cursor-pointer"
            >
              <option value="male" className="bg-slate-900">Male</option>
              <option value="female" className="bg-slate-900">Female</option>
              <option value="other" className="bg-slate-900">Other</option>
            </select>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input 
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-11 pr-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-monbox-teal/50 focus:border-monbox-teal transition-all text-sm"
          />
        </div>
      </div>

      {mode !== 'reset' && (
        <div className="space-y-2">
          <div className="flex justify-between items-center ml-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</label>
            {mode === 'login' && (
              <button 
                type="button"
                onClick={() => setMode('reset')}
                className="text-[10px] font-black text-monbox-teal hover:text-monbox-teal-light uppercase tracking-widest transition-colors"
              >
                Forgot?
              </button>
            )}
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input 
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-11 pr-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-monbox-teal/50 focus:border-monbox-teal transition-all text-sm"
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-monbox-teal text-white font-bold py-4 rounded-2xl shadow-2xl shadow-monbox-teal/20 hover:bg-monbox-teal-light active:scale-[0.98] transition-all disabled:opacity-50 mt-6"
      >
        {loading ? 'Processing...' : mode === 'login' ? 'Login' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
        <ArrowRight className="w-4 h-4" />
      </button>

      <p className="text-center text-sm text-slate-500 mt-6 font-medium">
        {mode === 'login' ? "Don't have an account? " : mode === 'signup' ? "Already have an account? " : "Remembered your password? "}
        <button 
          type="button"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="text-monbox-teal font-bold hover:underline"
        >
          {mode === 'login' ? 'Sign Up' : 'Login'}
        </button>
      </p>
    </form>
  );

  return (
    <div className="h-screen w-full bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Atmospheric Effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-monbox-teal/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-monbox-teal/5 blur-[150px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-10 shadow-2xl teal-glow"
      >
        <div className="text-center mb-10">
          <div className="mb-8 inline-flex items-center justify-center w-28 h-28 rounded-[3rem] bg-monbox-teal shadow-2xl shadow-monbox-teal/40 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <MessageSquare className="w-14 h-14 text-white relative z-10" />
            {/* Box & Heart visual representation from logo */}
            <div className="absolute bottom-3 right-3 w-8 h-8 bg-white/20 rounded-xl backdrop-blur-md flex items-center justify-center border border-white/20">
              <Heart className="w-4 h-4 text-white fill-white/20" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 tracking-tighter font-display">MonBox</h1>
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-monbox-teal/30" />
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">Atmospheric Secure</p>
            <div className="h-px w-8 bg-monbox-teal/30" />
          </div>
        </div>

        <div className="space-y-6">
          {mode === 'initial' ? renderInitial() : renderForm()}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-4 px-5 rounded-2xl text-sm font-semibold text-center animate-in fade-in slide-in-from-bottom-2">
              {success}
            </div>
          )}

          {error && (
            <div className="space-y-4">
              <p className="text-rose-400 text-sm font-semibold text-center bg-rose-500/10 py-3 px-5 rounded-2xl border border-rose-500/20">
                {error}
              </p>
              {error.includes('disallowed_useragent') && (
                <div className="text-xs text-slate-500 bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                  <div className="space-y-2">
                    <p className="font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-monbox-teal" />
                      Security Protocol
                    </p>
                    <p>Google has restricted login from this environment. Please switch to a native browser to continue securely.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="py-3 bg-monbox-teal hover:bg-monbox-teal-light text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-monbox-teal/20"
                    >
                      Open Browser
                    </button>
                    <button 
                      onClick={copyToClipboard}
                      className="py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest"
                    >
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-10 text-slate-600 text-[10px] text-center font-black uppercase tracking-widest">
          MonBox Security &bull; 2026
        </p>
      </motion.div>
    </div>
  );
}
