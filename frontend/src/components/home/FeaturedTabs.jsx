import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Gift, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../product/ProductCard';

const FeaturedTabs = ({ featured = [], bestSellers = [], allProducts = [] }) => {
  const [activeTab, setActiveTab] = useState('featured');

  const tabs = [
    { id: 'featured', label: 'Featured Crackers', icon: Sparkles },
    { id: 'bestsellers', label: 'Best Sellers', icon: Trophy },
    { id: 'giftboxes', label: 'Family Gift Combos', icon: Gift },
  ];

  let displayProducts = featured;
  if (activeTab === 'bestsellers') {
    displayProducts = bestSellers;
  } else if (activeTab === 'giftboxes') {
    displayProducts = allProducts.filter(
      (p) => p.category?.slug === 'gift-boxes' || p.name.toLowerCase().includes('box') || p.name.toLowerCase().includes('gift')
    );
    if (displayProducts.length === 0) displayProducts = featured;
  }

  return (
    <section className="py-16 bg-festival-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-extrabold uppercase tracking-widest mb-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Handpicked Festival Collections</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">
              Sivakasi's Most Loved Fireworks
            </h2>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center p-1.5 bg-festival-card border border-festival-border rounded-2xl overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-200' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Products Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {displayProducts.slice(0, 8).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* View All Button */}
        <div className="mt-12 text-center">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 hover:from-red-500 hover:to-orange-500 text-slate-950 font-black text-sm transition-all shadow-xl shadow-amber-950/40 transform hover:scale-105"
          >
            <span>View Complete Crackers Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedTabs;
