import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, Sparkles, RefreshCw } from 'lucide-react';
import {
  getProductImage,
  getProductImages,
  FESTIVE_PLACEHOLDER_SVG,
  logImageError,
} from '../../utils/imageUrlUtils';
import { useLightbox } from '../../context/LightboxContext';
import { trackImageClick } from '../../utils/imageAnalytics';

/**
 * High-Performance Optimized Image Component
 * 
 * Features:
 * - Intersection Observer: Defers image download until within 200px of viewport
 * - Priority mode: High fetchPriority and eager loading for above-the-fold content (hero/first rows)
 * - Cloudinary optimization: Automatically requests f_auto,q_auto,w_<size>
 * - Skeleton placeholder: Lightweight shimmer keeping exact aspect ratio with ZERO layout shifts
 * - Smooth fade-in on load (opacity-0 to opacity-100)
 * - Fault-tolerant auto-retry and festive SVG fallback
 * - Integrated zoom and Lightbox triggers
 */
const OptimizedImage = ({
  src,
  alt = 'S2C Sivakasi Crackers',
  product,
  className = 'w-full h-full object-contain',
  containerClassName = '',
  aspectRatio = 'aspect-square',
  optimizedWidth = 300,
  optimizedHeight,
  priority = false,
  fetchPriority = priority ? 'high' : 'auto',
  lazy = !priority,
  enableZoom = false,
  showZoomHint = false,
  zoomHintText = 'Click to zoom',
  componentName = 'OptimizedImage',
  onClick,
}) => {
  const containerRef = useRef(null);
  const [isInView, setIsInView] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(null);
  const retryTimerRef = useRef(null);

  let openLightboxSafe = null;
  try {
    const lightbox = useLightbox();
    openLightboxSafe = lightbox?.openLightbox;
  } catch {
    // Lightbox provider might be absent in isolated contexts
  }

  // Resolve single canonical image URL with requested optimization parameters
  const resolvedImageUrl = getProductImage(product || src, {
    width: optimizedWidth,
    height: optimizedHeight,
    quality: 'auto',
  });

  const productId = product?._id || product?.id || product?.productId || 'N/A';
  const productName = product?.name || alt || 'Fireworks Item';
  const seoAltText = `${productName} - Authentic Sivakasi Fireworks`;

  // 1. Intersection Observer: trigger image loading when within 120px of viewport
  useEffect(() => {
    if (priority || isInView) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '120px 0px', // Just-in-time pre-loading before scrolling into view
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority, isInView]);

  // 2. Manage image source and reset states upon URL/product change
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setRetryCount(0);

    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

    if (!resolvedImageUrl || resolvedImageUrl === FESTIVE_PLACEHOLDER_SVG) {
      setCurrentSrc(FESTIVE_PLACEHOLDER_SVG);
      setIsLoaded(true);
      return;
    }

    if (isInView) {
      setCurrentSrc(resolvedImageUrl);
    }

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [resolvedImageUrl, isInView]);

  const handleImageLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    setRetryCount(0);
  };

  const handleImageError = () => {
    if (retryCount < 2) {
      const nextRetry = retryCount + 1;
      setRetryCount(nextRetry);
      const delay = nextRetry === 1 ? 800 : 1500;

      retryTimerRef.current = setTimeout(() => {
        const separator = resolvedImageUrl.includes('?') ? '&' : '?';
        const retryUrl = `${resolvedImageUrl}${separator}retry=${Date.now()}`;
        setCurrentSrc(retryUrl);
      }, delay);
      return;
    }

    setIsLoaded(true);
    setHasError(true);
    setCurrentSrc(FESTIVE_PLACEHOLDER_SVG);

    logImageError({
      url: resolvedImageUrl,
      productId,
      productName,
      componentName,
      error: new Error(`Image failed after 2 retry attempts`),
    });
  };

  const handleContainerClick = (e) => {
    trackImageClick({ productId, productName, componentName });

    if (onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick(e);
      return;
    }

    if (enableZoom && openLightboxSafe) {
      e.preventDefault();
      e.stopPropagation();

      const galleryImages = getProductImages(product || src);

      openLightboxSafe({
        images: galleryImages.length > 0 ? galleryImages : [FESTIVE_PLACEHOLDER_SVG],
        startIndex: 0,
        productTitle: productName,
        productCode: product?.productCode || '',
        category: product?.category?.name || product?.category || '',
        product,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      className={`relative overflow-hidden select-none ${aspectRatio} ${containerClassName} ${
        enableZoom || onClick ? 'cursor-zoom-in group/img' : ''
      }`}
      style={{ userSelect: 'none', WebkitUserDrag: 'none' }}
    >
      {/* 1. Lightweight Skeleton Shimmer Placeholder (Zero Layout Shift) */}
      {(!isLoaded || !isInView) && !hasError && (
        <div className="absolute inset-0 bg-[#12081f] flex flex-col items-center justify-center z-0">
          <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
            {retryCount > 0 ? (
              <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-400/60 animate-pulse" />
            )}
          </div>
          {/* Subtle Shimmer Sweep */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-amber-500/10 to-transparent pointer-events-none" />
        </div>
      )}

      {/* 2. Optimized Image Element with Native Lazy Loading & Async Decoding */}
      {isInView && currentSrc && (
        <img
          src={currentSrc}
          alt={seoAltText}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={fetchPriority === 'high' ? 'high' : undefined}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`${className} transition-opacity duration-300 ease-in-out ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${hasError ? 'p-2 bg-festival-dark object-contain' : ''}`}
          style={{ userSelect: 'none', WebkitUserDrag: 'none', pointerEvents: 'auto' }}
        />
      )}

      {/* 3. Hover Zoom Indicator Badge */}
      {(enableZoom || showZoomHint) && (
        <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
          <span className="bg-black/85 text-amber-300 font-bold text-[10px] px-2.5 py-1 rounded-full border border-amber-500/40 backdrop-blur-md shadow-lg flex items-center gap-1">
            <ZoomIn className="w-3 h-3 text-amber-400" />
            <span>{zoomHintText}</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
