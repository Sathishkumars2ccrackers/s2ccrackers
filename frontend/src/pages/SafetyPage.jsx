import React from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Flame, Phone, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const SafetyPage = () => {
  return (
    <div className="min-h-screen bg-festival-dark py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sivakasi Safety Standards</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Fireworks Safety Guidelines & First Aid</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            At <strong>S2C Crackers</strong>, safety is our utmost priority. Follow these government and manufacturer safety recommendations for a safe celebration.
          </p>
        </div>

        {/* Detailed Safety Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* What to DO */}
          <div className="p-6 sm:p-8 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 space-y-5">
            <div className="flex items-center gap-3 text-emerald-400 pb-3 border-b border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
              <h2 className="text-lg font-bold text-white">What You MUST Do (Do's)</h2>
            </div>
            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-1" />
                <span><strong>Open Grounds:</strong> Always burst crackers in an open field or clear road free from overhead power cables and dry trees.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-1" />
                <span><strong>Adult Supervision:</strong> Children must always be accompanied by an adult when lighting sparklers or novelties.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-1" />
                <span><strong>Agarbatti Lighting:</strong> Light fireworks from an arm length using a long incense stick (agarbatti) rather than matches or lighters.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-1" />
                <span><strong>Water Readiness:</strong> Keep two buckets of water and sand nearby for emergency extinguishing and discarding burnt sparklers.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-1" />
                <span><strong>Proper Footwear:</strong> Wear closed leather or canvas footwear and close-fitting cotton clothing.</span>
              </li>
            </ul>
          </div>

          {/* What NOT to DO */}
          <div className="p-6 sm:p-8 rounded-3xl bg-rose-950/20 border border-rose-500/30 space-y-5">
            <div className="flex items-center gap-3 text-rose-400 pb-3 border-b border-rose-500/20">
              <XCircle className="w-6 h-6" />
              <h2 className="text-lg font-bold text-white">What You MUST AVOID (Don'ts)</h2>
            </div>
            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-1" />
                <span><strong>Never Hold in Hand:</strong> Never attempt to hold exploding crackers, bombs, or flower pots in your hand while lighting.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-1" />
                <span><strong>Do Not Relight Duds:</strong> If a firework fails to ignite, wait 15 minutes and pour a bucket of water over it. Never inspect closely.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-1" />
                <span><strong>Avoid Synthetic Wear:</strong> Do not wear nylon, rayon, or flowing silk clothing that can catch fire quickly.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-1" />
                <span><strong>No Indoor Fireworks:</strong> Never burst fireworks inside rooms, balconies, staircases, or confined spaces.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-1" />
                <span><strong>Pet & Animal Care:</strong> Keep household pets indoors with doors closed during festival hours to protect sensitive ears.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Emergency First Aid Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-festival-card border border-amber-500/30 space-y-4">
          <div className="flex items-center gap-2.5 text-amber-400 font-bold text-base">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-white">Emergency Burn First Aid Guidance</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="p-4 rounded-xl bg-festival-dark border border-festival-border space-y-1">
              <strong className="text-amber-300 block text-sm">1. Cool with Water</strong>
              <p>Immediately hold the burned area under clean, gentle running cold water for at least 10 to 15 minutes.</p>
            </div>
            <div className="p-4 rounded-xl bg-festival-dark border border-festival-border space-y-1">
              <strong className="text-amber-300 block text-sm">2. Do Not Apply Ointment</strong>
              <p>Do not apply ice directly, butter, ink, or oils on fresh burns. Cover loosely with sterile dry gauze.</p>
            </div>
            <div className="p-4 rounded-xl bg-festival-dark border border-festival-border space-y-1">
              <strong className="text-amber-300 block text-sm">3. Seek Medical Attention</strong>
              <p>For eye injuries or severe blistering, consult a doctor or emergency medical service immediately.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyPage;
