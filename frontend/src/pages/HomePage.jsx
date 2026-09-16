import React, { useState, useEffect } from 'react';
import { productService, bannerService } from '../services/api';
import HeroSlider from '../components/home/HeroSlider';
import FeaturedTabs from '../components/home/FeaturedTabs';
import SafetyGuidelinesSection from '../components/home/SafetyGuidelinesSection';
import CustomerReviewsSection from '../components/home/CustomerReviewsSection';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { preloadImages } from '../utils/imageUrlUtils';

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

        // Preload hero banner and top product images for instant perceived performance
        const imagesToPreload = [
          activeBanners[0]?.imageUrl,
          ...featured.slice(0, 4).map((p) => p.images?.[0]),
          ...topSellers.slice(0, 4).map((p) => p.images?.[0]),
        ].filter(Boolean);

        preloadImages(imagesToPreload);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-festival-dark">
        <LoadingSpinner text="Connecting to Sivakasi Fireworks Factory..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-festival-dark">
      {/* 1. Mega Festive Hero Slider with Fireworks Canvas Background */}
      <HeroSlider banners={banners} />

      {/* 2. Tabbed Cracker Showcase: Featured / Best Sellers / Gift Boxes */}
      <FeaturedTabs
        featured={featuredProducts}
        bestSellers={bestSellers}
        allProducts={[...featuredProducts, ...bestSellers]}
      />

      {/* 3. Safety Guidelines & Precautions Section */}
      <SafetyGuidelinesSection />

      {/* 4. Customer Testimonials & Verified Reviews */}
      <CustomerReviewsSection />
    </div>
  );
};

export default HomePage;
