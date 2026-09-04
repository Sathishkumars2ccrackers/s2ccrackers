import React from 'react';
import { Award, ShieldCheck, Truck, Sparkles, Heart, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-festival-dark py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>Sivakasi Factory Heritage</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white">About S2C Crackers</h1>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Bringing authentic, radiant, and safe fireworks directly from the heart of Sivakasi to thousands of homes across South India.
          </p>
        </div>

        {/* Story Card */}
        <div className="bg-festival-card border border-festival-border p-6 sm:p-10 rounded-3xl space-y-6 leading-relaxed text-slate-300 text-sm">
          <h2 className="text-xl font-bold text-white text-gold-gradient">
            Direct-to-Consumer Fireworks Innovation
          </h2>
          <p>
            Established in Sivakasi — the fireworks capital of India — <strong>S2C Crackers</strong> was founded with a singular mission: to eliminate traditional retail middlemen and supply genuine, fresh fireworks directly from manufacturing units to families at genuine factory wholesale prices.
          </p>
          <p>
            Every festival season, retail stores inflate cracker rates by 200% to 400%. At S2C Crackers, we believe festival celebrations should be affordable for every family without compromising on safety or product brilliance.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-festival-dark border border-festival-border text-center space-y-1">
              <span className="text-2xl font-black text-amber-400">100%</span>
              <p className="text-xs font-bold text-white">Authentic Sivakasi</p>
              <p className="text-[11px] text-slate-400">Direct factory manufacture</p>
            </div>
            <div className="p-4 rounded-2xl bg-festival-dark border border-festival-border text-center space-y-1">
              <span className="text-2xl font-black text-amber-400">80%</span>
              <p className="text-xs font-bold text-white">Direct Savings</p>
              <p className="text-[11px] text-slate-400">Wholesale price list</p>
            </div>
            <div className="p-4 rounded-2xl bg-festival-dark border border-festival-border text-center space-y-1">
              <span className="text-2xl font-black text-emerald-400">COD</span>
              <p className="text-xs font-bold text-white">Zero Risk Booking</p>
              <p className="text-[11px] text-slate-400">Cash on delivery only</p>
            </div>
          </div>
        </div>

        {/* Quality Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-festival-card border border-festival-border space-y-3">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Eco-Friendly & PESO Approved</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Our products are crafted following green fireworks formulations approved by CSIR-NEERI and PESO, ensuring low emissions and reduced decibel levels for kids.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-festival-card border border-festival-border space-y-3">
            <Truck className="w-8 h-8 text-amber-400" />
            <h3 className="text-base font-bold text-white">Heavy-Duty Safe Transport</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              We package every cracker box with moisture-barrier wrapping and shock-absorbing cartons, dispatched safely through licensed surface transport parcel services.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-red-950/80 via-festival-card to-amber-950/80 border border-amber-500/30 text-center space-y-4">
          <h3 className="text-xl font-bold text-white">Celebrate This Festival with Sivakasi's Finest Fireworks</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Join over 25,000+ satisfied families who trust S2C Crackers for their festival celebrations.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 text-slate-950 font-black text-sm rounded-full shadow-xl shadow-amber-950/50"
          >
            <span>Order Festival Crackers</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
