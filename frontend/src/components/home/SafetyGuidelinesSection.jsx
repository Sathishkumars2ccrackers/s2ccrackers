import React from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const SafetyGuidelinesSection = () => {
  const dos = [
    'Always light crackers under adult supervision in open outdoor spaces.',
    'Use a long incense stick (agarbatti) or sparkler to light from an arm length.',
    'Keep a bucket of water, sand, and first-aid kit ready nearby.',
    'Wear comfortable cotton clothing and closed footwear.',
    'Dispose of used sparkler wires and burnt fireworks safely in a bucket of water.',
  ];

  const donts = [
    'Never light crackers while holding them in your hand or leaning over them.',
    'Never burst crackers near thatched houses, electric cables, or parked vehicles.',
    'Never attempt to relight a cracker that failed to ignite immediately.',
    'Avoid wearing synthetic, loose, or flowing nylon/silk garments.',
    'Never throw or aim fireworks at people, pets, or buildings.',
  ];

  return (
    <section className="py-16 bg-[#0f0a18] border-t border-festival-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Safety First • Festival of Lights</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Essential Fireworks Safety Precautions
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Celebrate a joyous, bright, and accident-free festival with your loved ones by adhering to these essential safety standards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* DO's Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-400 pb-3 border-b border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Safety Do's (செய்ய வேண்டியவை)</h3>
            </div>
            <ul className="space-y-3">
              {dos.map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* DONT's Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-rose-950/20 border border-rose-500/30 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400 pb-3 border-b border-rose-500/20">
              <XCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Safety Don'ts (செய்யக் கூடாதவை)</h3>
            </div>
            <ul className="space-y-3">
              {donts.map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                  <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/safety"
            className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1"
          >
            Read Complete Sivakasi Factory Safety Guide & First-Aid Instructions →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SafetyGuidelinesSection;
