import React from 'react';

/**
 * High-performance, zero-layout-shift Skeleton Loader for Product Cards
 * Renders an exact layout match with shimmering placeholders.
 */
const ProductCardSkeleton = () => {
  return (
    <div className="bg-festival-card border border-festival-border rounded-xl overflow-hidden shadow-md flex flex-col justify-between animate-pulse select-none">
      {/* Square Image Placeholder */}
      <div className="aspect-square w-full bg-slate-900 border-b border-festival-border/50 relative p-3 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-slate-800/80" />
        <div className="absolute top-2 left-2 w-14 h-4 bg-slate-800 rounded" />
        <div className="absolute top-2 right-2 w-10 h-4 bg-slate-800 rounded" />
      </div>

      {/* Body Info */}
      <div className="p-3 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          <div className="h-4 bg-slate-700/80 rounded w-5/6" />
          <div className="h-3.5 bg-slate-800 rounded w-2/3" />
          <div className="h-3 bg-slate-800/60 rounded w-16" />
        </div>

        <div className="pt-2 border-t border-festival-border/50 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="h-5 bg-amber-500/20 rounded w-16" />
            <div className="h-4 bg-slate-800 rounded w-12" />
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <div className="h-3 bg-slate-800 rounded w-12" />
            <div className="h-6 bg-slate-900 rounded-lg w-20 border border-festival-border/60" />
          </div>

          {/* Button placeholder */}
          <div className="w-full h-8 rounded-lg bg-gradient-to-r from-red-950/60 to-amber-950/60 border border-amber-500/20" />
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
