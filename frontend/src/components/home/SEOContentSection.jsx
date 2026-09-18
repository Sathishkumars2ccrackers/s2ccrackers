import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Sparkles, Award, Factory, ArrowRight, Percent, PackageCheck } from 'lucide-react';

const SEOContentSection = () => {
  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 border-t border-festival-border bg-slate-950/40">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Main Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-wider">
            <Factory className="w-3.5 h-3.5" />
            <span>Direct from Sivakasi Fireworks Capital</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            Buy Authentic Sivakasi Crackers Online at Direct Factory Prices
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Welcome to <strong>S2C Crackers</strong>, your trusted online destination for 100% genuine Sivakasi fireworks. 
            Enjoy wholesale festival rates with up to <strong>80% direct factory discount</strong> and safe door delivery across India.
          </p>
        </div>

        {/* 4 Key Pillar Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-festival-card border border-festival-border hover:border-amber-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500/20 to-red-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Factory className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Sivakasi Factory Direct</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Eliminate middleman markups! We manufacture and source directly from Sivakasi, Tamil Nadu, providing authentic quality at true wholesale prices.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-festival-card border border-festival-border hover:border-amber-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Percent className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">80% Flat Festive Discount</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Explore our transparent <strong>Crackers Price List 2026</strong>. Save big with additional tiered slab discounts on bulk and family festival orders.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-festival-card border border-festival-border hover:border-amber-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Door Delivery Across India</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Seamless dispatch to Tamil Nadu, Karnataka, Andhra Pradesh, Telangana, Maharashtra, Kerala, and all major cities and towns nationwide.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-festival-card border border-festival-border hover:border-amber-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Certified Green Fireworks</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              100% compliant with PESO and environmental safety norms. Safe, reduced-emission green crackers for joy-filled family Diwali celebrations.
            </p>
          </div>
        </div>

        {/* In-Depth SEO Rich Explanatory Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
          <div className="bg-festival-card/60 border border-festival-border rounded-2xl p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span>Online Crackers Shopping Made Simple & Secure</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Shopping for Diwali crackers online shouldn't be complicated or stressful. At S2C Crackers, we provide an intuitive catalog ordering experience with zero hidden costs. Browse extensive collections of single and double sound crackers, electric sparklers, giant flower pots, spinning ground chakkars, and multi-shot aerial sky repeaters.
            </p>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              With our fast direct booking system, you can select items, submit your delivery details, and receive instant <strong>1-Click WhatsApp Order Confirmation</strong> with live tracking.
            </p>
          </div>

          <div className="bg-festival-card/60 border border-festival-border rounded-2xl p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span>Diwali Gift Box Combos & Custom Family Assortments</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Looking for curated gift boxes? S2C Crackers offers exclusive <strong>Gift Box Crackers</strong> ranging from budget-friendly family packs to premium deluxe mega hampers. Each gift box contains handpicked festive fireworks suitable for both kids and adults.
            </p>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Whether you are organizing a corporate festival distribution, an apartment complex celebration, or a cozy home Diwali pooja, our factory wholesale pricing guarantees maximum value for your festival budget.
            </p>
          </div>
        </div>

        {/* Quick Category Directory Links for Crawlers & Users */}
        <div className="p-6 rounded-2xl bg-amber-950/20 border border-amber-500/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-500/20">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
              Popular Sivakasi Crackers Categories
            </h4>
            <Link
              to="/products"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 group"
            >
              <span>View Full 2026 Price List</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/products?category=sparklers"
              className="px-3 py-1.5 rounded-xl bg-festival-dark border border-festival-border text-xs text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors"
            >
              Sparklers (Color & Electric)
            </Link>
            <Link
              to="/products?category=flower-pots"
              className="px-3 py-1.5 rounded-xl bg-festival-dark border border-festival-border text-xs text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors"
            >
              Flower Pots (Special & Deluxe)
            </Link>
            <Link
              to="/products?category=ground-chakkars"
              className="px-3 py-1.5 rounded-xl bg-festival-dark border border-festival-border text-xs text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors"
            >
              Ground Chakkars (Spinners)
            </Link>
            <Link
              to="/products?category=multi-shot-sky-shots"
              className="px-3 py-1.5 rounded-xl bg-festival-dark border border-festival-border text-xs text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors"
            >
              Multi-Shot Sky Shots (12 to 240 Shots)
            </Link>
            <Link
              to="/products?category=sound-crackers"
              className="px-3 py-1.5 rounded-xl bg-festival-dark border border-festival-border text-xs text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors"
            >
              Sound Crackers (Garlands & Walas)
            </Link>
            <Link
              to="/products?category=deluxe-gift-boxes"
              className="px-3 py-1.5 rounded-xl bg-festival-dark border border-festival-border text-xs text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors"
            >
              Deluxe Gift Box Hampers
            </Link>
            <Link
              to="/products?category=kids-special"
              className="px-3 py-1.5 rounded-xl bg-festival-dark border border-festival-border text-xs text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors"
            >
              Kids Novelties & Pop-Pops
            </Link>
            <Link
              to="/safety"
              className="px-3 py-1.5 rounded-xl bg-festival-dark border border-festival-border text-xs text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors"
            >
              Cracker Safety & Handling Tips
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SEOContentSection;
