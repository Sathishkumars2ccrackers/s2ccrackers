import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Check, Package, ZoomIn, Plus, Minus, Tag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useLightbox } from '../../context/LightboxContext';
import { formatCurrency, formatProductCode } from '../../utils/formatters';
import ProductImage from '../common/ProductImage';
import { getProductImages } from '../../utils/imageUrlUtils';
import { calculateItemPricing } from '../../utils/pricing';

const ProductListRow = memo(({ product, index }) => {
  const { addToCart, updateQuantity, removeFromCart, cartItems } = useCart();
  const { openLightbox } = useLightbox();

  if (!product) return null;

  const currentCartItem = cartItems.find((item) => item.productId === product._id);
  const inCartQty = currentCartItem ? currentCartItem.quantity : 0;
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 10;
  
  const pricing = calculateItemPricing(product, inCartQty > 0 ? inCartQty : 1);
  const itemSubtotal = pricing.sellingPrice * inCartQty;
  const itemSavings = pricing.discountAmount * inCartQty;

  const handleDecreaseQty = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCartQty <= 1) {
      removeFromCart(product._id);
    } else {
      updateQuantity(product._id, inCartQty - 1);
    }
  };

  const handleIncreaseQty = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    if (inCartQty === 0) {
      addToCart(product, 1, false);
    } else {
      updateQuantity(product._id, inCartQty + 1);
    }
  };

  const handleQtyInputChange = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val <= 0) {
      if (inCartQty > 0) removeFromCart(product._id);
    } else {
      const clampedVal = Math.min(product.stockQuantity || 999, val);
      if (inCartQty === 0) {
        addToCart(product, clampedVal, false);
      } else {
        updateQuantity(product._id, clampedVal);
      }
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
  const isRowActive = inCartQty > 0;

  return (
    <div
      className={`group relative transition-all duration-200 border-b border-festival-border/60 hover:bg-festival-cardHover/50 ${
        isRowActive ? 'bg-amber-950/20 border-amber-500/40' : index % 2 === 0 ? 'bg-festival-card/40' : 'bg-festival-card/10'
      }`}
    >
      {/* Active in-cart indicator strip */}
      {isRowActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-red-500 shadow-glow" />
      )}

      {/* =========================================================================
          DESKTOP & TABLET VIEW (Horizontal Row Layout)
          ========================================================================= */}
      <div className="hidden md:grid md:grid-cols-12 gap-3 items-center py-2.5 px-3 sm:px-4">
        {/* Col 1: Thumbnail Image (1 Col / 80px) */}
        <div className="col-span-1 flex items-center justify-center">
          <div
            onClick={handleImageClick}
            className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-950/80 p-1 border border-festival-border group-hover:border-amber-500/50 overflow-hidden cursor-zoom-in flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105"
            title="Click to zoom image"
          >
            <ProductImage
              product={product}
              alt={product.name}
              optimizedWidth={160}
              priority={index < 3}
              componentName="ProductListRow"
              className="w-full h-full object-contain"
              enableZoom={false}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <ZoomIn className="w-4 h-4 text-amber-300" />
            </div>
          </div>
        </div>

        {/* Col 2: Product Name, Category, Badges (4 Cols) */}
        <div className="col-span-4 min-w-0 pr-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              to={productDetailPath}
              className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors leading-snug hover:underline truncate max-w-full"
              title={product.name}
            >
              {product.name}
            </Link>
          </div>

          {/* Regional Tamil Name if present */}
          {product.regionalName && (
            <p className="text-[11px] text-amber-400/90 font-medium truncate mt-0.5">
              {product.regionalName}
            </p>
          )}

          {/* Category, Brand, & Features Tags */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {product.category?.name && (
              <span className="text-[10px] font-semibold text-slate-300 bg-festival-dark px-2 py-0.5 rounded border border-festival-border/80">
                {product.category.name}
              </span>
            )}
            {product.brand && (
              <span className="text-[10px] font-bold text-red-200 bg-red-950/70 px-1.5 py-0.5 rounded border border-red-500/20">
                {product.brand}
              </span>
            )}
            {product.isFeatured && (
              <span className="text-[9px] font-black text-slate-950 bg-amber-400 px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                <Sparkles className="w-2.5 h-2.5 fill-slate-950" />
                HOT
              </span>
            )}
          </div>
        </div>

        {/* Col 3: Product Code (1 Col) */}
        <div className="col-span-1 text-center">
          <span className="inline-block bg-slate-950 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs px-2 py-1 rounded-md shadow-sm">
            {formatProductCode(product.productCode)}
          </span>
        </div>

        {/* Col 4: Pack Size (1 Col) */}
        <div className="col-span-1 text-center">
          {product.piecesPerPack ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-festival-dark/80 px-2 py-0.5 rounded border border-festival-border">
              <Package className="w-3 h-3 text-amber-400" />
              {product.piecesPerPack} Pcs
            </span>
          ) : product.packSize ? (
            <span className="text-xs font-semibold text-slate-300 bg-festival-dark/80 px-2 py-0.5 rounded border border-festival-border">
              {product.packSize}
            </span>
          ) : (
            <span className="text-xs text-slate-400">1 Box</span>
          )}
        </div>

        {/* Col 5: Price & Discount (2 Cols) */}
        <div className="col-span-2 text-right pr-2">
          <div className="flex flex-col items-end">
            <span className="text-base font-black text-amber-400">
              {formatCurrency(pricing.sellingPrice)}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {pricing.mrpPrice > pricing.sellingPrice && (
                <span className="text-[11px] text-slate-500 line-through">
                  MRP {formatCurrency(pricing.mrpPrice)}
                </span>
              )}
              {pricing.discountPercent > 0 && (
                <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  {pricing.discountPercent}% OFF
                </span>
              )}
            </div>
            {pricing.discountAmount > 0 && (
              <span className="text-[10px] font-bold text-emerald-400 mt-0.5">
                Save {formatCurrency(pricing.discountAmount)}
              </span>
            )}
            {isOutOfStock ? (
              <span className="text-[9px] font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/30 mt-0.5">
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="text-[9px] font-bold text-amber-300 animate-pulse mt-0.5">
                Only {product.stockQuantity} left
              </span>
            ) : null}
          </div>
        </div>

        {/* Col 6: Quantity Selector (2 Cols) */}
        <div className="col-span-2 flex items-center justify-center">
          {isOutOfStock ? (
            <span className="text-xs text-slate-500 italic">Unavailable</span>
          ) : (
            <div className="flex items-center bg-slate-950 border border-festival-border rounded-xl p-0.5 shadow-inner">
              <button
                type="button"
                onClick={handleDecreaseQty}
                disabled={inCartQty === 0}
                title="Decrease quantity"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min="0"
                max={product.stockQuantity}
                value={inCartQty}
                onChange={handleQtyInputChange}
                onClick={(e) => e.stopPropagation()}
                className="w-10 text-center text-xs font-black text-amber-400 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={handleIncreaseQty}
                disabled={inCartQty >= product.stockQuantity}
                title="Increase quantity"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Col 7: Subtotal (1 Col) */}
        <div className="col-span-1 text-right">
          {isRowActive ? (
            <div className="flex flex-col items-end">
              <span className="text-sm font-black text-emerald-400">
                {formatCurrency(itemSubtotal)}
              </span>
              {itemSavings > 0 && (
                <span className="text-[10px] font-bold text-emerald-300/90">
                  Save {formatCurrency(itemSavings)}
                </span>
              )}
              <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5 mt-0.5">
                <Check className="w-2.5 h-2.5" />
                In Cart
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-600 font-mono">—</span>
          )}
        </div>
      </div>

      {/* =========================================================================
          MOBILE VIEW (Compact Horizontal Card Layout)
          ========================================================================= */}
      <div className="md:hidden p-3 space-y-2.5">
        <div className="flex items-start gap-3">
          {/* Mobile Thumbnail */}
          <div
            onClick={handleImageClick}
            className="relative w-16 h-16 rounded-xl bg-slate-950/80 p-1 border border-festival-border flex-shrink-0 flex items-center justify-center cursor-zoom-in"
          >
            <ProductImage
              product={product}
              alt={product.name}
              optimizedWidth={140}
              priority={index < 3}
              componentName="ProductListRowMobile"
              className="w-full h-full object-contain"
              enableZoom={false}
            />
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-slate-950 border border-amber-500/40 text-amber-300 font-mono font-bold text-[9px] px-1.5 rounded shadow">
              {formatProductCode(product.productCode)}
            </span>
          </div>

          {/* Title & Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <Link
                to={productDetailPath}
                className="text-xs sm:text-sm font-bold text-white hover:text-amber-400 line-clamp-2 leading-snug"
              >
                {product.name}
              </Link>
            </div>

            {product.regionalName && (
              <p className="text-[10px] text-amber-400/90 font-medium truncate mt-0.5">
                {product.regionalName}
              </p>
            )}

            <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[10px]">
              {product.category?.name && (
                <span className="text-slate-300 bg-festival-dark px-1.5 py-0.5 rounded border border-festival-border">
                  {product.category.name}
                </span>
              )}
              {product.piecesPerPack ? (
                <span className="text-slate-300 bg-festival-dark px-1.5 py-0.5 rounded border border-festival-border">
                  {product.piecesPerPack} Pcs
                </span>
              ) : product.packSize ? (
                <span className="text-slate-300 bg-festival-dark px-1.5 py-0.5 rounded border border-festival-border">
                  {product.packSize}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Price, Stepper, & Subtotal Row */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-festival-border/50">
          {/* Price */}
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm font-black text-amber-400">
                {formatCurrency(pricing.sellingPrice)}
              </span>
              {pricing.mrpPrice > pricing.sellingPrice && (
                <span className="text-[10px] text-slate-500 line-through">
                  MRP {formatCurrency(pricing.mrpPrice)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {pricing.discountPercent > 0 && (
                <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-950/70 px-1 py-0.2 rounded border border-emerald-500/30">
                  {pricing.discountPercent}% OFF
                </span>
              )}
              {pricing.discountAmount > 0 && (
                <span className="text-[9px] font-bold text-emerald-400">
                  Save {formatCurrency(pricing.discountAmount)}
                </span>
              )}
            </div>
            {isOutOfStock ? (
              <span className="text-[9px] font-bold text-rose-400 bg-rose-950/60 px-1 py-0.5 rounded">
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="text-[9px] font-bold text-amber-300">
                {product.stockQuantity} left
              </span>
            ) : null}
          </div>

          {/* Stepper */}
          {!isOutOfStock ? (
            <div className="flex items-center bg-slate-950 border border-festival-border rounded-xl p-0.5">
              <button
                type="button"
                onClick={handleDecreaseQty}
                disabled={inCartQty === 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min="0"
                max={product.stockQuantity}
                value={inCartQty}
                onChange={handleQtyInputChange}
                onClick={(e) => e.stopPropagation()}
                className="w-9 text-center text-xs font-black text-amber-400 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={handleIncreaseQty}
                disabled={inCartQty >= product.stockQuantity}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic">Sold Out</span>
          )}

          {/* Subtotal */}
          <div className="text-right min-w-[70px]">
            {isRowActive ? (
              <div>
                <span className="text-xs font-black text-emerald-400 block">
                  {formatCurrency(itemSubtotal)}
                </span>
                {itemSavings > 0 && (
                  <span className="text-[9px] text-emerald-300/90 block">
                    Save {formatCurrency(itemSavings)}
                  </span>
                )}
                <span className="text-[9px] font-bold text-emerald-300">
                  ✓ In Cart
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-500 font-mono">₹0</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ProductListRow.displayName = 'ProductListRow';

export default ProductListRow;
