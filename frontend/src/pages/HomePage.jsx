import React, { useState, useEffect } from 'react';
import { productService, bannerService } from '../services/api';
import SEO from '../components/common/SEO';
import HeroSlider from '../components/home/HeroSlider';
import FeaturedTabs from '../components/home/FeaturedTabs';
import SEOContentSection from '../components/home/SEOContentSection';
import SafetyGuidelinesSection from '../components/home/SafetyGuidelinesSection';
import CustomerReviewsSection from '../components/home/CustomerReviewsSection';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { preloadImages } from '../utils/imageUrlUtils';

const homeStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://www.s2ccrackers.com/#website',
      url: 'https://www.s2ccrackers.com',
      name: 'S2C Crackers',
      description: 'Buy authentic Sivakasi fireworks and crackers online at factory direct price with door delivery across India.',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://www.s2ccrackers.com/products?search={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://www.s2ccrackers.com/#organization',
      name: 'S2C Crackers',
      url: 'https://www.s2ccrackers.com',
      logo: 'https://www.s2ccrackers.com/logo.svg',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+91-9944476516',
        contactType: 'customer service',
        areaServed: 'IN',
        availableLanguage: ['en', 'ta'],
      },
      sameAs: ['https://wa.me/919944476516'],
    },
    {
      '@type': ['Store', 'LocalBusiness'],
      '@id': 'https://www.s2ccrackers.com/#store',
      name: 'S2C Crackers - Sivakasi Crackers Online',
      url: 'https://www.s2ccrackers.com',
      logo: 'https://www.s2ccrackers.com/logo.svg',
      image: 'https://www.s2ccrackers.com/logo.svg',
      description: 'Authentic Sivakasi fireworks manufacturer and online distributor with direct factory wholesale prices and Door Delivery Available across India.',
      telephone: '+91-9944476516',
      priceRange: '₹₹',
      paymentAccepted: 'Cash on Delivery, UPI, Door Delivery Available',
      currenciesAccepted: 'INR',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '570 (East Part), Singapore Nagar, Chatitapatti',
        addressLocality: 'Madurai',
        addressRegion: 'Tamil Nadu',
        postalCode: '625014',
        addressCountry: 'IN',
      },
    },
  ],
};

const HomePage = () => {
  const [banners, setBanners] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [showcaseRes, bannersRes] = await Promise.all([
          productService.getFeaturedShowcase().catch(() => ({ data: { featured: [], bestSellers: [] } })),
          bannerService.getActive().catch(() => ({ data: { banners: [] } })),
        ]);

        const featured = showcaseRes.data?.featured || [];
        const topSellers = showcaseRes.data?.bestSellers || [];
        const activeBanners = bannersRes.data?.banners || [];

        if (showcaseRes.data?.success) {
          setFeaturedProducts(featured);
          setBestSellers(topSellers);
        }

        if (bannersRes.data?.success) {
          setBanners(activeBanners);
        }

        // Only preload critical above-the-fold hero banner (LCP)
        if (activeBanners[0]?.imageUrl) {
          preloadImages([activeBanners[0].imageUrl]);
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <div className="min-h-screen bg-festival-dark">
      {/* Dynamic SEO Meta & Structured Data */}
      <SEO
        title="S2C Crackers | Buy Sivakasi Crackers Online | Factory Direct Price"
        description="Shop authentic Sivakasi crackers online at factory direct price from S2C Crackers. Buy sparklers, sky shots, flower pots & gift boxes with Door Delivery in India."
        keywords="S2C Crackers, Sivakasi Crackers, Buy Crackers Online, Crackers Price List, Gift Box Crackers, Diwali Crackers Online, Factory Direct Fireworks, Online Crackers Shopping, Door Delivery Across India"
        canonical="https://www.s2ccrackers.com/"
        structuredData={homeStructuredData}
      />

      {/* 1. Mega Festive Hero Slider with Fireworks Canvas Background (Renders immediately) */}
      <HeroSlider banners={banners} />

      {/* 2. Tabbed Cracker Showcase: Featured / Best Sellers / Gift Boxes with Skeleton support */}
      <FeaturedTabs
        featured={featuredProducts}
        bestSellers={bestSellers}
        allProducts={[...featuredProducts, ...bestSellers]}
        loading={loading}
      />

      {/* 3. Keyword-Rich SEO Explanatory & Category Directory Section */}
      <SEOContentSection />

      {/* 4. Safety Guidelines & Precautions Section */}
      <SafetyGuidelinesSection />

      {/* 5. Customer Testimonials & Verified Reviews */}
      <CustomerReviewsSection />
    </div>
  );
};

export default HomePage;
