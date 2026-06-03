import React, { useState } from 'react';
import { Truck, Mail, Lock, User, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/services/auth/AuthContext';
import { ApiError } from '@/services/api/client';
import type { UserRoleName } from '@/services/api/auth';

/**
 * Authentication gate. Renders a login form with a toggle to register a new
 * account. On success the AuthProvider flips to "authenticated" and the app
 * mounts — this component is only ever shown while unauthenticated.
 */

type Mode = 'login' | 'register';

const ROLE_OPTIONS: { value: UserRoleName; label: string }[] = [
  { value: 'ADMIN', label: 'Owner / Admin' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'DRIVER', label: 'Driver' },
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
      const message =
        err instanceof ApiError
          ? err.message
          : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-200 rotate-3 mb-4">
            <Truck size={30} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">FlyAsh Logistics Pro</h1>
          <p className="text-sm font-bold text-slate-400 tracking-tight mt-1">
            {isRegister ? 'Create your operations account' : 'Sign in to your operations hub'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 p-8 space-y-5"
        >
          {isRegister && (
            <Field label="Full Name" icon={User}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Operator"
                autoComplete="name"
                className="w-full bg-transparent outline-none text-sm font-bold text-slate-800 placeholder:text-slate-300"
              />
            </Field>
          )}

          <Field label="Email" icon={Mail}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              className="w-full bg-transparent outline-none text-sm font-bold text-slate-800 placeholder:text-slate-300"
            />
          </Field>

          <Field label="Password" icon={Lock}>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegister ? 'At least 8 characters' : '••••••••'}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              className="w-full bg-transparent outline-none text-sm font-bold text-slate-800 placeholder:text-slate-300"
            />
          </Field>

          {isRegister && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest px-1">Role</label>
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                <ShieldCheck size={18} className="text-slate-400 shrink-0" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRoleName)}
                  className="w-full bg-transparent outline-none text-sm font-bold text-slate-800"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {error && (
            <div className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-black text-sm tracking-tight py-3.5 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 size={18} className="animate-spin" />}
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>

          <div className="text-center text-xs font-bold text-slate-400 tracking-tight">
            {isRegister ? 'Already have an account?' : 'New to FlyAsh Pro?'}{' '}
            <button type="button" onClick={switchMode} className="text-blue-600 hover:underline">
              {isRegister ? 'Sign in' : 'Create one'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; icon: React.ElementType; children: React.ReactNode }> = ({
  label,
  icon: Icon,
  children,
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest px-1">{label}</label>
    <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-300 transition-all">
      <Icon size={18} className="text-slate-400 shrink-0" />
      {children}
    </div>
  </div>
);

export default LoginScreen;
