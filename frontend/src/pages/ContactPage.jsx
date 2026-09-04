import React, { useState } from 'react';
import { MapPin, Phone, Mail, MessageCircle, Clock, Send, CheckCircle2 } from 'lucide-react';
import { createWhatsAppGeneralChatUrl } from '../utils/whatsappHelper';

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // Prepare WhatsApp message for instant inquiry
    const whatsappMsg = `Hello S2C Crackers,\n\nName: ${formData.name}\nPhone: ${formData.phone}\nEmail: ${formData.email}\nInquiry: ${formData.message}`;
    const url = `https://wa.me/919442187654?text=${encodeURIComponent(whatsappMsg)}`;
    window.open(url, '_blank');
  };

  const whatsappChatUrl = createWhatsAppGeneralChatUrl('919442187654');

  return (
    <div className="min-h-screen bg-festival-dark py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <MessageCircle className="w-4 h-4" />
            <span>Customer Support & Factory Outlet</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white">Contact S2C Crackers</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Have questions about festival bulk discounts, wholesale supply, or dispatch status? Reach our Sivakasi factory customer team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Details & Info Cards */}
          <div className="space-y-4">
            <div className="p-6 rounded-3xl bg-festival-card border border-festival-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Factory & Dispatch Hub</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                124/B, Sivakasi Main Road, Viswanatham, Sivakasi, Tamil Nadu - 626123
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-festival-card border border-festival-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Direct WhatsApp Support</h3>
              <p className="text-xs text-slate-300">Fastest response for order booking & confirmations.</p>
              <a
                href={whatsappChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs font-bold text-emerald-400 hover:text-emerald-300"
              >
                +91 94421 87654 (Click to Chat) →
              </a>
            </div>

            <div className="p-6 rounded-3xl bg-festival-card border border-festival-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Customer Helpline</h3>
              <p className="text-xs text-slate-300">Monday to Sunday (8:00 AM to 10:00 PM during festival season)</p>
              <a href="tel:+919442187654" className="inline-block text-xs font-bold text-amber-400 hover:text-amber-300">
                +91 94421 87654
              </a>
            </div>
          </div>

          {/* Contact Inquiry Form */}
          <div className="lg:col-span-2 bg-festival-card border border-festival-border p-6 sm:p-10 rounded-3xl space-y-6">
            <h2 className="text-xl font-bold text-white pb-3 border-b border-festival-border">
              Send us a Message
            </h2>

            {submitted ? (
              <div className="p-8 text-center space-y-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-lg font-bold text-white">Thank You for Connecting!</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Your message has been received. Our Sivakasi factory team will contact you shortly on your provided phone number or WhatsApp.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2 bg-festival-cardHover border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Your Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Anand Kumar"
                      className="w-full bg-festival-dark border border-festival-border rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Phone Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '') })}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-festival-dark border border-festival-border rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. yourname@gmail.com"
                    className="w-full bg-festival-dark border border-festival-border rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Your Message / Festival Bulk Order Inquiry <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about the crackers or combo gift boxes you need..."
                    className="w-full bg-festival-dark border border-festival-border rounded-xl p-4 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 hover:from-red-500 hover:to-orange-500 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-amber-950/40 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message via WhatsApp Support</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
