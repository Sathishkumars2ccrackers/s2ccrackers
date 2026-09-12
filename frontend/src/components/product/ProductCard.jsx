import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Sparkles, Check, Package, Tag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';

const ProductCard = ({ product }) => {
  const { addToCart, cartItems } = useCart();

  if (!product) return null;

  const currentCartItem = cartItems.find((item) => item.productId === product._id);
  const inCartQty = currentCartItem ? currentCartItem.quantity : 0;
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 10;
  const inStock = product.stockQuantity > 10;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product, 1, false);
    }
  };

  const imageSrc =
    product.images && product.images.length > 0
      ? product.images[0]
      : 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=500';

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group relative bg-festival-card border border-festival-border hover:border-amber-500/50 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-amber-950/30 flex flex-col justify-between transition-all duration-300"
    >
      {/* Top Image & Badge Strip */}
      <div className="relative aspect-square w-full bg-festival-dark overflow-hidden">
        <Link to={`/products/${product.slug || product._id}`}>
          <img
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
          />
        </Link>

        {/* Floating Badges (Discount & Top Pick) */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.discountPercentage > 0 && (
            <span className="shimmer-badge text-slate-950 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full shadow-md">
              {Math.round(product.discountPercentage)}% OFF
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-amber-500/90 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1 shadow-md">
              <Sparkles className="w-3 h-3 text-slate-950 fill-slate-950" />
              TOP PICK
            </span>
          )}
        </div>

        {/* Product Code Badge */}
        {product.productCode && (
          <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
            <span className="bg-black/80 text-amber-300 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md border border-amber-500/30 backdrop-blur-md shadow">
              #{product.productCode}
            </span>
          </div>
        )}

        {/* Category & Brand Pills */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 z-10 pointer-events-none">
          {product.category?.name && (
            <Link
              to={`/products?category=${product.category.slug || product.category._id}`}
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto bg-festival-dark/90 hover:bg-amber-500 hover:text-slate-950 text-amber-300/95 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-amber-500/30 backdrop-blur-sm truncate max-w-[130px] transition-colors"
            >
              {product.category.name}
            </Link>
          )}
          {product.brand && (
            <span className="bg-red-950/90 text-red-200 text-[10px] font-bold px-2 py-0.5 rounded-md border border-red-500/30 backdrop-blur-sm">
              {product.brand}
            </span>
          )}
        </div>
      </div>

      {/* Card Info Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <Link to={`/products/${product.slug || product._id}`}>
            <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
          
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
            {product.piecesPerPack ? (
              <span className="flex items-center gap-1 font-medium text-slate-300 bg-festival-dark/80 px-1.5 py-0.5 rounded border border-festival-border">
                <Package className="w-3 h-3 text-amber-400" />
                {product.piecesPerPack} Pcs/Pack
              </span>
            ) : product.packSize ? (
              <span className="font-medium text-slate-300">{product.packSize}</span>
            ) : null}
          </div>

          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price, Stock & Action Button */}
        <div className="pt-2 border-t border-festival-border/60 space-y-2.5">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-amber-400">{formatCurrency(product.price)}</span>
              {product.originalPrice > product.price && (
                <span className="text-xs text-slate-400 line-through">
                  {formatCurrency(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Stock Indicator Status */}
            <div>
              {isOutOfStock ? (
                <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                  Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30 animate-pulse">
                  Only {product.stockQuantity} left
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
                  In Stock
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
              isOutOfStock
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : inCartQty > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 border border-emerald-400/40'
                : 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-amber-950/40 border border-amber-400/30'
            }`}
          >
            {isOutOfStock ? (
              <span>Out of Stock</span>
            ) : inCartQty > 0 ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>In Cart ({inCartQty}) • Add More</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
