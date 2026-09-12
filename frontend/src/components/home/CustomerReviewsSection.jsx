import React from 'react';
import { Star, ShieldCheck, Quote } from 'lucide-react';

const REVIEWS = [
  {
    name: 'Karthik Subramanian',
    city: 'Anna Nagar, Chennai',
    rating: 5,
    date: 'Diwali Celebration',
    review:
      'Super fresh Sivakasi crackers! The 38-items Gold Gift Box was extraordinary and every single item burst perfectly with no misfires. The door delivery service gave complete peace of mind.',
    product: 'S2C Gold Festival Box (38 Items)',
  },
  {
    name: 'Priya & Vignesh',
    city: 'Koramangala, Bangalore',
    rating: 5,
    date: 'Family Festival Order',
    review:
      'We ordered 30-shot sky shots and electric sparklers for our apartment celebration. The WhatsApp order confirmation was smooth and delivery arrived 3 days before festival. Highly recommended!',
    product: '30 Shots Mega Aerial Spectacular',
  },
  {
    name: 'Murugan Rajendran',
    city: 'K.K. Nagar, Madurai',
    rating: 5,
    date: 'Wedding & Festival',
    review:
      'Direct Sivakasi factory prices are 100% genuine! In local retail stores prices are 3x higher. Packaging was safe in heavy-duty cardboard with moisture protection.',
    product: '1000 Wala Red Garland + Flower Pots',
  },
  {
    name: 'Ananya Venkatesh',
    city: 'RS Puram, Coimbatore',
    rating: 5,
    date: 'Diwali Orders',
    review:
      'The kids special magic pop pops and peacock fountains were completely safe and smoke-free. The tracking feature showed exact dispatch status from Sivakasi factory.',
    product: 'Kids Novelty Assorted Pack',
  },
];

const CustomerReviewsSection = () => {
  return (
    <section className="py-16 bg-festival-dark border-t border-festival-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>Verified Customer Reviews</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Trusted by 25,000+ Happy Families
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            See what customers across South India say about S2C Crackers factory-direct quality, safe packing, and Door Delivery service.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {REVIEWS.map((item, index) => (
            <div
              key={index}
              className="p-5 rounded-2xl bg-festival-card border border-festival-border hover:border-amber-500/40 shadow-lg flex flex-col justify-between space-y-4 transition-all duration-300 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <Quote className="w-5 h-5 text-slate-600 group-hover:text-amber-500/40 transition-colors" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">"{item.review}"</p>
              </div>

              <div className="pt-3 border-t border-festival-border/60">
                <h4 className="text-xs font-bold text-white">{item.name}</h4>
                <p className="text-[11px] text-amber-400 font-medium">{item.city}</p>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified Purchase • {item.product}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomerReviewsSection;
