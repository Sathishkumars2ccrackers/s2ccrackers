import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck, Truck, ChevronLeft, ChevronRight, Gift, Flame } from 'lucide-react';
import FireworksCanvas from '../common/FireworksCanvas';

const DEFAULT_SLIDES = [
  {
    title: 'Authentic Sivakasi Crackers Online',
    subtitle: 'Direct from Factory • 100% Genuine Fireworks • Up to 80% Festival Discount',
    badge: 'DIWALI & FESTIVAL MEGA SALE 2026',
    discountTag: 'Flat 80% OFF Sivakasi Wholesale Prices',
    buttonText: 'Shop All Crackers',
    linkUrl: '/products',
    secondaryButtonText: 'Explore Gift Boxes',
    secondaryLinkUrl: '/products?category=gift-boxes',
    bgImage: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1920&auto=format&fit=crop&q=80',
  },
  {
    title: 'Curated Family Gift Box Combos',
    subtitle: 'Packed with 25 to 55 authentic Sivakasi cracker varieties for joyous celebrations.',
    badge: 'MOST POPULAR FESTIVAL COMBO',
    discountTag: 'Combos Starting from ₹999 Only',
    buttonText: 'View Gift Boxes',
    linkUrl: '/products?category=gift-boxes',
    secondaryButtonText: 'View All Deals',
    secondaryLinkUrl: '/products',
    bgImage: 'https://images.unsplash.com/photo-1533230807127-716675e20531?w=1920&auto=format&fit=crop&q=80',
  },
  {
    title: 'Sky Shots & Night Spectaculars',
    subtitle: '12, 30, 60 & 120 Continuous Multi-Shot Aerial Displays with Dazzling Golden Brocades.',
    badge: 'GRAND NIGHT SHOW',
    discountTag: 'Multi-Shot Cakes from ₹380',
    buttonText: 'Explore Sky Shots',
    linkUrl: '/products?category=sky-shots',
    secondaryButtonText: 'Shop All Crackers',
    secondaryLinkUrl: '/products',
    bgImage: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=1920&auto=format&fit=crop&q=80',
  },
];

const HeroSlider = ({ banners = [] }) => {
  const slides = banners && banners.length > 0 ? banners : DEFAULT_SLIDES;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[current] || DEFAULT_SLIDES[0];

  return (
    <div className="relative w-full min-h-[540px] sm:min-h-[620px] bg-gradient-to-b from-[#180d26] via-[#0d0714] to-[#0d0814] overflow-hidden flex items-center">
      {/* Background Visual Fireworks Canvas */}
      <FireworksCanvas className="absolute inset-0 z-0 pointer-events-none opacity-80" autoLaunch={true} />

      {/* Slide Background Image with Dark Vignette Gradient */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.35, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${slide.imageUrl || slide.bgImage || DEFAULT_SLIDES[0].bgImage})`,
            }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-festival-dark via-festival-dark/80 to-transparent z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-festival-dark via-transparent to-black/60 z-0" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-2xl space-y-6">
          {/* Badge */}
          <motion.div
            key={`badge-${current}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/80 border border-red-500/40 text-red-200 text-xs font-extrabold tracking-wide uppercase shadow-lg shadow-red-950/50 backdrop-blur-md"
          >
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
            <span>{slide.badge || 'MEGA SIVAKASI FESTIVAL SALE'}</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            key={`title-${current}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-lg"
          >
            {slide.title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            key={`sub-${current}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-200 font-normal leading-relaxed drop-shadow"
          >
            {slide.subtitle}
          </motion.p>

          {/* Discount Pill */}
          {slide.discountTag && (
            <motion.div
              key={`tag-${current}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="inline-block"
            >
              <div className="shimmer-badge px-4 py-1.5 rounded-xl text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>{slide.discountTag}</span>
              </div>
            </motion.div>
          )}

          {/* CTA Buttons */}
          <motion.div
            key={`cta-${current}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-3.5 pt-2"
          >
            <Link
              to={slide.linkUrl || '/products'}
              className="px-7 py-4 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 hover:from-red-500 hover:to-orange-500 text-slate-950 font-black text-sm sm:text-base shadow-2xl shadow-amber-950/60 transition-all transform hover:scale-105 flex items-center gap-2 border border-amber-300/40"
            >
              <span>{slide.buttonText || 'Shop Crackers Now'}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              to={slide.secondaryLinkUrl || '/products?category=gift-boxes'}
              className="px-6 py-4 rounded-full bg-festival-card/90 hover:bg-festival-cardHover text-white font-bold text-sm sm:text-base border border-amber-500/30 hover:border-amber-400 transition-all flex items-center gap-2 backdrop-blur-md"
            >
              <Gift className="w-4 h-4 text-amber-400" />
              <span>{slide.secondaryButtonText || 'Family Gift Boxes'}</span>
            </Link>
          </motion.div>

          {/* Trust points */}
          <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-300 font-medium">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Cash On Delivery</span>
            </div>
            <div className="flex items-center gap-2 text-amber-400">
              <Truck className="w-4 h-4" />
              <span>Direct Factory Dispatch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slider Controls */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
          <button
            onClick={() => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)}
            className="p-2 rounded-full bg-black/60 hover:bg-amber-500 hover:text-black text-white border border-white/20 transition-colors backdrop-blur-sm"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 px-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${
                  i === current ? 'w-6 bg-amber-400' : 'w-2 bg-white/40'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() => setCurrent((prev) => (prev + 1) % slides.length)}
            className="p-2 rounded-full bg-black/60 hover:bg-amber-500 hover:text-black text-white border border-white/20 transition-colors backdrop-blur-sm"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default HeroSlider;
