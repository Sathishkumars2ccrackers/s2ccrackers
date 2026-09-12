import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const [totalPages, setTotalPages] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filters state from URL query or defaults
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'all';
  const brand = searchParams.get('brand') || 'all';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const inStock = searchParams.get('inStock') === 'true';
  const sort = searchParams.get('sort') || 'code-asc';
  const page = parseInt(searchParams.get('page') || '1', 10);

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
        // Fallback default brands from official PDF
        setBrands(['NACHIYAR', 'Brothers', 'SURYA', 'Sree Balaji']);
      });
  }, []);

  // Helper to determine if a category is active with case-insensitive and slug/id tolerance
  const isCategoryActive = (cat) => {
    if (!category || category === 'all') return false;
    const cleanActive = decodeURIComponent(category).trim().toLowerCase();
    return (
      cat.slug.toLowerCase() === cleanActive ||
      cat.name.toLowerCase() === cleanActive ||
      cat._id === category
    );
  };

  // Fetch Products whenever URL search params change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      console.log(`[ProductsPage] 🔎 Fetching products with filters -> Category: "${category}", Search: "${search}", Brand: "${brand}", Sort: "${sort}", Page: ${page}`);
      try {
        const params = {
          search: search || undefined,
          category: category !== 'all' ? category : undefined,
          brand: brand !== 'all' ? brand : undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          inStock: inStock ? true : undefined,
          sort,
          page,
          limit: 30,
        };

        const res = await productService.getProducts(params);
        if (res.data?.success) {
          const fetchedItems = res.data.products || [];
          setProducts(fetchedItems);
          setTotalProducts(res.data.total || 0);
          setTotalPages(res.data.totalPages || 1);
          console.log(`[ProductsPage] ✅ Successfully loaded ${fetchedItems.length} products (Total matches in DB: ${res.data.total || 0}) for category "${category}"`);
        }
      } catch (err) {
        console.error('[ProductsPage] ❌ Failed to load products catalog:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [search, category, brand, minPrice, maxPrice, inStock, sort, page]);

  const updateFilters = (newParams) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === 'all' || value === false) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });
    // Reset to page 1 on filter changes unless explicit page change
    if (!newParams.page) {
      nextParams.delete('page');
    }
    setSearchParams(nextParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters =
    search ||
    (category && category !== 'all') ||
    (brand && brand !== 'all') ||
    minPrice ||
    maxPrice ||
    inStock ||
    (sort !== 'code-asc' && sort !== 'featured');

  return (
    <div className="min-h-screen bg-festival-dark py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 pb-6 border-b border-festival-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Official Sivakasi Direct Factory 2026 Price List</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">
              S2C Festival Fireworks Catalog
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Showing {totalProducts} authentic cracker varieties across 15 categories • Door Delivery Available
            </p>
          </div>

          {/* Search & Sort Controls Strip */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search input */}
            <div className="relative flex-1 sm:w-72">
              <input
                type="text"
                value={search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                placeholder="Search name, brand, code, category..."
                className="w-full bg-festival-card border border-festival-border rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {search && (
                <button
                  onClick={() => updateFilters({ search: '' })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="bg-festival-card border border-festival-border rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500 appearance-none pr-8 cursor-pointer"
              >
                <option value="code-asc">Catalog Order (#1 - #62)</option>
                <option value="featured">Featured / Popular</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="bestseller">Best Selling Units</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Mobile Filter Trigger */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl bg-festival-card border border-festival-border text-xs font-bold text-amber-400"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters {hasActiveFilters ? '• Active' : ''}</span>
            </button>
          </div>
        </div>

        {/* Horizontal Category Quick Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-thin">
          <button
            onClick={() => updateFilters({ category: 'all' })}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              category === 'all'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md'
                : 'bg-festival-card text-slate-300 hover:text-white border border-festival-border'
            }`}
          >
            All Fireworks ({totalProducts})
          </button>
          {categories.map((cat) => {
            const active = isCategoryActive(cat);
            return (
              <button
                key={cat._id}
                onClick={() => updateFilters({ category: cat.slug })}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'bg-festival-card text-slate-300 hover:text-white border border-festival-border'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Main Grid with Filter Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block space-y-6 bg-festival-card/60 border border-festival-border p-6 rounded-2xl h-fit sticky top-28">
            <div className="flex items-center justify-between pb-4 border-b border-festival-border">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <span>Filters</span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>

            {/* In-Stock Filter Toggle */}
            <div className="pt-1">
              <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl bg-festival-dark/80 border border-festival-border hover:border-amber-500/40 transition-colors">
                <span className="text-xs font-bold text-slate-200">In Stock Only</span>
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => updateFilters({ inStock: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-festival-card border-festival-border"
                />
              </label>
            </div>

            {/* Brand Filter */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Brand Name</span>
              </h4>
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => updateFilters({ brand: 'all' })}
                  className={`w-full text-left px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    brand === 'all'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  All Brands
                </button>
                {brands.map((b) => (
                  <button
                    key={b}
                    onClick={() => updateFilters({ brand: b })}
                    className={`w-full text-left px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                      brand === b
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Price Range (₹)</h4>
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
            </div>

            {/* Category Filter */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Categories ({categories.length || 15})</h4>
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => updateFilters({ category: 'all' })}
                  className={`w-full text-left px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    category === 'all'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => {
                  const active = isCategoryActive(cat);
                  return (
                    <button
                      key={cat._id}
                      onClick={() => updateFilters({ category: cat.slug })}
                      className={`w-full text-left px-3 py-1.5 rounded-lg font-medium transition-colors truncate cursor-pointer ${
                        active
                          ? 'bg-amber-500 text-slate-950 font-bold shadow'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="lg:col-span-3 space-y-6">
            {loading ? (
              <div className="py-20 flex justify-center">
                <LoadingSpinner text="Fetching festive Sivakasi fireworks..." />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 px-4 bg-festival-card/40 border border-festival-border rounded-3xl space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {category && category !== 'all'
                    ? 'No products available in this category.'
                    : 'No Firework Items Found'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {category && category !== 'all'
                    ? 'We are currently preparing more stock for this festive cracker category from our Sivakasi factory. Please explore other categories.'
                    : 'Try adjusting your search terms, price range, or category filter to discover authentic Sivakasi crackers.'}
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg hover:bg-amber-400 transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6 border-t border-festival-border">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => updateFilters({ page: p })}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      page === p
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                        : 'bg-festival-card text-slate-300 hover:text-white border border-festival-border'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Slide-Over Modal */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xs bg-festival-card border-l border-festival-border p-6 shadow-2xl z-10 flex flex-col justify-between h-full overflow-y-auto space-y-6"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-festival-border">
                  <span className="text-sm font-bold text-white">Filter Products</span>
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* In Stock toggle */}
                <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl bg-festival-dark border border-festival-border">
                  <span className="text-xs font-bold text-slate-200">In Stock Only</span>
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => updateFilters({ inStock: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 bg-festival-card"
                  />
                </label>

                {/* Brands */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase">Brands</h4>
                  <div className="space-y-1 text-xs">
                    <button
                      onClick={() => updateFilters({ brand: 'all' })}
                      className={`w-full text-left px-3 py-1.5 rounded-lg ${
                        brand === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
                      }`}
                    >
                      All Brands
                    </button>
                    {brands.map((b) => (
                      <button
                        key={b}
                        onClick={() => updateFilters({ brand: b })}
                        className={`w-full text-left px-3 py-1.5 rounded-lg ${
                          brand === b ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase">Categories</h4>
                  <div className="space-y-1 text-xs max-h-48 overflow-y-auto">
                    <button
                      onClick={() => updateFilters({ category: 'all' })}
                      className={`w-full text-left px-3 py-1.5 rounded-lg ${
                        category === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => {
                      const active = isCategoryActive(cat);
                      return (
                        <button
                          key={cat._id}
                          onClick={() => updateFilters({ category: cat.slug })}
                          className={`w-full text-left px-3 py-1.5 rounded-lg ${
                            active ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-festival-border flex gap-2">
                <button
                  onClick={clearAllFilters}
                  className="flex-1 py-2.5 rounded-xl bg-festival-dark text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Reset
                </button>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductsPage;
