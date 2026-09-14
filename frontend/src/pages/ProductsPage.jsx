import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  Sparkles,
  ChevronDown,
  RotateCcw,
  Tag,
  Check,
  Package,
  ArrowUp,
  Sliders,
  Layers,
  IndianRupee,
} from 'lucide-react';
import { productService, categoryService } from '../services/api';
import ProductCard from '../components/product/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Filters state from URL query or defaults (No page param!)
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'all';
  const brand = searchParams.get('brand') || 'all';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const inStock = searchParams.get('inStock') === 'true';
  const sort = searchParams.get('sort') || 'code-asc';

  // Load Categories & Brands on mount
  useEffect(() => {
    categoryService
      .getCategories()
      .then((res) => {
        if (res.data?.categories) {
          setCategories(res.data.categories);
        }
      })
      .catch((err) => console.error('Failed to load categories:', err));

    productService
      .getBrands()
      .then((res) => {
        if (res.data?.brands) {
          setBrands(res.data.brands);
        }
      })
      .catch(() => {
        setBrands(['NACHIYAR', 'Brothers', 'SURYA', 'Sree Balaji']);
      });
  }, []);

  // Back to top scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Helper to determine if a category is active with case-insensitive and slug/id tolerance
  const isCategoryActive = (cat) => {
    if (!category || category === 'all') return false;
    const cleanActive = decodeURIComponent(category).trim().toLowerCase();
    return (
      cat.slug?.toLowerCase() === cleanActive ||
      cat.name?.toLowerCase() === cleanActive ||
      cat._id === category
    );
  };

  // Fetch all products matching current filters (continuous grid with limit: 500)
  useEffect(() => {
    let isMounted = true;
    const fetchAllProducts = async () => {
      setLoading(true);
      try {
        const params = {
          search: search || undefined,
          category: category !== 'all' ? category : undefined,
          brand: brand !== 'all' ? brand : undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          inStock: inStock ? true : undefined,
          sort,
          page: 1,
          limit: 500, // Fetch all items for continuous scrolling
        };

        const res = await productService.getProducts(params);
        if (isMounted && res.data?.success) {
          const fetchedItems = res.data.products || [];
          setProducts(fetchedItems);
          setTotalProducts(res.data.total || fetchedItems.length);
        }
      } catch (err) {
        console.error('[ProductsPage] Failed to load products catalog:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllProducts();
  }, [search, category, brand, minPrice, maxPrice, inStock, sort]);

  const updateFilters = (newParams) => {
    const nextParams = new URLSearchParams(searchParams);
    // Remove any legacy page param
    nextParams.delete('page');

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === 'all' || value === false) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });
    setSearchParams(nextParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const activeFilterCount = [
    search ? 1 : 0,
    category && category !== 'all' ? 1 : 0,
    brand && brand !== 'all' ? 1 : 0,
    minPrice || maxPrice ? 1 : 0,
    inStock ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const hasActiveFilters = activeFilterCount > 0 || (sort !== 'code-asc' && sort !== 'featured');

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-festival-dark text-slate-100 pb-16">
      {/* 1. Page Title Header Strip (Compact) */}
      <div className="bg-gradient-to-b from-festival-card/80 to-transparent border-b border-festival-border/50 pt-4 pb-3 px-3 sm:px-6 lg:px-8">
        <div className="max-w-[1700px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sivakasi Direct Factory 2026 Price List</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-baseline gap-2">
              Fireworks Catalog
              <span className="text-xs sm:text-sm font-bold text-amber-400/90 font-mono">
                ({totalProducts} Products)
              </span>
            </h1>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400">
            Continuous Full Catalog • Direct Wholesale Rates • 100% Safe Crackers
          </p>
        </div>
      </div>

      {/* 2. STICKY TOP FILTER & CATEGORY BAR */}
      <div className="sticky top-0 z-30 bg-festival-dark/95 backdrop-blur-md border-b border-festival-border/80 shadow-xl transition-all">
        <div className="max-w-[1700px] mx-auto px-2 sm:px-4 lg:px-6 py-2.5 space-y-2">
          {/* Top Controls Row */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] sm:min-w-[240px]">
              <input
                type="text"
                value={search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                placeholder="Search cracker name, #code, brand..."
                className="w-full bg-festival-card border border-festival-border rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              {search && (
                <button
                  onClick={() => updateFilters({ search: '' })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick In-Stock Filter Toggle */}
            <button
              onClick={() => updateFilters({ inStock: !inStock })}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                inStock
                  ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-sm'
                  : 'bg-festival-card border-festival-border text-slate-300 hover:text-white hover:border-amber-500/40'
              }`}
            >
              <Check className={`w-3.5 h-3.5 ${inStock ? 'opacity-100' : 'opacity-40'}`} />
              <span>In Stock Only</span>
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="bg-festival-card border border-festival-border rounded-xl pl-2.5 pr-7 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500 appearance-none cursor-pointer hover:border-amber-500/40 transition-colors"
              >
                <option value="code-asc">Catalog (#1 - #62)</option>
                <option value="featured">Featured / Popular</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="bestseller">Best Sellers</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Slide-out Filters Drawer Trigger */}
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                activeFilterCount > 0
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : 'bg-festival-card border-festival-border text-amber-400 hover:bg-white/5 hover:border-amber-500/40'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-slate-950 text-amber-300 text-[10px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Horizontal Category Quick Tabs Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-amber-500/30">
            <button
              onClick={() => updateFilters({ category: 'all' })}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                category === 'all'
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow'
                  : 'bg-festival-card text-slate-300 hover:text-white border border-festival-border/80 hover:border-amber-500/40'
              }`}
            >
              All Crackers ({totalProducts})
            </button>
            {categories.map((cat) => {
              const active = isCategoryActive(cat);
              return (
                <button
                  key={cat._id}
                  onClick={() => updateFilters({ category: cat.slug || cat._id })}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-amber-500 text-slate-950 font-black shadow'
                      : 'bg-festival-card text-slate-300 hover:text-white border border-festival-border/80 hover:border-amber-500/40'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Active Filter Badges Strip */}
          {hasActiveFilters && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-[11px] border-t border-festival-border/40">
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <Tag className="w-3 h-3 text-amber-400" />
                Active:
              </span>

              {search && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-festival-card border border-amber-500/40 text-amber-300 font-semibold">
                  "{search}"
                  <button onClick={() => updateFilters({ search: '' })} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {category && category !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-festival-card border border-amber-500/40 text-amber-300 font-semibold">
                  Category: {category}
                  <button onClick={() => updateFilters({ category: 'all' })} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {brand && brand !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-festival-card border border-amber-500/40 text-amber-300 font-semibold">
                  Brand: {brand}
                  <button onClick={() => updateFilters({ brand: 'all' })} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-festival-card border border-amber-500/40 text-amber-300 font-semibold">
                  ₹{minPrice || 0} - ₹{maxPrice || '∞'}
                  <button onClick={() => updateFilters({ minPrice: '', maxPrice: '' })} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {inStock && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-semibold">
                  In Stock Only
                  <button onClick={() => updateFilters({ inStock: false })} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={clearAllFilters}
                className="text-amber-400 hover:text-amber-300 font-bold underline ml-1 cursor-pointer whitespace-nowrap"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. HIGH-DENSITY CONTINUOUS PRODUCT GRID */}
      <main className="max-w-[1700px] mx-auto px-2 sm:px-4 lg:px-6 pt-4">
        {loading ? (
          <div className="py-24 flex justify-center">
            <LoadingSpinner text="Loading Sivakasi fireworks catalog..." />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 px-4 bg-festival-card/40 border border-festival-border rounded-2xl max-w-xl mx-auto space-y-3">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              {category && category !== 'all'
                ? 'No products available in this category.'
                : 'No Firework Items Found'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search terms, price filters, or category to browse other Sivakasi factory crackers.
            </p>
            <button
              onClick={clearAllFilters}
              className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-md hover:bg-amber-400 transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div>
            {/* Responsive Grid: 
                Mobile: 2 cols
                Tablet: 3-4 cols
                Laptop: 5 cols
                Desktop: 6 cols
                Wide Desktop: 7 cols
            */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 md:gap-3.5 lg:gap-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* Continuous Scroll Catalog Footer */}
            <div className="mt-12 py-6 border-t border-festival-border/60 text-center space-y-2">
              <p className="text-xs text-slate-400 font-medium">
                ✓ Showing all <strong className="text-amber-400">{products.length}</strong> festive fireworks in continuous view
              </p>
              <button
                onClick={scrollToTop}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-festival-card hover:bg-festival-cardHover border border-amber-500/30 text-amber-300 text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Back to Top</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 4. SLIDE-OUT FILTER DRAWER (Mobile + Desktop) */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterDrawerOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-sm bg-festival-card border-l border-festival-border p-5 shadow-2xl z-10 flex flex-col justify-between h-full overflow-y-auto space-y-5"
            >
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-festival-border">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span>Filter Fireworks</span>
                  </div>
                  <button
                    onClick={() => setIsFilterDrawerOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* In Stock toggle */}
                <div>
                  <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl bg-festival-dark border border-festival-border hover:border-amber-500/40 transition-colors">
                    <span className="text-xs font-bold text-slate-200">In Stock Only</span>
                    <input
                      type="checkbox"
                      checked={inStock}
                      onChange={(e) => updateFilters({ inStock: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 bg-festival-card"
                    />
                  </label>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
                    <span>Price Range (₹)</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Min (₹)</label>
                      <input
                        type="number"
                        value={minPrice}
                        onChange={(e) => updateFilters({ minPrice: e.target.value })}
                        placeholder="₹ 0"
                        className="w-full bg-festival-dark border border-festival-border rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Max (₹)</label>
                      <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => updateFilters({ maxPrice: e.target.value })}
                        placeholder="₹ 5000"
                        className="w-full bg-festival-dark border border-festival-border rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  {/* Quick price presets */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    <button
                      onClick={() => updateFilters({ minPrice: '', maxPrice: '200' })}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-festival-dark border border-festival-border hover:border-amber-500 text-slate-300 cursor-pointer"
                    >
                      Under ₹200
                    </button>
                    <button
                      onClick={() => updateFilters({ minPrice: '200', maxPrice: '500' })}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-festival-dark border border-festival-border hover:border-amber-500 text-slate-300 cursor-pointer"
                    >
                      ₹200 - ₹500
                    </button>
                    <button
                      onClick={() => updateFilters({ minPrice: '500', maxPrice: '1500' })}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-festival-dark border border-festival-border hover:border-amber-500 text-slate-300 cursor-pointer"
                    >
                      ₹500 - ₹1500
                    </button>
                    <button
                      onClick={() => updateFilters({ minPrice: '1500', maxPrice: '' })}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-festival-dark border border-festival-border hover:border-amber-500 text-slate-300 cursor-pointer"
                    >
                      Above ₹1500
                    </button>
                  </div>
                </div>

                {/* Brands */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Brands</span>
                  </h4>
                  <div className="space-y-1 text-xs max-h-36 overflow-y-auto pr-1">
                    <button
                      onClick={() => updateFilters({ brand: 'all' })}
                      className={`w-full text-left px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                        brand === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      All Brands
                    </button>
                    {brands.map((b) => (
                      <button
                        key={b}
                        onClick={() => updateFilters({ brand: b })}
                        className={`w-full text-left px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                          brand === b ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>Categories ({categories.length})</span>
                  </h4>
                  <div className="space-y-1 text-xs max-h-48 overflow-y-auto pr-1">
                    <button
                      onClick={() => updateFilters({ category: 'all' })}
                      className={`w-full text-left px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                        category === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => {
                      const active = isCategoryActive(cat);
                      return (
                        <button
                          key={cat._id}
                          onClick={() => updateFilters({ category: cat.slug || cat._id })}
                          className={`w-full text-left px-3 py-1.5 rounded-lg font-medium transition-colors truncate cursor-pointer ${
                            active ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="pt-3 border-t border-festival-border flex gap-2">
                <button
                  onClick={() => {
                    clearAllFilters();
                    setIsFilterDrawerOpen(false);
                  }}
                  className="flex-1 py-2 rounded-xl bg-festival-dark hover:bg-white/5 text-slate-300 text-xs font-bold border border-festival-border cursor-pointer transition-colors"
                >
                  Reset All
                </button>
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black cursor-pointer shadow-lg transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-amber-500 text-slate-950 shadow-2xl hover:bg-amber-400 transition-all cursor-pointer"
          title="Back to Top"
        >
          <ArrowUp className="w-5 h-5 font-black" />
        </motion.button>
      )}
    </div>
  );
};

export default ProductsPage;
