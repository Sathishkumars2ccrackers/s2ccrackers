import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
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
  ShoppingBag,
  ArrowRight,
  ShoppingCart,
  ListFilter,
} from 'lucide-react';
import { productService, categoryService } from '../services/api';
import ProductListRow from '../components/product/ProductListRow';
import ProductRowSkeleton from '../components/product/ProductRowSkeleton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SEO from '../components/common/SEO';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { useCart } from '../context/CartContext';
import { formatCurrency, formatProductCode, naturalProductCodeSort, sortProductsByCode } from '../utils/formatters';

// Canonical Category Alias Map for fault-tolerant fuzzy resolution
const CATEGORY_ALIAS_MAP = {
  'sparklers': ['sparklers', 'sparkler'],
  'ground-chakkars': ['ground-chakkars', 'ground-chakkar', 'groundchakkars', 'groundchakkar', 'ground chakkars', 'ground chakkar'],
  'flower-pots': ['flower-pots', 'flower-pot', 'flowerpots', 'flowerpot', 'flower pots', 'flower pot'],
  'rockets-missiles': ['rockets-missiles', 'rockets', 'rocket', 'missiles', 'missile', 'rockets-and-missiles', 'rockets & missiles', 'rockets missiles'],
  'multi-shot-sky-shots': ['multi-shot-sky-shots', 'sky-shots', 'skyshots', 'ariel-fancy-shots', 'ariel fancy shots', 'fancy-shots', 'fancy shots', 'multishot-sky-shots', 'multi shot sky shots', 'sky shots'],
  'sound-crackers': ['sound-crackers', 'sound-cracker', 'soundcrackers', 'soundcracker', 'sound crackers', 'sound cracker'],
  'kids-special': ['kids-special', 'kids-novelties', 'kids special', 'kids novelties', 'kidsspecial', 'kidsnovelties', 'kids'],
  'deluxe-gift-boxes': ['deluxe-gift-boxes', 'gift-boxes', 'gift-box', 'giftboxes', 'giftbox', 'deluxe gift boxes', 'gift boxes', 'gift box', 'family-gift-boxes'],
  'bijili-crackers': ['bijili-crackers', 'bijili-cracker', 'bijili crackers', 'bijili'],
  'bombs': ['bombs', 'bomb'],
  'twinkling-star': ['twinkling-star', 'twinkling-stars', 'twinkling star'],
  'digital-wala': ['digital-wala', 'digital wala'],
  'childrens-color-match-box': ['childrens-color-match-box', 'children-color-match-box', "children's color match box", 'color-match-box'],
  'childrens-gun': ['childrens-gun', 'children-gun', "children's gun", 'children gun'],
};

