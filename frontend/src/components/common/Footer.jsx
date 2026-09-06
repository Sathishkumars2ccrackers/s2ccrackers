import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, MessageCircle, Shield, Award, Truck, Lock } from 'lucide-react';
import logoSvg from '../../assets/logo.svg';

const Footer = () => {
  return (
    <footer className="bg-[#08040d] border-t border-festival-border text-slate-400 text-sm mt-20 relative overflow-hidden">
      {/* Top Gold Border Accent */}
      <div className="h-1 bg-gradient-to-r from-red-600 via-amber-500 to-orange-600" />

      {/* Trust Highlights Strip */}
      <div className="border-b border-festival-border/60 py-8 bg-festival-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">100% Genuine Sivakasi</h4>
              <p className="text-xs text-slate-400">Direct from Sivakasi manufacturing units</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Pan-South India Shipping</h4>
              <p className="text-xs text-slate-400">Safe, regulated road transport dispatch</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Cash On Delivery (COD)</h4>
              <p className="text-xs text-slate-400">Pay safely after package delivery</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">WhatsApp Quick Support</h4>
              <p className="text-xs text-slate-400">Instant order confirmation & support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Brand Column */}
        <div className="lg:col-span-2 space-y-4">
          <Link to="/">
            <img src={logoSvg} alt="S2C Crackers" className="h-12 w-auto object-contain" />
          </Link>
          <p className="text-xs text-slate-400 leading-relaxed pr-6">
            <strong>S2C Crackers</strong> is Sivakasi's premier fireworks brand offering factory-direct pricing for Diwali, Weddings, New Year, and celebrations. We guarantee fresh, premium grade fireworks crafted with stringent safety standards.
          </p>
          <div className="pt-2 text-xs space-y-2 text-slate-300">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>124/B, Sivakasi Main Road, Viswanatham, Sivakasi, Tamil Nadu - 626123</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <a href="tel:+919944476516" className="hover:text-amber-400 transition-colors">
                +91 99444 76516
              </a>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <a href="mailto:s2ccrackers@gmail.com" className="hover:text-amber-400 transition-colors">
                s2ccrackers@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <h4 className="text-white font-bold text-sm tracking-wider uppercase border-b border-festival-border pb-2">
            Top Categories
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/products?category=sparklers" className="hover:text-amber-400 transition-colors">
                Sparklers (கம்பி மத்தாப்பு)
              </Link>
            </li>
            <li>
              <Link to="/products?category=ground-chakkars" className="hover:text-amber-400 transition-colors">
                Ground Chakkars (தரை சக்கரம்)
              </Link>
            </li>
            <li>
              <Link to="/products?category=flower-pots" className="hover:text-amber-400 transition-colors">
                Flower Pots (பூந்தொட்டி)
              </Link>
            </li>
            <li>
              <Link to="/products?category=sky-shots" className="hover:text-amber-400 transition-colors">
                Multi-Shot Sky Shots (வானவெடி)
              </Link>
            </li>
            <li>
              <Link to="/products?category=sound-crackers" className="hover:text-amber-400 transition-colors">
                1000 Wala & Sound Crackers
              </Link>
            </li>
            <li>
              <Link to="/products?category=gift-boxes" className="hover:text-amber-400 font-bold text-amber-300 transition-colors">
                Festival Gift Box Combos
              </Link>
            </li>
          </ul>
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          <h4 className="text-white font-bold text-sm tracking-wider uppercase border-b border-festival-border pb-2">
            Customer Care
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/track-order" className="hover:text-amber-400 transition-colors">
                Track Order Status
              </Link>
            </li>
            <li>
              <Link to="/safety" className="hover:text-amber-400 transition-colors">
                Safety Guidelines & Precautions
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-amber-400 transition-colors">
                About S2C Crackers Sivakasi
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-amber-400 transition-colors">
                Contact & Factory Location
              </Link>
            </li>
            <li>
              <Link to="/admin/login" className="hover:text-amber-400 transition-colors flex items-center gap-1 text-slate-500">
                <Lock className="w-3 h-3" />
                Admin Portal Login
              </Link>
            </li>
          </ul>
        </div>

        {/* Safety Disclaimer */}
        <div className="space-y-3">
          <h4 className="text-white font-bold text-sm tracking-wider uppercase border-b border-festival-border pb-2">
            Safety First
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Fireworks must always be handled under adult supervision. Keep water buckets ready. Do not burst crackers in enclosed or prohibited zones.
          </p>
          <div className="bg-festival-dark/80 p-3 rounded-xl border border-amber-500/20 text-[11px] text-amber-300/90">
            ⭐ <strong>Green Fireworks Certified:</strong> Low emission formulations compliant with Supreme Court & PESO guidelines.
          </div>
        </div>
      </div>

      {/* Bottom Copyright Strip */}
      <div className="border-t border-festival-border/50 py-4 bg-[#050308]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            © {new Date().getFullYear()} S2C Crackers (www.s2ccrackers.com). All Rights Reserved. Sivakasi, Tamil Nadu.
          </div>
          <div className="flex items-center gap-4">
            <Link to="/safety" className="hover:text-slate-400">Safety Policy</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-slate-400">Terms & COD Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
