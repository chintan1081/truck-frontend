
import React, { useState } from 'react';
import { 
  Headphones, 
  MessageSquare, 
  Mail, 
  Phone, 
  ExternalLink, 
  Search, 
  ChevronDown, 
  ChevronUp,
  FileText,
  LifeBuoy,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SupportView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "How do I update my company details?",
      answer: "You can update your company details including name, logo, and contact information in the 'Settings' section. Only users with the Admin role can access these settings."
    },
    {
      question: "Can I bulk export invoices for multiple clients?",
      answer: "Yes, in the 'Billing Hub', you can select multiple invoices and use the bulk actions to preview or download a consolidated report."
    },
    {
      question: "How is the 'Round Off' calculated in invoices?",
      answer: "The system automatically rounds off the total amount to the nearest whole number. You can see the manual round-off and auto round-off components in the invoice preview."
    },
    {
      question: "Where can I manage truck maintenance expenses?",
      answer: "Go to 'Fleet Finance' and select the 'Maintenance' tab. There you can log and track all repairs, services, and periodic maintenance for each asset in your fleet."
    },
    {
      question: "What is the 'Plant Hub' used for?",
      answer: "Plant Hub is designed to manage interactions at loading points (Power Plants). It tracks plant advances, pool entries, and loading status for your trucks."
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 text-white p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-full font-black text-xs uppercase tracking-widest border border-blue-500/30">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              Support Active 24/7
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
              How can we <span className="text-blue-500">help you</span> today?
            </h1>
            <p className="text-slate-400 font-medium text-lg max-w-xl mx-auto md:mx-0">
              Get expert assistance for your FlyAsh Logistics Pro operations. Search our documentation or connect with a specialist.
            </p>
            <div className="relative max-w-lg mx-auto md:mx-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input 
                type="text" 
                placeholder="Search for help, features, or tutorials..." 
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="w-64 h-64 bg-blue-600 rounded-[3rem] rotate-6 flex items-center justify-center shadow-2xl shadow-blue-500/50">
              <Headphones size={120} className="text-white -rotate-6" />
            </div>
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-slate-800 rounded-3xl flex items-center justify-center shadow-xl border border-slate-700">
              <MessageSquare size={40} className="text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 hover:scale-[1.02] transition-all cursor-pointer group">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
            <Mail size={28} />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Email Support</h3>
          <p className="text-slate-500 font-medium mb-4 text-sm leading-relaxed">Response within 2 hours for critical technical issues and portal access.</p>
          <span className="text-indigo-600 font-black text-xs uppercase tracking-widest flex items-center gap-2">
            help@flyashpro.com <ExternalLink size={14} />
          </span>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 hover:scale-[1.02] transition-all cursor-pointer group">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm">
            <Phone size={28} />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Priority Call</h3>
          <p className="text-slate-500 font-medium mb-4 text-sm leading-relaxed">Direct line for fleet owners and dispatch managers for urgent routing needs.</p>
          <span className="text-emerald-600 font-black text-xs uppercase tracking-widest flex items-center gap-2">
            +91 98765 43210 <ExternalLink size={14} />
          </span>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 hover:scale-[1.02] transition-all cursor-pointer group">
          <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-600 group-hover:text-white transition-colors shadow-sm">
            <Zap size={28} />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Live Chat</h3>
          <p className="text-slate-500 font-medium mb-4 text-sm leading-relaxed">Instant messaging for drivers and plant staff using the mobile portal.</p>
          <span className="text-orange-600 font-black text-xs uppercase tracking-widest flex items-center gap-2">
            START SESSION <ExternalLink size={14} />
          </span>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6 text-center lg:text-left">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <div 
                  key={index} 
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm"
                >
                  <button 
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-all group"
                  >
                    <span className="font-bold text-slate-900">{faq.question}</span>
                    {openFaq === index ? (
                      <ChevronUp size={20} className="text-blue-600" />
                    ) : (
                      <ChevronDown size={20} className="text-slate-400 group-hover:text-blue-600" />
                    )}
                  </button>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 pb-5 text-slate-600 font-medium leading-relaxed italic"
                      >
                        {faq.answer}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 font-bold">No matching results for "{searchQuery}"</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-blue-600 font-black text-sm uppercase tracking-widest"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">System Status</h3>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="font-bold text-slate-700">Billing Engine</span>
              </div>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Operational</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="font-bold text-slate-700">GPS Tracking</span>
              </div>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Operational</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="font-bold text-slate-700">Accounting PDF</span>
              </div>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="font-bold text-slate-700">Mobile Portal</span>
              </div>
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">Regular Updates</span>
            </div>
            
            <div className="pt-2">
              <div className="bg-slate-900 p-6 rounded-2xl relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-white font-black text-lg mb-1 italic">V2.4.0</p>
                  <p className="text-slate-400 text-xs font-medium mb-4">Latest Professional Release</p>
                  <div className="flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase tracking-widest cursor-pointer group-hover:gap-3 transition-all">
                    View Changelog <ExternalLink size={12} />
                  </div>
                </div>
                <Zap size={80} className="absolute -bottom-4 -right-4 text-white/5 -rotate-12 group-hover:rotate-0 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Support Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm">
            <ShieldCheck size={24} className="text-blue-600" />
          </div>
          <div>
            <h4 className="font-black text-slate-900">Security Verified</h4>
            <p className="text-slate-500 text-xs font-medium">All sessions are encrypted and monitored for your safety.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 lg:justify-end">
          <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm">
            <LifeBuoy size={24} className="text-blue-600" />
          </div>
          <div className="text-left">
            <h4 className="font-black text-slate-900">Help Documentations</h4>
            <p className="text-slate-500 text-xs font-medium">Access detailed manuals for every professional feature.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportView;
