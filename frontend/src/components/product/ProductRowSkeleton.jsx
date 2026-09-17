import React from 'react';

/**
 * High-performance, zero-layout-shift Skeleton Loader for Product List Rows
 * Renders identically across Desktop 12-col grid and Mobile card layouts.
 */
const ProductRowSkeleton = ({ index = 0 }) => {
  return (
    <div
      className={`relative border-b border-festival-border/60 ${
        index % 2 === 0 ? 'bg-festival-card/40' : 'bg-festival-card/10'
      } animate-pulse select-none`}
    >
      {/* Desktop & Tablet Skeleton Layout */}
      <div className="hidden md:grid md:grid-cols-12 gap-3 items-center py-2.5 px-3 sm:px-4">
        {/* Col 1: Thumbnail Skeleton */}
        <div className="col-span-1 flex items-center justify-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-800/80 border border-festival-border/50" />
        </div>

        {/* Col 2: Name & Tags Skeleton */}
        <div className="col-span-4 space-y-2 pr-2">
          <div className="h-4 bg-slate-700/80 rounded w-4/5" />
          <div className="h-3 bg-slate-800 rounded w-1/2" />
          <div className="flex gap-1.5 pt-0.5">
            <div className="h-4 bg-slate-800 rounded w-16" />
            <div className="h-4 bg-slate-800 rounded w-14" />
          </div>
        </div>

        {/* Col 3: Code Pill Skeleton */}
        <div className="col-span-1 flex justify-center">
          <div className="h-6 bg-slate-800/90 rounded-md w-12" />
        </div>

        {/* Col 4: Pack Size Skeleton */}
        <div className="col-span-1 flex justify-center">
          <div className="h-5 bg-slate-800 rounded w-14" />
        </div>

        {/* Col 5: Rate Skeleton */}
        <div className="col-span-2 flex flex-col items-end space-y-1.5 pr-2">
          <div className="h-5 bg-amber-500/20 rounded w-16" />
          <div className="h-3 bg-slate-800 rounded w-12" />
        </div>

        {/* Col 6: Stepper Skeleton */}
        <div className="col-span-2 flex justify-center">
          <div className="h-8 bg-slate-900 border border-festival-border/60 rounded-xl w-24" />
        </div>

        {/* Col 7: Subtotal Skeleton */}
        <div className="col-span-1 flex justify-end">
          <div className="h-4 bg-slate-800 rounded w-8" />
        </div>
      </div>

      {/* Mobile Skeleton Layout */}
      <div className="md:hidden p-3 space-y-2.5">
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 rounded-xl bg-slate-800/80 border border-festival-border/50 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-slate-700/80 rounded w-5/6" />
            <div className="h-3 bg-slate-800 rounded w-1/2" />
            <div className="h-3.5 bg-slate-800 rounded w-20" />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-festival-border/50">
          <div className="h-4 bg-amber-500/20 rounded w-14" />
          <div className="h-7 bg-slate-900 border border-festival-border/60 rounded-xl w-24" />
          <div className="h-3.5 bg-slate-800 rounded w-10" />
        </div>
      </div>
    </div>
  );
};

export default ProductRowSkeleton;
