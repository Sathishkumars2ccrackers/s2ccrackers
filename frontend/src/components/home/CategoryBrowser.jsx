import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  RotateCw,
  Flame,
  Rocket,
  Zap,
  Volume2,
  Smile,
  Gift,
  ArrowRight,
} from 'lucide-react';

const CATEGORY_META = {
  sparklers: {
    name: 'Sparklers',
    sub: 'கம்பி மத்தாப்பு',
    icon: Sparkles,
    color: 'from-amber-500 to-yellow-600',
    desc: 'Electric & color sparklers for whole family',
  },
  'ground-chakkars': {
    name: 'Ground Chakkars',
    sub: 'தரை சக்கரம்',
    icon: RotateCw,
    color: 'from-orange-500 to-amber-600',
    desc: 'Whirling golden and multicolor spinning wheels',
  },
  'flower-pots': {
    name: 'Flower Pots',
    sub: 'பூந்தொட்டி',
    icon: Flame,
    color: 'from-red-600 to-orange-600',
    desc: 'Majestic fountain showers of gold and colors',
  },
  'rockets-missiles': {
    name: 'Rockets & Missiles',
    sub: 'ராக்கெட்',
    icon: Rocket,
    color: 'from-purple-600 to-indigo-600',
    desc: 'High altitude whistling sky rockets',
  },
  'multi-shot-sky-shots': {
    name: 'Multi-Shot Sky Shots',
    sub: 'வானவெடி',
    icon: Zap,
    color: 'from-pink-600 to-rose-600',
    desc: '12 to 120 continuous aerial multishot cakes',
  },
  'sound-crackers': {
    name: 'Sound Crackers',
    sub: 'சரவெடி & அணுகுண்டு',
    icon: Volume2,
    color: 'from-red-700 to-red-950',
    desc: '1000 wala, hydro bombs & traditional sounds',
  },
  'kids-special': {
    name: 'Kids Special',
    sub: 'குழந்தைகள் பட்டாசு',
    icon: Smile,
    color: 'from-emerald-500 to-teal-600',
    desc: 'Safe pop pops, snakes, and peacock shows',
  },
  'deluxe-gift-boxes': {
    name: 'Deluxe Gift Boxes',
    sub: 'ஸ்பெஷல் கிப்ட் பாக்ஸ்',
    icon: Gift,
    color: 'from-amber-400 to-orange-500',
    desc: 'All-in-one 25 to 55 item family combo boxes',
  },
};

const CategoryBrowser = ({ categories = [] }) => {
  return (
    <section className="py-16 bg-festival-dark relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-extrabold uppercase tracking-widest mb-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Explore Sivakasi Fireworks</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">
              Shop By Cracker Category
            </h2>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <span>View All Categories & Crackers</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Object.entries(CATEGORY_META).map(([slug, meta], index) => {
            const IconComponent = meta.icon;
            return (
              <motion.div
                key={slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className="h-full"
              >
                <Link
                  to={`/products?category=${slug}`}
                  onClick={() => console.log(`[Category Browser] Clicked Category: "${meta.name}" (Slug: "${slug}")`)}
                  className="block h-full p-5 rounded-2xl bg-festival-card border border-festival-border hover:border-amber-500/50 transition-all duration-300 group shadow-lg hover:shadow-2xl hover:shadow-amber-950/20 flex flex-col justify-between cursor-pointer select-none"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-slate-950 shadow-md group-hover:scale-110 transition-transform duration-300`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold text-amber-400/80 group-hover:text-amber-300 flex items-center gap-1">
                      Explore <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                      {meta.name}
                    </h3>
                    <p className="text-xs text-amber-400/90 font-medium mt-0.5">{meta.sub}</p>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{meta.desc}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryBrowser;
