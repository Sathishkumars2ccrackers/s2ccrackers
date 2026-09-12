import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Flame,
  ArrowLeft,
  Volume2,
  Clock,
  Award,
} from 'lucide-react';
import { productService } from '../services/api';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/formatters';
import ProductCard from '../components/product/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, openCart } = useCart();
  const { deliveryMessage } = useSettings();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await productService.getProductByIdentifier(slug);
        if (res.data?.success && res.data.product) {
          setProduct(res.data.product);
          setRelatedProducts(res.data.relatedProducts || []);
          setSelectedImageIndex(0);
          setQuantity(1);
        } else {
          setError('Product not found.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  const handleAddToCart = (openDrawer = false) => {
    if (product && product.stockQuantity > 0) {
      addToCart(product, quantity, openDrawer);
    }
  };

  const handleBuyNow = () => {
    if (product && product.stockQuantity > 0) {
      addToCart(product, quantity, false);
      navigate('/checkout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-festival-dark">
        <LoadingSpinner text="Loading Sivakasi fireworks specifications..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-festival-dark px-4 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-2xl font-bold text-white">Product Not Found</h2>
        <p className="text-slate-400 text-sm max-w-md">{error || 'This cracker may have been discontinued or moved.'}</p>
        <Link
          to="/products"
          className="px-6 py-2.5 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 hover:bg-amber-400"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse All Sivakasi Crackers</span>
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stockQuantity <= 0;
  const savings = Math.max(0, (product.originalPrice || product.price) - product.price);
  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600'];

  return (
    <div className="min-h-screen bg-festival-dark py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Breadcrumb Bar */}
        <nav className="flex items-center space-x-2 text-xs text-slate-400">
          <Link to="/" className="hover:text-amber-400">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-amber-400">All Crackers</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link to={`/products?category=${product.category.slug || product.category._id}`} className="hover:text-amber-400 font-semibold">
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-amber-300 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Product Main Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-festival-card border border-festival-border rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl">
          {/* Left Column: Image Gallery (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square rounded-2xl overflow-hidden bg-festival-dark border border-festival-border"
            >
              <img
                src={images[selectedImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
              />

              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                {product.isFeatured && (
                  <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                    <Sparkles className="w-3 h-3 fill-white" />
                    Bestseller
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase shadow-md">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center">
                  <span className="px-4 py-2 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-xl">
                    Sold Out
                  </span>
                </div>
              )}
            </motion.div>

            {/* Thumbnail Carousel */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      selectedImageIndex === idx
                        ? 'border-amber-400 ring-2 ring-amber-400/30'
                        : 'border-festival-border opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details & Purchasing Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Header / Category & Brand */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase">
                  {product.category?.name || 'Sivakasi Fireworks'}
                </span>
                {product.brand && (
                  <span className="text-xs text-slate-400 font-semibold">
                    Brand: <strong className="text-slate-200">{product.brand}</strong>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                {product.name}
              </h1>

              {product.tamilName && (
                <p className="text-sm font-semibold text-amber-300/90 font-sans">
                  {product.tamilName}
                </p>
              )}
            </div>

            {/* Pricing Section */}
            <div className="p-4 rounded-2xl bg-festival-dark/70 border border-festival-border space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-amber-400">
                  {formatCurrency(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-lg text-slate-500 line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
                {savings > 0 && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                    Save {formatCurrency(savings)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Inclusive of all factory taxes. Direct Sivakasi factory rate.
              </p>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-festival-dark/50 border border-festival-border text-xs space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Pack Contents</span>
                <p className="font-bold text-white">{product.packSize || '1 Box'}</p>
              </div>

              <div className="p-3 rounded-xl bg-festival-dark/50 border border-festival-border text-xs space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Sound Level</span>
                <p className="font-bold text-amber-300 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{product.soundLevel || 'Medium'}</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-festival-dark/50 border border-festival-border text-xs space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Stock Availability</span>
                <p
                  className={`font-bold ${
                    isOutOfStock
                      ? 'text-rose-400'
                      : product.stockQuantity <= 10
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {isOutOfStock ? 'Out of Stock' : `${product.stockQuantity} boxes ready`}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-festival-dark/50 border border-festival-border text-xs space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Dispatch Status</span>
                <p className="font-bold text-white flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fast Dispatch</span>
                </p>
              </div>
            </div>

            {/* Product Description */}
            {product.description && (
              <div className="space-y-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <h3 className="font-bold text-white uppercase text-xs tracking-wider">Product Highlights</h3>
                <p>{product.description}</p>
              </div>
            )}

            {/* Safety Guidelines */}
            {product.safetyTips && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                <span className="font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Safety Instructions
                </span>
                <p className="text-slate-300">{product.safetyTips}</p>
              </div>
            )}

            {/* Purchasing Controls */}
            <div className="space-y-4 pt-2">
              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-300 uppercase">Quantity (Boxes):</span>
                <div className="flex items-center bg-festival-dark border border-festival-border rounded-xl p-1">
                  <button
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 disabled:opacity-30"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-bold text-sm text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity((prev) => Math.min(product.stockQuantity, prev + 1))}
                    disabled={quantity >= product.stockQuantity || isOutOfStock}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 disabled:opacity-30"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-slate-400">
                  Total: <strong className="text-amber-400">{formatCurrency(product.price * quantity)}</strong>
                </span>
              </div>

              {/* Action Buttons: Add to Cart & Buy Now */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  disabled={isOutOfStock}
                  onClick={() => handleAddToCart(false)}
                  className="py-3.5 px-4 rounded-xl bg-festival-card hover:bg-festival-cardHover border border-amber-500/40 text-amber-300 hover:text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Festival Cart</span>
                </button>
                <button
                  disabled={isOutOfStock}
                  onClick={handleBuyNow}
                  className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 hover:from-red-500 hover:to-orange-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-950/40 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Flame className="w-4 h-4 text-slate-950 fill-slate-950" />
                  <span>Buy Now (Door Delivery)</span>
                </button>
              </div>

              {/* Nationwide All-India Delivery Banner */}
              <div className="p-4 rounded-2xl bg-festival-dark/80 border border-emerald-500/30 space-y-1.5 mt-4">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Truck className="w-4 h-4 text-emerald-400" />
                  <span>All-India Delivery Available</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  We deliver across India. Delivery availability will be confirmed after order review.
                </p>
              </div>
            </div>

            {/* Safety & Factory Guarantee Bar */}
            <div className="pt-4 border-t border-festival-border/60 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>{deliveryMessage || 'Door Delivery Available'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <Award className="w-4 h-4" />
                <span>PESO Safety Approved</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Truck className="w-4 h-4" />
                <span>Factory Packed in Sivakasi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Carousel */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Similar Sivakasi Fireworks
              </h2>
              <Link
                to={product.category?.slug ? `/products?category=${product.category.slug}` : '/products'}
                className="text-xs font-bold text-amber-400 hover:underline"
              >
                View More in {product.category?.name || 'Category'} →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
