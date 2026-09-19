import React, { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Sparkles, Check, Package, ZoomIn, Plus, Minus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useLightbox } from '../../context/LightboxContext';
import { formatCurrency, formatProductCode } from '../../utils/formatters';
import { calculateItemPricing } from '../../utils/pricing';
import ProductImage from '../common/ProductImage';
import { getProductImages } from '../../utils/imageUrlUtils';

const ProductCard = memo(({ product, index, priority = false }) => {
  const { addToCart, cartItems } = useCart();
  const { openLightbox } = useLightbox();
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  if (!product) return null;

  const isPriority = priority || (typeof index === 'number' && index < 2);
  const currentCartItem = cartItems.find((item) => item.productId === product._id);
  const inCartQty = currentCartItem ? currentCartItem.quantity : 0;
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 10;
  const itemPricing = calculateItemPricing(product, selectedQuantity);

  const handleDecreaseQty = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncreaseQty = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedQuantity((prev) => Math.min(product.stockQuantity || 999, prev + 1));
  };

  const handleQtyInputChange = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) {
      setSelectedQuantity(1);
    } else {
      setSelectedQuantity(Math.min(product.stockQuantity || 999, val));
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product, selectedQuantity, false);
      setSelectedQuantity(1);
    }
  };

  const handleImageClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const productImages = getProductImages(product);

    openLightbox({
      images: productImages,
      startIndex: 0,
      productTitle: product.name,
      productCode: product.productCode || '',
      category: product.category?.name || product.category || '',
      product,
    });
  };

  const productDetailPath = `/product/${product.slug || product._id}`;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="group relative bg-festival-card border border-festival-border hover:border-amber-500/50 rounded-xl overflow-hidden shadow-md hover:shadow-xl hover:shadow-amber-950/20 flex flex-col justify-between transition-all duration-200"
    >
      {/* 1. Top Image & Badge Strip (Spacious ~10-15% larger image view) */}
      <div
        onClick={handleImageClick}
        className="relative aspect-square w-full bg-slate-950/70 p-2.5 sm:p-3 overflow-hidden cursor-zoom-in group/img flex items-center justify-center border-b border-festival-border/50"
        title="Click to view full size & zoom"
      >
        <ProductImage
          product={product}
          alt={product.name}
          optimizedWidth={350}
          priority={isPriority}
          componentName="ProductCard"
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          enableZoom={false}
        />

        {/* Hover Zoom Overlay Pill */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
          <span className="bg-black/85 text-amber-300 font-bold text-[10px] px-2.5 py-1 rounded-full border border-amber-500/50 backdrop-blur-md shadow-md flex items-center gap-1">
            <ZoomIn className="w-3 h-3 text-amber-400" />
            <span>Zoom</span>
          </span>
        </div>

        {/* Floating Top Left Badges: Discount & Top Pick */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
          {product.discountPercentage > 0 && (
            <span className="shimmer-badge text-slate-950 font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded shadow">
              {Math.round(product.discountPercentage)}% OFF
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-amber-500 text-slate-950 font-black text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow">
              <Sparkles className="w-2.5 h-2.5 fill-slate-950" />
              HOT
            </span>
          )}
        </div>

        {/* Top Right Product Code Badge */}
        {product.productCode && (
          <div className="absolute top-2 right-2 z-10 pointer-events-none">
            <span className="bg-black/85 text-amber-300 font-mono font-bold text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30 backdrop-blur-sm shadow">
              {formatProductCode(product.productCode)}
            </span>
          </div>
        )}

        {/* Bottom Floating Category Tag */}
        {product.category?.name && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1 z-10 pointer-events-none">
            <span className="bg-festival-dark/95 text-amber-300/90 text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-500/20 backdrop-blur-sm truncate max-w-[130px]">
              {product.category.name}
            </span>
            {product.brand && (
              <span className="bg-red-950/90 text-red-200 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-500/20">
                {product.brand}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. Card Body Info */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Product Name: 2 lines max with clean line clamp and comfortable typography */}
          <Link to={productDetailPath} title={product.name}>
            <h3 className="text-xs sm:text-[13px] font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug min-h-[2.25rem]">
              {product.name}
            </h3>
          </Link>

          {/* Pack Size / Pieces */}
          <div className="flex items-center gap-1.5 mt-1.5 text-[10px] sm:text-[11px] text-slate-400">
            {product.piecesPerPack ? (
              <span className="inline-flex items-center gap-1 font-medium text-slate-300 bg-festival-dark/90 px-1.5 py-0.5 rounded border border-festival-border/80">
                <Package className="w-2.5 h-2.5 text-amber-400" />
                {product.piecesPerPack} Pcs/Pack
              </span>
            ) : product.packSize ? (
              <span className="font-medium text-slate-300 bg-festival-dark/90 px-1.5 py-0.5 rounded border border-festival-border/80">
                {product.packSize}
              </span>
            ) : null}
          </div>
        </div>

        {/* Price & Stock Status Strip */}
        <div className="pt-2 border-t border-festival-border/50 space-y-1.5">
          {/* MRP & Discount & Savings Row */}
          <div className="flex items-center justify-between text-[11px] flex-wrap gap-1">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">MRP:</span>
              <span className="text-slate-500 line-through font-semibold font-mono">
                {formatCurrency(itemPricing.mrpPrice)}
              </span>
            </div>
            {itemPricing.discountAmount > 0 && (
              <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                You Save: {formatCurrency(itemPricing.discountAmount)}
              </span>
            )}
          </div>

          {/* Our Price & Stock Status */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-baseline gap-1">
              <span className="text-[11px] font-bold text-amber-300">Our Price:</span>
              <span className="text-sm sm:text-base font-black text-amber-400 font-mono">
                {formatCurrency(itemPricing.sellingPrice)}
              </span>
            </div>

            {/* Stock Badge */}
            <div>
              {isOutOfStock ? (
                <span className="text-[9px] font-bold text-rose-400 bg-rose-950/70 px-1.5 py-0.5 rounded border border-rose-500/30">
                  Out
                </span>
              ) : isLowStock ? (
                <span className="text-[9px] font-bold text-amber-300 bg-amber-950/70 px-1.5 py-0.5 rounded border border-amber-500/30 animate-pulse">
                  {product.stockQuantity} left
                </span>
              ) : (
                <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  In Stock
                </span>
              )}
            </div>
          </div>

          {/* 3. Quantity Selector: [-] 1 [+] */}
          {!isOutOfStock && (
            <div className="flex items-center justify-between gap-1 pt-0.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">Quantity:</span>
              <div className="flex items-center bg-festival-dark border border-festival-border rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={handleDecreaseQty}
                  disabled={selectedQuantity <= 1}
                  title="Decrease quantity"
                  className="w-6 h-6 sm:w-6.5 sm:h-6.5 flex items-center justify-center rounded text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                >
                  <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.stockQuantity}
                  value={selectedQuantity}
                  onChange={handleQtyInputChange}
                  onClick={(e) => e.stopPropagation()}
                  className="w-7 sm:w-8 text-center text-xs font-black text-amber-400 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={handleIncreaseQty}
                  disabled={selectedQuantity >= product.stockQuantity}
                  title="Increase quantity"
                  className="w-6 h-6 sm:w-6.5 sm:h-6.5 flex items-center justify-center rounded text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                >
                  <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </button>
              </div>
            </div>
          )}

          {/* 4. Add to Cart Button */}
          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`w-full py-2 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer ${
              isOutOfStock
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : inCartQty > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/30 border border-emerald-400/30'
                : 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-amber-950/30 border border-amber-400/30'
            }`}
          >
            {isOutOfStock ? (
              <span>Out of Stock</span>
            ) : inCartQty > 0 ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span className="truncate">Add +{selectedQuantity} • ({inCartQty} in Cart)</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="truncate">Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
