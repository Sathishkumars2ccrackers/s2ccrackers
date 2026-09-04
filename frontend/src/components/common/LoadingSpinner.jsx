import React from 'react';
import { motion } from 'framer-motion';
import logoIconSvg from '../../assets/logo-icon.svg';

const LoadingSpinner = ({ text = 'Loading Authentic Sivakasi Fireworks...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 space-y-4">
      <div className="relative w-20 h-20 flex items-center justify-center">
        {/* Pulsing Backlight Glow */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 via-red-600/20 to-purple-600/20 blur-xl"
          animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.4, 0.8, 0.4] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        />

        {/* Outer Ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-t-amber-400 border-r-rose-500 border-b-orange-500 border-l-transparent"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
        />

        {/* Inner Counter Ring */}
        <motion.div
          className="absolute inset-2.5 rounded-full border border-t-transparent border-r-amber-300 border-b-rose-400 border-l-yellow-300"
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        />

        {/* Official S2C Logo Emblem */}
        <motion.img
          src={logoIconSvg}
          alt="S2C Logo"
          className="w-9 h-9 object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        />
      </div>
      {text && (
        <p className="text-xs sm:text-sm font-semibold tracking-wide text-amber-200/90 animate-pulse text-center">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