const normalizeCategoryKey = (key) =>
  (key || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

const isSameCategory = (catA, catB) => {
  if (!catA || !catB) return false;
  if (catA === catB) return true;

  const idA = typeof catA === 'object' ? (catA._id || '') : (typeof catA === 'string' && catA.match(/^[0-9a-fA-F]{24}$/) ? catA : '');
  const idB = typeof catB === 'object' ? (catB._id || '') : (typeof catB === 'string' && catB.match(/^[0-9a-fA-F]{24}$/) ? catB : '');
  if (idA && idB && idA === idB) return true;

  const rawKeyA = typeof catA === 'object' ? (catA.slug || catA.name || '') : catA;
  const rawKeyB = typeof catB === 'object' ? (catB.slug || catB.name || '') : catB;

  const normA = normalizeCategoryKey(rawKeyA);
  const normB = normalizeCategoryKey(rawKeyB);

  if (normA && normB && normA === normB) return true;

  for (const [canonical, aliases] of Object.entries(CATEGORY_ALIAS_MAP)) {
    const canonicalNorm = normalizeCategoryKey(canonical);
    const allNorms = [canonicalNorm, ...aliases.map(normalizeCategoryKey)];
    if (allNorms.includes(normA) && allNorms.includes(normB)) {
      return true;
    }
  }

  if (typeof catA === 'object' && catA.name && typeof catB === 'string') {
    if (normalizeCategoryKey(catA.name) === normB) return true;
  }
  if (typeof catB === 'object' && catB.name && typeof catA === 'string') {
    if (normalizeCategoryKey(catB.name) === normA) return true;
  }

  return false;
};

const INITIAL_PAGE_SIZE = 20;
const PAGE_INCREMENT = 20;

const ProductsPage = ({ initialCategory }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const routeParams = useParams();
  const { totalItemsCount, cartSubtotal, openCart } = useCart();

  const [masterProducts, setMasterProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);
  const loadMoreTriggerRef = React.useRef(null);

  // Filters state from URL query or Route parameters
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || initialCategory || routeParams.categorySlug || 'all';
  const brand = searchParams.get('brand') || 'all';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const inStock = searchParams.get('inStock') === 'true';
  const sort = searchParams.get('sort') || 'code-asc';

  // Load Categories & Brands
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
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load Master Products Catalog on mount
  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const res = await productService.getProducts({
          sort: 'code-asc',
          page: 1,
          limit: 1000,
        });
        if (isMounted && res.data?.success) {
          const fetchedItems = res.data.products || [];
          setMasterProducts(sortProductsByCode(fetchedItems));
        }
      } catch (err) {
        console.error('[ProductsPage] Failed to fetch master product catalog:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Helper to determine if a category chip is active
  const isCategoryActive = (cat) => {
    if (!category || category === 'all') return false;
    return isSameCategory(cat, category);
  };

  // Dynamic Category Item Counts calculated across master inventory
  const categoryCounts = useMemo(() => {
    const counts = {};
    categories.forEach((cat) => {
      const matchCount = masterProducts.filter((p) => isSameCategory(p.category, cat)).length;
      if (cat.slug) counts[cat.slug] = matchCount;
      if (cat._id) counts[cat._id] = matchCount;
      if (cat.name) counts[cat.name.toLowerCase()] = matchCount;
    });
    return counts;
  }, [masterProducts, categories]);

  // Current active category object
  const currentCategoryObj = useMemo(() => {
    if (!category || category === 'all') return null;
    return categories.find((cat) => isSameCategory(cat, category)) || null;
  }, [categories, category]);

  // Dynamic Catalog Title
  const catalogTitle = useMemo(() => {
    if (currentCategoryObj?.name) {
      return `${currentCategoryObj.name} Wholesale Catalog`;
    }
    if (category && category !== 'all') {
      const decoded = decodeURIComponent(category).replace(/-/g, ' ');
      const formatted = decoded
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return `${formatted} Wholesale Catalog`;
    }
    return 'All Crackers Wholesale Catalog';
  }, [currentCategoryObj, category]);

  // Dynamic SEO Title & Description
  const seoTitle = useMemo(() => {
    if (currentCategoryObj?.name) {
      return `${currentCategoryObj.name} Crackers Online | Buy Sivakasi ${currentCategoryObj.name} at Factory Price - S2C Crackers`;
    }
    if (search && search.trim()) {
      return `${search.trim()} - Search Crackers & Fireworks | S2C Crackers Sivakasi`;
    }
    return 'All Crackers & Fireworks Price List 2026 | Buy Online - S2C Crackers Sivakasi';
  }, [currentCategoryObj, search]);

  const seoDescription = useMemo(() => {
    if (currentCategoryObj?.name) {
      return `Explore premium Sivakasi ${currentCategoryObj.name} online at wholesale factory rates. 80% discount, authentic quality & door delivery across India from S2C Crackers.`;
    }
    if (search && search.trim()) {
      return `Search results for "${search.trim()}" in Sivakasi crackers 2026 price list. Buy authentic fireworks with up to 80% factory direct discount and door delivery.`;
    }
    return 'Browse 2026 Sivakasi crackers price list online. Buy sound crackers, sparklers, flower pots, sky shots & deluxe gift boxes at 80% factory direct discount.';
  }, [currentCategoryObj, search]);

  const canonicalUrl = useMemo(() => {
    if (currentCategoryObj?.slug) {
      return `https://www.s2ccrackers.com/products?category=${currentCategoryObj.slug}`;
    }
    return 'https://www.s2ccrackers.com/products';
  }, [currentCategoryObj]);

  const breadcrumbItems = useMemo(() => {
    const items = [
      { label: 'Home', path: '/' },
      { label: 'All Crackers', path: '/products' },
    ];
    if (currentCategoryObj?.name) {
      items.push({ label: currentCategoryObj.name, isCurrent: true });
    } else if (search && search.trim()) {
      items.push({ label: `Search: "${search.trim()}"`, isCurrent: true });
    }
    return items;
  }, [currentCategoryObj, search]);

  const breadcrumbListSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.label,
      ...(item.path ? { item: `https://www.s2ccrackers.com${item.path.startsWith('/') ? item.path : '/' + item.path}` } : {}),
    })),
  }), [breadcrumbItems]);

  // Filter & Sort Products (Natural Numeric Product Code Sorting by Default and after Filters)
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...masterProducts];

    // 1. Category filter
    if (category && category !== 'all') {
      result = result.filter((p) => isSameCategory(p.category, category));
    }

    // 2. Search filter (Name, Product Code, Regional Name, Category, Brand)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((p) => {
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const codeMatch = (p.productCode || p.code || '').toLowerCase().includes(q);
        const regionalMatch = (p.regionalName || '').toLowerCase().includes(q);
        const categoryMatch = (p.category?.name || '').toLowerCase().includes(q);
        const brandMatch = (p.brand || '').toLowerCase().includes(q);
        return nameMatch || codeMatch || regionalMatch || categoryMatch || brandMatch;
      });
    }

    // 3. Brand filter
    if (brand && brand !== 'all') {
      const bLower = brand.toLowerCase().trim();
      result = result.filter((p) => (p.brand || '').toLowerCase().trim() === bLower);
    }

    // 4. Price range filter
    if (minPrice !== undefined && minPrice !== '') {
      result = result.filter((p) => p.price >= Number(minPrice));
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      result = result.filter((p) => p.price <= Number(maxPrice));
    }

    // 5. In-stock filter
    if (inStock) {
      result = result.filter((p) => (p.stockQuantity ?? 1) > 0);
    }

    // 6. Sort
    switch (sort) {
      case 'code-asc':
      default:
        return sortProductsByCode(result);
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'bestseller':
        result.sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0));
        break;
      case 'featured':
        result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    return result;
  }, [masterProducts, category, search, brand, minPrice, maxPrice, inStock, sort]);

  // Sliced products for initial 20-item fast render and progressive scroll hydration
  const displayedProducts = useMemo(() => {
    return filteredAndSortedProducts.slice(0, visibleCount);
  }, [filteredAndSortedProducts, visibleCount]);

  // Auto-scroll to top of product list and reset visible count whenever category, search, or filters change
  useEffect(() => {
    setVisibleCount(INITIAL_PAGE_SIZE);
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [category, search, brand, minPrice, maxPrice, inStock, sort]);

  // Infinite / Incremental Scroll Observer: Load next 20 products as user scrolls near bottom
  useEffect(() => {
    if (visibleCount >= filteredAndSortedProducts.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_INCREMENT, filteredAndSortedProducts.length));
        }
      },
      {
        rootMargin: '300px 0px', // Trigger smoothly before hitting bottom
        threshold: 0.01,
      }
    );

    const target = loadMoreTriggerRef.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) observer.unobserve(target);
      observer.disconnect();
    };
  }, [visibleCount, filteredAndSortedProducts.length]);

  // Clean route transition when selecting category: resets searches, stock, and brand filters
  const handleCategorySelect = (categorySlug) => {
    if (!categorySlug || categorySlug === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: categorySlug });
    }
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const updateFilters = (newParams) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('page');

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === 'all' || value === false) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });
    setSearchParams(nextParams);
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const activeFilterCount = [
    search ? 1 : 0,
    category && category !== 'all' ? 1 : 0,
    brand && brand !== 'all' ? 1 : 0,
    minPrice || maxPrice ? 1 : 0,
    inStock ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const hasActiveFilters = activeFilterCount > 0 || sort !== 'code-asc';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-festival-dark text-slate-100 pb-28">
      {/* Dynamic SEO Meta & Structured Data */}
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={`S2C Crackers, Sivakasi Crackers, Buy Crackers Online, ${currentCategoryObj?.name || 'All Crackers'}, Crackers Price List 2026, Gift Box Crackers, Diwali Crackers, Factory Direct Fireworks`}
        canonical={canonicalUrl}
        structuredData={breadcrumbListSchema}
      />

      {/* 1. Page Title Header Strip (Scrolls away at top) */}
      <div className="bg-gradient-to-b from-festival-card/90 to-transparent border-b border-festival-border/50 pt-5 pb-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Visual Breadcrumb Navigation */}
          <Breadcrumbs items={breadcrumbItems} />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sivakasi Direct Factory Wholesale Price List 2026</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-baseline gap-2">
                {catalogTitle}
                <span className="text-xs sm:text-sm font-bold text-amber-400/90 font-mono">
                  ({filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'Product' : 'Products'})
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Quick Wholesale Order • Select quantities directly • Door Delivery Available
            </p>
          </div>
        </div>
      </div>

      {/* 2. DEDICATED STICKY CATALOG CONTROLS WRAPPER (.catalog-controls-sticky) */}
      <div className="catalog-controls-sticky">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 space-y-2">
          {/* Top Search & Filter Controls: Search Bar, Code/Sort Dropdown, In-Stock, Filter Drawer Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
            {/* 1. Search Bar */}
            <div className="relative flex-1 min-w-[140px] sm:min-w-[200px]">
              <input
                type="text"
                value={search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                placeholder="Search cracker name, code (e.g. #01, #04)..."
                className="w-full bg-festival-card border border-festival-border rounded-xl pl-8 pr-7 py-1.5 sm:py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              {search && (
                <button
                  onClick={() => updateFilters({ search: '' })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 2. Product Code / Sort Dropdown */}
            <div className="relative flex-shrink-0">
              <select
                value={sort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="bg-festival-card border border-festival-border rounded-xl pl-2.5 sm:pl-3 pr-6 sm:pr-7 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-white focus:outline-none focus:border-amber-500 appearance-none cursor-pointer hover:border-amber-500/40 transition-colors"
                title="Filter / Sort by Product Code or Price"
              >
                <option value="code-asc">Code (#01, #02, #03...)</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="bestseller">Best Selling</option>
                <option value="featured">Featured / Popular</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* 3. Quick In-Stock Filter Toggle (Visible on both Mobile & Desktop) */}
            <button
              onClick={() => updateFilters({ inStock: !inStock })}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold border transition-all cursor-pointer flex-shrink-0 ${
                inStock
                  ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-sm ring-1 ring-emerald-500/40'
                  : 'bg-festival-card border-festival-border text-slate-300 hover:text-white hover:border-amber-500/40'
              }`}
              title="Toggle In Stock Only"
            >
              <Check className={`w-3.5 h-3.5 ${inStock ? 'opacity-100 text-emerald-400' : 'opacity-40'}`} />
              <span className="hidden xs:inline">In Stock</span>
              <span className="xs:hidden">Stock</span>
            </button>

            {/* 4. Filter Drawer Trigger Button */}
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold border transition-all cursor-pointer flex-shrink-0 ${
                activeFilterCount > 0
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-extrabold'
                  : 'bg-festival-card border-festival-border text-amber-400 hover:bg-white/5 hover:border-amber-500/40'
              }`}
              title="Open Advanced Filters"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-slate-950 text-amber-300 text-[10px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* 5. Horizontally Scrollable Category Chips / Tabs with Product Counts */}
          <div className="chips-scroll-container flex items-center gap-1.5 pb-1">
            <button
              onClick={() => handleCategorySelect('all')}
              className={`px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                !category || category === 'all'
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md'
                  : 'bg-festival-card text-slate-300 hover:text-white border border-festival-border/80 hover:border-amber-500/40'
              }`}
            >
              <span>All Crackers</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono">
                {masterProducts.length}
              </span>
            </button>

            {categories.map((cat) => {
              const active = isCategoryActive(cat);
              const count = categoryCounts[cat.slug] ?? categoryCounts[cat._id] ?? categoryCounts[cat.name?.toLowerCase()] ?? 0;

              return (
                <button
                  key={cat._id || cat.slug}
                  onClick={() => handleCategorySelect(cat.slug || cat._id)}
                  className={`px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                    active
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'bg-festival-card text-slate-300 hover:text-white border border-festival-border/80 hover:border-amber-500/40'
                  }`}
                >
                  <span>{cat.name}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        active ? 'bg-slate-950/30 text-slate-950' : 'bg-festival-dark text-amber-300/90'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 6. Active Filter Badges & 7. Clear All Button */}
          {hasActiveFilters && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-[11px] border-t border-festival-border/40">
              <span className="text-slate-400 font-bold flex items-center gap-1 flex-shrink-0">
                <Tag className="w-3 h-3 text-amber-400" />
                Active:
              </span>

              {search && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-festival-card border border-amber-500/40 text-amber-300 font-semibold flex-shrink-0">
                  "{search}"
                  <button onClick={() => updateFilters({ search: '' })} className="hover:text-white cursor-pointer" title="Remove search filter">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {category && category !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-festival-card border border-amber-500/40 text-amber-300 font-semibold flex-shrink-0">
                  Category: {currentCategoryObj?.name || category}
                  <button onClick={() => handleCategorySelect('all')} className="hover:text-white cursor-pointer" title="Remove category filter">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {brand && brand !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-festival-card border border-amber-500/40 text-amber-300 font-semibold flex-shrink-0">
                  Brand: {brand}
                  <button onClick={() => updateFilters({ brand: 'all' })} className="hover:text-white cursor-pointer" title="Remove brand filter">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-festival-card border border-amber-500/40 text-amber-300 font-semibold flex-shrink-0">
                  ₹{minPrice || 0} - ₹{maxPrice || '∞'}
                  <button onClick={() => updateFilters({ minPrice: '', maxPrice: '' })} className="hover:text-white cursor-pointer" title="Remove price filter">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {inStock && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-semibold flex-shrink-0">
                  In Stock
                  <button onClick={() => updateFilters({ inStock: false })} className="hover:text-white cursor-pointer" title="Remove in-stock filter">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={clearAllFilters}
                className="text-amber-400 hover:text-amber-300 font-bold underline ml-1 cursor-pointer whitespace-nowrap flex-shrink-0"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. SCROLLABLE PRODUCT LIST CONTAINER (.catalog-products-container) */}
      <main className="catalog-products-container max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-4">
        {loading ? (
          <div className="bg-festival-card/60 border border-festival-border rounded-2xl overflow-hidden shadow-2xl">
            {/* Desktop Table-Style Header Bar */}
            <div className="hidden md:grid md:grid-cols-12 gap-3 py-3 px-4 bg-slate-950/80 border-b border-festival-border text-[11px] font-black text-amber-400 uppercase tracking-wider">
              <div className="col-span-1 text-center">Image</div>
              <div className="col-span-4">Product Name & Category</div>
              <div className="col-span-1 text-center">Code</div>
              <div className="col-span-1 text-center">Pack Size</div>
              <div className="col-span-2 text-right pr-2">Rate (₹)</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-1 text-right">Subtotal</div>
            </div>

            {/* Shimmering Skeleton Rows for Instant Perceived Load */}
            <div className="divide-y divide-festival-border/40">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductRowSkeleton key={`catalog-skel-${i}`} index={i} />
              ))}
            </div>
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
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
              Try adjusting your search query, price filters, or category to browse authentic Sivakasi crackers.
            </p>
            <button
              onClick={clearAllFilters}
              className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-md hover:bg-amber-400 transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="bg-festival-card/60 border border-festival-border rounded-2xl overflow-hidden shadow-2xl">
            {/* Desktop Table-Style Header Bar */}
            <div className="hidden md:grid md:grid-cols-12 gap-3 py-3 px-4 bg-slate-950/80 border-b border-festival-border text-[11px] font-black text-amber-400 uppercase tracking-wider">
              <div className="col-span-1 text-center">Image</div>
              <div className="col-span-4">Product Name & Category</div>
              <div className="col-span-1 text-center">Code</div>
              <div className="col-span-1 text-center">Pack Size</div>
              <div className="col-span-2 text-right pr-2">Rate (₹)</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-1 text-right">Subtotal</div>
            </div>

            {/* List Rows - Initially 20 items, expanding on scroll */}
            <div className="divide-y divide-festival-border/40">
              {displayedProducts.map((product, index) => (
                <ProductListRow key={product._id} product={product} index={index} />
              ))}
            </div>

            {/* Progressive Scroll Loading Sentinel */}
            {visibleCount < filteredAndSortedProducts.length && (
              <div
                ref={loadMoreTriggerRef}
                className="py-5 px-4 bg-slate-950/40 border-t border-festival-border/40 text-center space-y-2.5"
              >
                <div className="flex items-center justify-center gap-2 text-xs text-amber-400 font-bold">
                  <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span>
                    Loading more crackers ({displayedProducts.length} of {filteredAndSortedProducts.length})...
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((prev) =>
                      Math.min(prev + PAGE_INCREMENT, filteredAndSortedProducts.length)
                    )
                  }
                  className="px-4 py-1.5 rounded-xl bg-festival-card hover:bg-festival-cardHover border border-amber-500/30 text-amber-300 text-xs font-bold transition-all shadow cursor-pointer"
                >
                  Load Next 20 Items ({filteredAndSortedProducts.length - visibleCount} remaining)
                </button>
              </div>
            )}

            {/* Continuous Scroll Footer Note */}
            <div className="py-6 px-4 bg-slate-950/60 border-t border-festival-border/60 text-center space-y-2">
              <p className="text-xs text-slate-400 font-medium">
                ✓ Showing <strong className="text-amber-400">{displayedProducts.length}</strong> of{' '}
                <strong className="text-amber-400">{filteredAndSortedProducts.length}</strong> items sorted by product code (#01, #02, #03...)
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

      {/* 4. STICKY BOTTOM FLOATING ORDER SUMMARY BAR */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-festival-card via-[#1e1333] to-festival-card border-t border-amber-500/40 shadow-2xl backdrop-blur-xl py-2.5 px-4 sm:px-8 transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            {/* Left: Items & Total Amount */}
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow">
                  {totalItemsCount}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block leading-tight">
                    Selected Items
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-white">
                    {totalItemsCount} {totalItemsCount === 1 ? 'variety' : 'varieties'}
                  </span>
                </div>
              </div>

              <div className="border-l border-festival-border pl-3 sm:pl-6">
                <span className="text-[10px] text-amber-300/80 uppercase font-bold block leading-tight">
                  Total Order Amount
                </span>
                <span className="text-base sm:text-xl font-black text-amber-400">
                  {formatCurrency(cartSubtotal)}
                </span>
              </div>
            </div>

            {/* Right: View Cart Button */}
            <div className="flex items-center gap-2">
              <Link
                to="/cart"
                className="hidden sm:inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-festival-dark hover:bg-white/10 text-slate-300 hover:text-white border border-festival-border text-xs font-bold transition-all cursor-pointer"
              >
                <span>Edit Cart</span>
              </Link>
              <button
                onClick={openCart}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 hover:from-red-500 hover:to-orange-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-950/60 transition-all flex items-center gap-2 cursor-pointer transform hover:scale-105"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>View Cart ({formatCurrency(cartSubtotal)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. SLIDE-OUT ADVANCED FILTERS DRAWER */}
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
                    <span>Filter Fireworks Catalog</span>
                  </div>
                  <button
                    onClick={() => setIsFilterDrawerOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* In Stock Toggle */}
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
                      onClick={() => {
                        handleCategorySelect('all');
                        setIsFilterDrawerOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                        !category || category === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      All Categories ({masterProducts.length})
                    </button>
                    {categories.map((cat) => {
                      const active = isCategoryActive(cat);
                      const count = categoryCounts[cat.slug] ?? categoryCounts[cat._id] ?? categoryCounts[cat.name?.toLowerCase()] ?? 0;
                      return (
                        <button
                          key={cat._id || cat.slug}
                          onClick={() => {
                            handleCategorySelect(cat.slug || cat._id);
                            setIsFilterDrawerOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-lg font-medium transition-colors truncate cursor-pointer flex items-center justify-between gap-2 ${
                            active ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          <span className="truncate">{cat.name}</span>
                          {count > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${active ? 'bg-slate-950/30 text-slate-950' : 'bg-festival-dark text-amber-300/80'}`}>
                              {count}
                            </span>
                          )}
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
          className="fixed bottom-20 right-6 z-30 p-3 rounded-full bg-amber-500 text-slate-950 shadow-2xl hover:bg-amber-400 transition-all cursor-pointer"
          title="Back to Top"
        >
          <ArrowUp className="w-5 h-5 font-black" />
        </motion.button>
      )}
    </div>
  );
};

export default ProductsPage;
