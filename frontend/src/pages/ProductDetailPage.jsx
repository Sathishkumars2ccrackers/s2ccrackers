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
  MapPin,
  Flame,
  ArrowLeft,
  Volume2,
  Clock,
  Award,
} from 'lucide-react';
import { productService, pincodeService } from '../services/api';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatters';
import ProductCard from '../components/product/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, openCart, pincodeInfo, setPincodeInfo } = useCart();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Inline Pincode Check
  const [checkPin, setCheckPin] = useState(pincodeInfo?.pincode || '');
  const [pinResult, setPinResult] = useState(pincodeInfo || null);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');

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

  const handlePincodeVerify = async (e) => {
    e.preventDefault();
    if (!checkPin || checkPin.length !== 6) {
      setPinError('Enter 6-digit PIN code');
      return;
    }
    setPinLoading(true);
    setPinError('');
    try {
      const res = await pincodeService.checkPincode(checkPin);
      if (res.data?.success) {
        setPinResult(res.data);
        if (res.data.serviceable) {
          setPincodeInfo(res.data);
        }
      }
    } catch (err) {
      setPinError('Failed to verify delivery.');
    } finally {
      setPinLoading(false);
    }
  };

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
        <LoadingSpinner text="Loading cracker specifications..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-festival-dark px-4 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold text-white">Product Not Found</h2>
        <p className="text-xs text-slate-400 max-w-sm">{error || 'The requested fireworks product is no longer available.'}</p>
        <Link
          to="/products"
          className="px-6 py-2.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-full shadow-lg"
        >
          Back to Catalog
        </Link>
      </div>
    );
  }

  const images =
    product.images && product.images.length > 0
      ? product.images
      : ['https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800'];

  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 10;
  const savings = (product.originalPrice || product.price) - product.price;

  return (
    <div className="min-h-screen bg-festival-dark py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link to="/" className="hover:text-amber-400">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-amber-400">Crackers</Link>
          <span>/</span>
          {product.category?.name && (
            <>
              <Link to={`/products?category=${product.category.slug}`} className="hover:text-amber-400">
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-slate-200 font-bold truncate max-w-[200px]">{product.name}</span>
        </div>

        {/* Product Details Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-festival-card/40 border border-festival-border p-6 sm:p-10 rounded-3xl">
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-festival-dark border border-amber-500/20 shadow-2xl">
              <img
                src={images[selectedImageIndex] || images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />

              {/* Floating Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.discountPercentage > 0 && (
                  <span className="shimmer-badge text-slate-950 font-black text-xs px-3 py-1 rounded-full shadow-lg">
                    {Math.round(product.discountPercentage)}% OFF SIVAKASI MRP
                  </span>
                )}
                {product.isFeatured && (
                  <span className="bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                    FEATURED FESTIVAL PICK
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Selector */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      selectedImageIndex === i ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/30' : 'border-festival-border opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`${product.name} thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info & Purchase Card */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Category, Brand, Product Code & Sound badges */}
              <div className="flex flex-wrap items-center gap-2">
                {product.productCode && (
                  <span className="px-3 py-1 rounded-full bg-black/80 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold shadow-sm">
                    Item Code: #{product.productCode}
                  </span>
                )}
                {product.brand && (
                  <span className="px-3 py-1 rounded-full bg-red-950/90 border border-red-500/40 text-red-200 text-xs font-bold shadow-sm">
                    Brand: {product.brand}
                  </span>
                )}
                {product.category?.name && (
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                    {product.category.name}
                  </span>
                )}
                {product.piecesPerPack ? (
                  <span className="px-3 py-1 rounded-full bg-festival-dark border border-festival-border text-slate-200 text-xs font-medium">
                    {product.piecesPerPack} Pieces / Pack
                  </span>
                ) : null}
                {product.soundLevel && (
                  <span className="px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs font-medium flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5" />
                    {product.soundLevel}
                  </span>
                )}
              </div>

              {/* Title & Regional Name */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
                  {product.name}
                </h1>
                {product.regionalName && (
                  <p className="text-sm font-semibold text-amber-400/90 mt-1">{product.regionalName}</p>
                )}
              </div>

              {/* Price Banner */}
              <div className="p-4 rounded-2xl bg-festival-dark/90 border border-festival-border flex items-baseline justify-between">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-amber-400">{formatCurrency(product.price)}</span>
                    {product.originalPrice > product.price && (
                      <span className="text-base text-slate-400 line-through">
                        {formatCurrency(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  {savings > 0 && (
                    <p className="text-xs font-bold text-emerald-400 mt-1">
                      You Save {formatCurrency(savings * quantity)} ({Math.round(product.discountPercentage)}% Off)
                    </p>
                  )}
                </div>
                <div className="text-right text-xs text-slate-400">
                  <span className="block font-bold text-slate-200">{product.packSize || '1 Box'}</span>
                  <span>Direct Factory Rate</span>
                </div>
              </div>

              {/* Stock Status Indicator */}
              <div className="flex items-center gap-2">
                {isOutOfStock ? (
                  <span className="px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-bold">
                    Out of Stock
                  </span>
                ) : isLowStock ? (
                  <span className="px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold animate-pulse">
                    🔥 Hurry! Only {product.stockQuantity} box(es) left in factory stock
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    In Stock • Ready for Sivakasi Dispatch
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{product.description}</p>

              {/* Quantity Selector */}
              {!isOutOfStock && (
                <div className="flex items-center gap-4 pt-2">
                  <span className="text-xs font-bold text-slate-300 uppercase">Quantity:</span>
                  <div className="flex items-center border border-festival-border rounded-xl bg-festival-dark">
                    <button
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      className="p-2.5 text-slate-400 hover:text-white transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 text-sm font-bold text-white min-w-[36px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((prev) => Math.min(product.stockQuantity, prev + 1))}
                      className="p-2.5 text-slate-400 hover:text-white transition-colors"
                      disabled={quantity >= product.stockQuantity}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-400">
                    Total: <strong className="text-white">{formatCurrency(product.price * quantity)}</strong>
                  </span>
                </div>
              )}

              {/* Action Buttons */}
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
                  <span>Buy on COD (Cash on Delivery)</span>
                </button>
              </div>

              {/* Pincode Availability Checker Widget */}
              <div className="p-4 rounded-2xl bg-festival-dark/80 border border-festival-border space-y-2 mt-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>Check Delivery To Your PIN Code:</span>
                </div>
                <form onSubmit={handlePincodeVerify} className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={checkPin}
                    onChange={(e) => setCheckPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Enter 6-digit Pincode"
                    className="flex-1 bg-festival-card border border-festival-border rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={pinLoading || checkPin.length !== 6}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition-colors"
                  >
                    {pinLoading ? 'Checking...' : 'Verify'}
                  </button>
                </form>

                {pinError && <p className="text-[11px] text-rose-400">{pinError}</p>}
                {pinResult && (
                  <p
                    className={`text-[11px] font-medium ${
                      pinResult.serviceable ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {pinResult.message}
                  </p>
                )}
              </div>
            </div>

            {/* Safety & Factory Guarantee Bar */}
            <div className="pt-4 border-t border-festival-border/60 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>100% Cash On Delivery</span>
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
              <Link to="/products" className="text-xs font-bold text-amber-400 hover:underline">
                View All →
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
