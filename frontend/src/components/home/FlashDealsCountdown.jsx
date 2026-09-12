import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Flame, ArrowRight, Sparkles } from 'lucide-react';
import ProductCard from '../product/ProductCard';

const FlashDealsCountdown = ({ deals = [] }) => {
  // Festival Countdown Target (simulate upcoming festival)
  const calculateTimeLeft = () => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 18);
    targetDate.setHours(23, 59, 59, 999);

    const difference = +targetDate - +new Date();
    let timeLeft = {
      days: 18,
      hours: 14,
      minutes: 42,
      seconds: 19,
    };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!deals || deals.length === 0) return null;

  return (
    <section className="py-16 bg-gradient-to-b from-[#130a20] via-festival-card/80 to-festival-dark border-y border-amber-500/20 relative overflow-hidden">
      {/* Ambient Red & Gold Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header with Live Ticker */}
        <div className="bg-gradient-to-r from-red-950/90 via-festival-card to-amber-950/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 mb-10 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-black uppercase tracking-wider">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
              <span>LIMITED TIME FESTIVAL FLASH OFFER</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Sivakasi Early Bird Booking Discount
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
              Book now to lock in factory direct wholesale rates before festive season price surge. Door Delivery Available across India!
            </p>
          </div>

          {/* Countdown Clock Units */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <div className="flex flex-col items-center">
              <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-festival-dark border border-amber-500/40 shadow-inner flex items-center justify-center text-xl sm:text-2xl font-black text-amber-400 font-mono">
                {String(timeLeft.days).padStart(2, '0')}
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Days</span>
            </div>
            <span className="text-amber-500 font-bold text-xl pb-4">:</span>
            <div className="flex flex-col items-center">
              <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-festival-dark border border-amber-500/40 shadow-inner flex items-center justify-center text-xl sm:text-2xl font-black text-amber-400 font-mono">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Hours</span>
            </div>
            <span className="text-amber-500 font-bold text-xl pb-4">:</span>
            <div className="flex flex-col items-center">
              <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-festival-dark border border-amber-500/40 shadow-inner flex items-center justify-center text-xl sm:text-2xl font-black text-amber-400 font-mono">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Mins</span>
            </div>
            <span className="text-amber-500 font-bold text-xl pb-4">:</span>
            <div className="flex flex-col items-center">
              <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-festival-dark border border-red-500/50 shadow-inner flex items-center justify-center text-xl sm:text-2xl font-black text-red-400 font-mono animate-pulse">
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Secs</span>
            </div>
          </div>
        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {deals.slice(0, 4).map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-festival-card hover:bg-festival-cardHover border border-amber-500/40 text-amber-300 hover:text-white font-bold text-sm transition-all shadow-lg shadow-amber-950/30"
          >
            <span>View All Festival Discount Deals</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FlashDealsCountdown;
