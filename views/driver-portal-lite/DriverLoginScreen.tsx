import React, { useState } from 'react';
import { Phone, Lock, Loader2, Truck, MapPin, PackageCheck } from 'lucide-react';
import { useDriverAuth } from '@/services/driverAuth/DriverAuthContext';
import { DriverApiError } from '@/services/driverApi';

const FEATURES = [
  { icon: MapPin,        text: 'See routes assigned to you' },
  { icon: PackageCheck,  text: 'Accept or reject a trip' },
  { icon: Truck,         text: 'Track pickup & delivery dates' },
];

const DriverLoginScreen: React.FC = () => {
  const { login } = useDriverAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(phoneNumber.trim(), password);
    } catch (err) {
      setError(err instanceof DriverApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F5F4F0]">

      {/* Left panel (hero) */}
      <div className="hidden lg:flex lg:w-[46%] bg-[#1C1917] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600 rounded-full opacity-10 translate-x-1/3 translate-y-1/3 blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-64 h-64 bg-amber-500 rounded-full opacity-5 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
              <Truck size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-black text-[15px] tracking-tight leading-none">FlyAsh Pro</p>
              <p className="text-white/40 font-semibold text-[10px] uppercase tracking-widest mt-0.5">Driver Portal</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight leading-[1.1]">
              On the Road,<br/>
              <span className="text-blue-400">In Control</span>
            </h1>
            <p className="text-white/50 font-medium text-base mt-4 leading-relaxed max-w-sm">
              Check your assigned routes, accept or reject trips, and stay on top of your schedule.
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

        <div className="relative z-10">
          <p className="text-white/25 text-xs font-medium">© 2024 FlyAsh Logistics Pro. Secure platform.</p>
        </div>
      </div>

      {/* Right panel (form) */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm animate-fade-up">

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Truck size={14} className="text-white" />
            </div>
            <span className="font-black text-[15px] text-[#1C1917]">FlyAsh Pro — Driver</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-black text-[#1C1917] tracking-tight leading-tight">Driver Sign In</h2>
            <p className="text-sm text-[#A8A29E] font-medium mt-1.5">
              Use the phone number and password your dispatcher gave you.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <Field label="Phone Number" icon={Phone}>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="9876543210"
                autoComplete="tel"
                className="w-full bg-transparent outline-none text-sm font-semibold text-[#1C1917] placeholder:text-[#C4C0BB]"
              />
            </Field>

            <Field label="Password" icon={Lock}>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-transparent outline-none text-sm font-semibold text-[#1C1917] placeholder:text-[#C4C0BB]"
              />
            </Field>

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
              {submitting ? 'Please wait…' : 'Sign In'}
            </button>

          </form>

          <p className="text-center text-xs font-semibold text-[#A8A29E] mt-6">
            No account? Ask your dispatcher to set up your portal access.
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

export default DriverLoginScreen;
