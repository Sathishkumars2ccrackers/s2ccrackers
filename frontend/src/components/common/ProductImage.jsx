import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, Sparkles, RefreshCw } from 'lucide-react';
import {
  getProductImage,
  getProductImages,
  normalizeImageUrl,
  getOptimizedImageUrl,
  FESTIVE_PLACEHOLDER_SVG,
  logImageError,
} from '../../utils/imageUrlUtils';
import { useLightbox } from '../../context/LightboxContext';
import { trackImageClick } from '../../utils/imageAnalytics';

/**
 * Premium, Fault-Tolerant Product Image Component
 * Features:
 * - Single canonical image resolution via getProductImage
 * - 2-stage auto-retry mechanism on network glitches
 * - Download protection (disabled drag & right click)
 * - Shimmer skeleton loading state
 * - Automatic WebP / AVIF negotiation
 * - Click-to-Zoom Lightbox integration
 * - Analytics tracking & diagnostic logging
 */
const ProductImage = ({
  src,
  alt = 'S2C Sivakasi Cracker',
  product,
  className = 'w-full h-full object-cover',
  containerClassName = '',
  aspectRatio = 'aspect-square',
  optimizedWidth,
  optimizedHeight,
  lazy = true,
  fetchPriority = 'auto',
  enableZoom = false,
  showZoomHint = false,
  zoomHintText = 'Click to zoom',
  componentName = 'ProductImage',
  onClick,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [imgSrc, setImgSrc] = useState(FESTIVE_PLACEHOLDER_SVG);
  const retryTimerRef = useRef(null);

  let openLightboxSafe = null;
  try {
    const lightbox = useLightbox();
    openLightboxSafe = lightbox?.openLightbox;
  } catch {
    // Lightbox provider might be outside
  }

  // Canonical Single Source of Truth Resolution
  const resolvedImageUrl = getProductImage(product || src, {
    width: optimizedWidth,
    height: optimizedHeight,
    quality: 'auto',
  });

  const productId = product?._id || product?.id || product?.productId || 'N/A';
  const productName = product?.name || alt || 'Fireworks Item';
  const seoAltText = `${productName} - Authentic Sivakasi Fireworks`;

  // Diagnostic logging for every product render (Task 1 & Task 11)
  useEffect(() => {
    if (product || src) {
      console.log({
        productId: product?._id || product?.id || product?.productId || 'direct-src',
        productName,
        image: product?.image,
        imageUrl: product?.imageUrl,
        images: product?.images,
        imageUrlReceivedFromAPI: product?.images?.[0] || product?.imageUrl || product?.image || (typeof src === 'string' ? src : 'NONE'),
        finalRenderedImage: resolvedImageUrl,
      });
    }
  }, [product, src, productName, resolvedImageUrl]);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setRetryCount(0);

    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

    if (!resolvedImageUrl || resolvedImageUrl === FESTIVE_PLACEHOLDER_SVG) {
      setImgSrc(FESTIVE_PLACEHOLDER_SVG);
      setIsLoading(false);
      return;
    }

    setImgSrc(resolvedImageUrl);

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [resolvedImageUrl]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
    setRetryCount(0);
  };

  const handleImageError = () => {
    // Retry logic: Attempt reload up to 2 times with delay
    if (retryCount < 2) {
      const nextRetry = retryCount + 1;
      setRetryCount(nextRetry);
      const delay = nextRetry === 1 ? 800 : 1500;

      retryTimerRef.current = setTimeout(() => {
        // Fallback or retry with cache-busting timestamp
        const separator = resolvedImageUrl.includes('?') ? '&' : '?';
        const retryUrl = `${resolvedImageUrl}${separator}retry=${Date.now()}`;
        setImgSrc(retryUrl);
      }, delay);
      return;
    }

    // Retries exhausted -> fallback to festive SVG placeholder
    setIsLoading(false);
    setHasError(true);
    setImgSrc(FESTIVE_PLACEHOLDER_SVG);

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
      onClick={handleContainerClick}
      onContextMenu={(e) => e.preventDefault()} // Download protection: Block right-click save
      onDragStart={(e) => e.preventDefault()} // Download protection: Block drag
      className={`relative overflow-hidden select-none ${aspectRatio} ${containerClassName} ${
        enableZoom || onClick ? 'cursor-zoom-in group/img' : ''
      }`}
      style={{ userSelect: 'none', WebkitUserDrag: 'none' }}
    >
      {/* 1. Shimmer / Skeleton Loader */}
      {isLoading && (
        <div className="absolute inset-0 bg-festival-dark animate-pulse flex flex-col items-center justify-center z-0">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center animate-spin">
            {retryCount > 0 ? (
              <RefreshCw className="w-4 h-4 text-amber-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <span className="text-[10px] text-amber-400/80 font-bold mt-2 tracking-wider">
            {retryCount > 0 ? `Reconnecting (${retryCount}/2)...` : 'Loading...'}
          </span>
          {/* Shimmer sweep effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-amber-500/10 to-transparent" />
        </div>
      )}

      {/* 2. Main Image Element */}
      <img
        src={imgSrc}
        alt={seoAltText}
        loading={fetchPriority === 'high' ? 'eager' : (lazy ? 'lazy' : 'eager')}
        decoding="async"
        fetchPriority={fetchPriority}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`${className} transition-all duration-500 ${
          isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        } ${hasError ? 'p-3 bg-festival-dark object-contain' : ''}`}
        style={{ userSelect: 'none', WebkitUserDrag: 'none', pointerEvents: 'auto' }}
      />

      {/* 3. Zoom Badge / Hint Indicator on Hover */}
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

export default ProductImage;
