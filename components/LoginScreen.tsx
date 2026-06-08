import React, { useState } from 'react';
import { Mail, Lock, User, Loader2, ShieldCheck, Zap, BarChart3, Truck } from 'lucide-react';
import { useAuth } from '@/services/auth/AuthContext';
import { ApiError } from '@/services/api/client';
import type { UserRoleName } from '@/services/api/auth';

type Mode = 'login' | 'register';

const ROLE_OPTIONS: { value: UserRoleName; label: string; desc: string }[] = [
  { value: 'ADMIN',      label: 'Owner / Admin',  desc: 'Full access' },
  { value: 'ACCOUNTANT', label: 'Accountant',     desc: 'Finance access' },
  { value: 'DRIVER',     label: 'Driver',         desc: 'Trip access' },
];

const FEATURES = [
  { icon: Truck,      text: 'Real-time fleet tracking' },
  { icon: BarChart3,  text: 'Financial intelligence' },
  { icon: Zap,        text: 'Instant order dispatch' },
];

const LoginScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRoleName>('ADMIN');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === 'register';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isRegister && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      if (isRegister) {
        await register({ email: email.trim(), password, name: name.trim() || undefined, role });
      } else {
        await login({ email: email.trim(), password });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F5F4F0]">

      {/* ── Left panel (hero) ───────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[46%] bg-[#1C1917] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '24px 24px'}} />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600 rounded-full opacity-10 translate-x-1/3 translate-y-1/3 blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-64 h-64 bg-amber-500 rounded-full opacity-5 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
              <span className="text-white font-black text-sm">FA</span>
            </div>
            <div>
              <p className="text-white font-black text-[15px] tracking-tight leading-none">FlyAsh Pro</p>
              <p className="text-white/40 font-semibold text-[10px] uppercase tracking-widest mt-0.5">Logistics</p>
            </div>
          </div>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight leading-[1.1]">
              Operations<br/>
              <span className="text-blue-400">Command Center</span>
            </h1>
            <p className="text-white/50 font-medium text-base mt-4 leading-relaxed max-w-sm">
              Manage your entire flyash logistics operation — fleet, orders, billing, and workforce — from one unified platform.
            </p>
          </div>

          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-blue-400" strokeWidth={1.8} />
                </div>
                <span className="text-white/70 font-medium text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/25 text-xs font-medium">© 2024 FlyAsh Logistics Pro. Secure platform.</p>
        </div>
      </div>

      {/* ── Right panel (form) ──────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm animate-fade-up">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">FA</span>
            </div>
            <span className="font-black text-[15px] text-[#1C1917]">FlyAsh Pro</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-black text-[#1C1917] tracking-tight leading-tight">
              {isRegister ? 'Create account' : 'Welcome back'}
            </h2>
            <p className="text-sm text-[#A8A29E] font-medium mt-1.5">
              {isRegister ? 'Set up your operations account' : 'Sign in to your operations hub'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {isRegister && (
              <Field label="Full Name" icon={User}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Operator"
                  autoComplete="name"
                  className="w-full bg-transparent outline-none text-sm font-semibold text-[#1C1917] placeholder:text-[#C4C0BB]"
                />
              </Field>
            )}

            <Field label="Email address" icon={Mail}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                className="w-full bg-transparent outline-none text-sm font-semibold text-[#1C1917] placeholder:text-[#C4C0BB]"
              />
            </Field>

            <Field label="Password" icon={Lock}>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegister ? 'Min. 8 characters' : '••••••••'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                className="w-full bg-transparent outline-none text-sm font-semibold text-[#1C1917] placeholder:text-[#C4C0BB]"
              />
            </Field>

            {isRegister && (
              <div className="space-y-1.5">
                <label className="input-label">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        role === opt.value
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'bg-white border-[#E7E5E0] text-[#57534E] hover:border-[#D1CFC9]'
                      }`}
                    >
                      <ShieldCheck size={14} className="mb-1.5" strokeWidth={2} />
                      <p className={`text-[11px] font-black leading-none ${role === opt.value ? 'text-white' : 'text-[#1C1917]'}`}>{opt.label}</p>
                      <p className={`text-[9px] font-medium mt-0.5 uppercase tracking-wide ${role === opt.value ? 'text-blue-100' : 'text-[#A8A29E]'}`}>{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                  <span className="text-white text-[9px] font-black">!</span>
                </div>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-black text-sm py-3.5 rounded-xl shadow-md shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? 'Please wait…' : isRegister ? 'Create Account' : 'Sign In'}
            </button>

          </form>

          <p className="text-center text-xs font-semibold text-[#A8A29E] mt-6">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" onClick={() => { setMode(isRegister ? 'login' : 'register'); setError(null); }} className="text-blue-600 font-bold hover:underline">
              {isRegister ? 'Sign in' : 'Create one'}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; icon: React.ElementType; children: React.ReactNode }> = ({ label, icon: Icon, children }) => (
  <div className="space-y-1.5">
    <label className="input-label">{label}</label>
    <div className="flex items-center gap-2.5 bg-white border border-[#E7E5E0] rounded-xl px-3.5 py-3 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/8 transition-all shadow-sm">
      <Icon size={16} className="text-[#C4C0BB] shrink-0" strokeWidth={1.8} />
      {children}
    </div>
  </div>
);

export default LoginScreen;
