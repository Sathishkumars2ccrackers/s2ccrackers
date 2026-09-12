import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  Phone,
  Truck,
  ShieldCheck,
  Flame,
  Gift,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../utils/formatters';
import logoSvg from '../../assets/logo.svg';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItemsCount, cartSubtotal, openCart } = useCart();
  const { settings, deliveryMessage, festivalAnnouncement } = useSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'All Crackers', path: '/products' },
    { name: 'Gift Box Combos', path: '/products?category=deluxe-gift-boxes', highlight: true },
    { name: 'Sky Shots', path: '/products?category=multi-shot-sky-shots' },
    { name: 'Track Order', path: '/track-order' },
    { name: 'Safety Tips', path: '/safety' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300">
      {/* Top Festival Marquee Bar */}
      <div className="bg-gradient-to-r from-red-950 via-amber-950 to-orange-950 border-b border-amber-500/20 text-xs py-1.5 px-4 text-amber-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <span className="bg-red-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
              Festival Sale 2026
            </span>
            <span className="text-amber-100/90 font-medium truncate">
              {festivalAnnouncement || '💥 Genuine Sivakasi Direct Factory Prices! Up to 80% OFF • Door Delivery Available Across India!'}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-5 text-slate-300 text-xs flex-shrink-0">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Truck className="w-3.5 h-3.5" />
              <span>{deliveryMessage || 'Door Delivery Available'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Genuine Sivakasi</span>
            </div>
            <a
              href="tel:+919944476516"
              className="flex items-center gap-1 text-slate-200 hover:text-amber-400 transition-colors"
            >
              <Phone className="w-3 h-3 text-amber-400" />
              <span>+91 99444 76516</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div
        className={`glass-nav transition-all duration-300 ${
          isScrolled ? 'py-2.5 shadow-2xl bg-festival-dark/95' : 'py-3.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
            <img
              src={logoSvg}
              alt="S2C Crackers - Sivakasi"
              className="h-9 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Desktop Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:flex flex-1 max-w-md relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sparklers, flower pots, 1000 wala, sky shots..."
              className="w-full bg-festival-card/90 border border-festival-border rounded-full pl-11 pr-4 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-full transition-colors"
            >
              Search
            </button>
          </form>

          {/* Right Action Icons: Track Order, Cart Drawer */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Track Order Direct Button (Desktop Header) */}
            <Link
              to="/track-order"
              className="hidden sm:flex items-center gap-1.5 py-1.5 px-3.5 rounded-full bg-festival-card hover:bg-festival-cardHover border border-amber-500/30 hover:border-amber-400 text-xs font-bold text-amber-300 hover:text-white transition-all shadow-md"
            >
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>Track Order</span>
            </Link>

            {/* Cart Drawer Trigger */}
            <motion.button
              onClick={openCart}
              whileTap={{ scale: 0.95 }}
              className="relative flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white px-3 sm:px-4 py-2 rounded-full font-bold text-sm shadow-lg shadow-red-950/50 border border-amber-400/30 transition-all"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                {totalItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 sm:w-5 h-4 sm:h-5 bg-white text-red-700 font-extrabold text-[10px] sm:text-xs rounded-full flex items-center justify-center shadow-md animate-bounce">
                    {totalItemsCount}
                  </span>
                )}
              </div>
              <div className="hidden md:flex flex-col text-left leading-tight">
                <span className="text-[10px] text-amber-100 font-normal uppercase tracking-wider">Cart Total</span>
                <span className="text-xs font-bold text-white">{formatCurrency(cartSubtotal)}</span>
              </div>
            </motion.button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Links Strip */}
        <nav className="hidden lg:block border-t border-festival-border/50 mt-2.5 pt-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <ul className="flex items-center space-x-6 text-sm font-medium">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className={`transition-colors py-1 flex items-center gap-1.5 ${
                        isActive
                          ? 'text-amber-400 font-bold border-b-2 border-amber-400'
                          : link.highlight
                          ? 'text-amber-300 font-bold hover:text-amber-200'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {link.highlight && <Gift className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
                      {link.name}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-3 text-xs text-amber-400 font-medium">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 animate-pulse" />
                Door Delivery Available Across India
              </span>
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Search Bar & Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-festival-card border-b border-festival-border px-4 py-4 space-y-4"
          >
            {/* Mobile Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Sivakasi crackers..."
                className="w-full bg-festival-dark border border-festival-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </form>

            {/* Navigation Links */}
            <ul className="space-y-1 pt-2 border-t border-festival-border/50 text-sm font-medium">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="block px-3 py-2 rounded-lg text-slate-200 hover:bg-white/10 hover:text-amber-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
