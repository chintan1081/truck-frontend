
import React, { useState } from 'react';
import {
  Headphones, MessageSquare, Mail, Phone, ExternalLink,
  Search, ChevronDown, ChevronUp, FileText, LifeBuoy, ShieldCheck, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SupportView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { question: 'How do I update my company details?', answer: "Navigate to Settings. Only Admin-role users can update the company name, logo, and contact information." },
    { question: 'Can I bulk export invoices for multiple clients?', answer: "Yes — in Billing Hub, select multiple invoices and use the bulk actions to preview or download a consolidated report." },
    { question: "How is 'Round Off' calculated in invoices?", answer: "The system rounds the total to the nearest whole number. Manual and auto round-off are shown separately in the invoice preview." },
    { question: 'Where can I manage truck maintenance expenses?', answer: "Go to Fleet Finance → Maintenance tab. You can log repairs, services, and periodic maintenance per asset." },
    { question: "What is the Plant Hub used for?", answer: "Plant Hub manages loading-point interactions — plant advances, pool entries, and loading status for your fleet." },
  ];

  const filteredFaqs = faqs.filter(f =>
    f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const STATUS_ITEMS = [
    { label: 'Billing Engine',   status: 'Operational',      dot: 'bg-emerald-500', text: 'badge-green' },
    { label: 'GPS Tracking',     status: 'Operational',      dot: 'bg-emerald-500', text: 'badge-green' },
    { label: 'Accounting PDF',   status: 'Operational',      dot: 'bg-emerald-500', text: 'badge-green' },
    { label: 'Mobile Portal',    status: 'Live Updates',     dot: 'bg-blue-500',    text: 'badge-blue' },
  ];

  return (
    <div className="page-root page-stack-lg max-w-6xl animate-fade-up">

      {/* Hero */}
      <div className="relative overflow-hidden bg-[#1C1917] rounded-2xl p-10 text-white shadow-lg">
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '20px 20px' }} />
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-600/15 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-5">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/15 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              Support Active 24/7
            </span>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              How can we <span className="text-blue-400">help you</span> today?
            </h1>
            <p className="text-white/50 text-sm font-medium leading-relaxed max-w-md">
              Get expert assistance for your FlyAsh Pro operations. Search our docs or connect with a specialist.
            </p>
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" size={16} />
              <input
                type="text"
                placeholder="Search help, features, tutorials…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/8 border border-white/12 rounded-xl py-3 pl-10 pr-4 text-white text-sm font-medium placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/15 transition-all"
              />
            </div>
          </div>
          <div className="hidden lg:flex items-center justify-center w-36 h-36 bg-blue-600 rounded-2xl shadow-xl shadow-blue-900/40 rotate-3 shrink-0">
            <Headphones size={64} className="text-white -rotate-3" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Mail,  title: 'Email Support',   body: 'Response within 2 hours for critical technical issues and portal access.', cta: 'help@flyashpro.com', color: 'text-indigo-600 bg-indigo-50', hover: 'hover:border-indigo-200' },
          { icon: Phone, title: 'Priority Call',   body: 'Direct line for fleet owners and dispatch managers for urgent routing.', cta: '+91 98765 43210', color: 'text-emerald-600 bg-emerald-50', hover: 'hover:border-emerald-200' },
          { icon: Zap,   title: 'Live Chat',        body: 'Instant messaging for drivers and plant staff using the mobile portal.', cta: 'Start Session', color: 'text-amber-600 bg-amber-50', hover: 'hover:border-amber-200' },
        ].map(({ icon: Icon, title, body, cta, color, hover }) => (
          <div key={title} className={`card card-pad hover:shadow-md transition-all cursor-pointer group ${hover}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color} group-hover:scale-105 transition-transform`}>
              <Icon size={22} strokeWidth={1.8} />
            </div>
            <h3 className="text-base font-black text-[#1C1917] mb-1.5">{title}</h3>
            <p className="t-body text-sm leading-relaxed mb-4">{body}</p>
            <span className={`text-xs font-black flex items-center gap-1.5 ${color.split(' ')[0]}`}>
              {cta} <ExternalLink size={12} />
            </span>
          </div>
        ))}
      </div>

      {/* FAQ + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* FAQ */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="page-title">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {filteredFaqs.length > 0 ? filteredFaqs.map((faq, i) => (
              <div key={i} className="card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#FAFAF8] transition-all"
                >
                  <span className="text-sm font-bold text-[#1C1917] pr-4">{faq.question}</span>
                  {openFaq === i
                    ? <ChevronUp size={16} className="text-blue-600 shrink-0" />
                    : <ChevronDown size={16} className="text-[#A8A29E] shrink-0" />
                  }
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-sm text-[#57534E] leading-relaxed border-t border-[#F0EEE9] pt-3">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )) : (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon"><FileText size={20} className="text-[#A8A29E]" /></div>
                  <p className="empty-state-title">No results for "{searchQuery}"</p>
                  <button onClick={() => setSearchQuery('')} className="btn btn-ghost btn-sm">Clear Search</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="space-y-4">
          <h3 className="section-title">System Status</h3>
          <div className="card card-pad space-y-3">
            {STATUS_ITEMS.map(({ label, status, dot, text }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-[#F0EEE9] last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="text-sm font-semibold text-[#1C1917]">{label}</span>
                </div>
                <span className={`badge ${text}`}>{status}</span>
              </div>
            ))}

            <div className="pt-2">
              <div className="bg-[#1C1917] p-4 rounded-xl relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-white font-black text-base">v2.4.0</p>
                  <p className="text-white/40 text-xs font-medium mt-0.5 mb-3">Latest Professional Release</p>
                  <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-black uppercase tracking-widest cursor-pointer">
                    View Changelog <ExternalLink size={11} />
                  </div>
                </div>
                <Zap size={60} className="absolute -bottom-3 -right-3 text-white/5 -rotate-12 group-hover:rotate-0 transition-transform" />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#E7E5E0]">
        {[
          { icon: ShieldCheck, title: 'Security Verified',       body: 'All sessions are encrypted and monitored for your safety.' },
          { icon: LifeBuoy,    title: 'Help Documentation',      body: 'Access detailed manuals for every professional feature.' },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl border border-[#E7E5E0] flex items-center justify-center shadow-sm shrink-0">
              <Icon size={20} className="text-blue-600" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1C1917]">{title}</p>
              <p className="t-caption">{body}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default SupportView;
