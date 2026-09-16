import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Maximize2,
  Minimize2,
  ExternalLink,
} from 'lucide-react';
import { useLightbox } from '../../context/LightboxContext';
import {
  getHighResImageUrl,
  FESTIVE_PLACEHOLDER_SVG,
  logImageError,
} from '../../utils/imageUrlUtils';
import { trackZoomUsage, trackLightboxOpen } from '../../utils/imageAnalytics';
import { formatProductCode } from '../../utils/formatters';
import { Link } from 'react-router-dom';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

const ProductImageLightbox = () => {
  const {
    isOpen,
    images,
    currentIndex,
    productTitle,
    productCode,
    category,
    product,
    closeLightbox,
    nextImage,
    prevImage,
    setIndex,
  } = useLightbox();

  // Zoom, Pan & Fullscreen States
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(0); // -1 for left, 1 for right

  const currentRawUrl = images && images.length > 0 ? images[currentIndex] : '';
  const highResUrl = getHighResImageUrl(currentRawUrl);
  const productId = product?._id || product?.id || productCode || 'lightbox-item';

  // 3-Tier Image Source state: HighRes -> Original -> SVG Placeholder
  const [currentImgSrc, setCurrentImgSrc] = useState(highResUrl || currentRawUrl || FESTIVE_PLACEHOLDER_SVG);
  const [fallbackTier, setFallbackTier] = useState(1); // 1 = HighRes, 2 = Original, 3 = Placeholder

  // Touch tracking for pinch-to-zoom & swipe
  const touchStartDist = useRef(null);
  const initialTouchZoom = useRef(1);
  const touchStartPos = useRef({ x: 0, y: 0, time: 0 });
  const containerRef = useRef(null);
  const imageContainerRef = useRef(null);

  // Reset zoom & pan when image changes or modal opens
  const resetTransform = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
    setSwipeDirection(0);
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetTransform();
      setImageLoaded(false);
      setImageFailed(false);
      setFallbackTier(1);

      const raw = images && images.length > 0 ? images[currentIndex] : '';
      const high = getHighResImageUrl(raw);
      const initialSrc = high || raw || FESTIVE_PLACEHOLDER_SVG;
      setCurrentImgSrc(initialSrc);

      trackLightboxOpen({ productId, productName: productTitle });
    }
  }, [isOpen, currentIndex, images, resetTransform, productId, productTitle]);

  // Track Fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch((err) => {
        console.warn('Fullscreen request denied:', err.message);
      });
    } else {
      document.exitFullscreen?.().catch((err) => {
        console.warn('Exit fullscreen error:', err.message);
      });
    }
  }, []);

  // Zoom control handlers
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => {
      const next = Math.min(MAX_ZOOM, +(prev + ZOOM_STEP).toFixed(1));
      trackZoomUsage({ productId, productName: productTitle, zoomLevel: next });
      return next;
    });
  }, [productId, productTitle]);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const next = Math.max(MIN_ZOOM, +(prev - ZOOM_STEP).toFixed(1));
      if (next === 1) setPan({ x: 0, y: 0 });
      trackZoomUsage({ productId, productName: productTitle, zoomLevel: next });
      return next;
    });
  }, [productId, productTitle]);

  const handleResetZoom = useCallback(() => {
    resetTransform();
    trackZoomUsage({ productId, productName: productTitle, zoomLevel: 1 });
  }, [resetTransform, productId, productTitle]);

  const handleToggleZoom = useCallback(
    (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (zoom > 1) {
        handleResetZoom();
      } else {
        setZoom(2.5);
        trackZoomUsage({ productId, productName: productTitle, zoomLevel: 2.5 });
      }
    },
    [zoom, handleResetZoom, productId, productTitle]
  );

  // Keyboard Navigation & Shortcuts (ESC key to close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen?.();
        } else {
          closeLightbox();
        }
      } else if (e.key === 'ArrowRight') {
        setSwipeDirection(-1);
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        setSwipeDirection(1);
        prevImage();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeLightbox, nextImage, prevImage, handleZoomIn, handleZoomOut, handleResetZoom, toggleFullscreen]);

  // Mouse Wheel Zoom
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(MAX_ZOOM, +(prev + 0.25).toFixed(2)));
    } else {
      setZoom((prev) => {
        const next = Math.max(MIN_ZOOM, +(prev - 0.25).toFixed(2));
        if (next === 1) setPan({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Mouse Drag / Pan Handlers
  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoom <= 1) return;
    e.preventDefault();
    const maxPan = 400 * (zoom - 1);
    const nextX = Math.max(-maxPan, Math.min(maxPan, e.clientX - dragStart.x));
    const nextY = Math.max(-maxPan, Math.min(maxPan, e.clientY - dragStart.y));
    setPan({ x: nextX, y: nextY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mobile Touch Handlers (Pinch Zoom & Native Swipe)
  const getTouchDistance = (touches) => {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      touchStartDist.current = getTouchDistance(e.touches);
      initialTouchZoom.current = zoom;
    } else if (e.touches.length === 1) {
      touchStartPos.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
        time: Date.now(),
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
      };
      if (zoom > 1) {
        setIsDragging(true);
      }
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartDist.current !== null) {
      const dist = getTouchDistance(e.touches);
      const scale = dist / touchStartDist.current;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, +(initialTouchZoom.current * scale).toFixed(2)));
      setZoom(newZoom);
    } else if (e.touches.length === 1 && zoom > 1 && isDragging) {
      const maxPan = 400 * (zoom - 1);
      const nextX = Math.max(-maxPan, Math.min(maxPan, e.touches[0].clientX - touchStartPos.current.x));
      const nextY = Math.max(-maxPan, Math.min(maxPan, e.touches[0].clientY - touchStartPos.current.y));
      setPan({ x: nextX, y: nextY });
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length === 0) {
      touchStartDist.current = null;
      setIsDragging(false);

      // Detect quick horizontal swipe gesture when not zoomed in
      if (zoom === 1 && touchStartPos.current?.startX !== undefined) {
        const deltaX = (e.changedTouches[0]?.clientX || 0) - touchStartPos.current.startX;
        const deltaY = (e.changedTouches[0]?.clientY || 0) - touchStartPos.current.startY;
        const deltaTime = Date.now() - touchStartPos.current.time;

        if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && deltaTime < 400) {
          if (deltaX < 0) {
            setSwipeDirection(-1);
            nextImage();
          } else {
            setSwipeDirection(1);
            prevImage();
          }
        }
      }
    }
  };

  // Image Click Toggle: Clicking image toggles zoom or closes preview
  const handleImageClick = (e) => {
    e.stopPropagation();
    if (zoom === 1) {
      closeLightbox();
    } else {
      handleResetZoom();
    }
  };

  // Click Outside to Close: Triggered when clicking viewport background outside image
  const handleViewportBackgroundClick = (e) => {
    if (e.target === imageContainerRef.current || e.target.classList?.contains('lightbox-backdrop-area')) {
      closeLightbox();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Image preview for ${productTitle}`}
        onContextMenu={(e) => e.preventDefault()} // Download protection
        onDragStart={(e) => e.preventDefault()}
        className="fixed inset-0 z-[1100] flex flex-col justify-between select-none bg-black/95 text-white font-sans"
        style={{ userSelect: 'none', WebkitUserDrag: 'none' }}
      >
        {/* 1. Backdrop Overlay (Click Outside to Close) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeLightbox}
          className="fixed inset-0 bg-black/92 backdrop-blur-md z-0 cursor-pointer"
        />

        {/* 2. Top Header Toolbar */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 flex items-center justify-between p-3 sm:p-5 bg-gradient-to-b from-black/95 via-black/80 to-transparent gap-3 border-b border-white/10"
        >
          {/* Left: Prominent Back to Products Button & Product Information */}
          <div className="flex items-center gap-3 min-w-0">
            {/* 2. Back Button: "← Back to Products" */}
            <button
              onClick={closeLightbox}
              aria-label="Back to products"
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-festival-card hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500/40 text-xs sm:text-sm font-bold shadow-lg transition-all duration-200 cursor-pointer min-h-[44px] min-w-[44px] flex-shrink-0"
              title="Back to products (ESC)"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Back to Products</span>
            </button>

            {/* Product Title & Code Badge */}
            <div className="hidden md:flex items-center gap-2 min-w-0">
              {productCode && (
                <span className="bg-amber-500/20 text-amber-300 font-mono font-bold text-xs px-2.5 py-1 rounded-lg border border-amber-500/40 flex-shrink-0">
                  {formatProductCode(productCode)}
                </span>
              )}
              <div className="truncate">
                <h2 className="text-sm font-bold text-white truncate max-w-sm drop-shadow-md">
                  {productTitle}
                </h2>
                {category && (
                  <p className="text-[11px] text-amber-400 font-medium truncate">
                    {category}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Controls & Prominent Close Button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-festival-card/90 border border-festival-border rounded-xl p-0.5 backdrop-blur-md">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= MIN_ZOOM}
                title="Zoom Out (-)"
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <button
                onClick={handleResetZoom}
                title="Reset Zoom (0)"
                className="px-2 py-1 text-xs font-bold text-amber-400 hover:text-amber-300 hover:bg-white/5 rounded-md min-w-[48px] text-center cursor-pointer"
              >
                {Math.round(zoom * 100)}%
              </button>

              <button
                onClick={handleZoomIn}
                disabled={zoom >= MAX_ZOOM}
                title="Zoom In (+)"
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Reset Button when zoomed */}
            {zoom > 1 && (
              <button
                onClick={handleResetZoom}
                title="Reset View"
                className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl bg-festival-card border border-festival-border text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer min-h-[44px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
              className="hidden sm:flex items-center justify-center p-2.5 rounded-xl bg-festival-card/80 hover:bg-white/10 border border-festival-border text-slate-200 hover:text-white transition-all shadow min-h-[44px] min-w-[44px] cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* 1. Prominent High-Contrast Close Button: "X Close" */}
            <button
              onClick={closeLightbox}
              aria-label="Close image preview"
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs sm:text-sm shadow-xl shadow-red-950/80 border border-red-400/50 hover:scale-105 active:scale-95 transition-all cursor-pointer min-h-[44px] min-w-[44px]"
              title="Close image preview (ESC)"
            >
              <X className="w-5 h-5" />
              <span>Close</span>
            </button>
          </div>
        </motion.header>

        {/* 3. Main Viewport & Interactive Image (Click outside to close) */}
        <div
          ref={imageContainerRef}
          onClick={handleViewportBackgroundClick}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleToggleZoom}
          className={`lightbox-backdrop-area relative z-10 flex-1 flex items-center justify-center overflow-hidden p-2 sm:p-6 cursor-pointer ${
            zoom > 1
              ? isDragging
                ? 'cursor-grabbing'
                : 'cursor-grab'
              : ''
          }`}
        >
          {/* Previous Image Trigger */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSwipeDirection(1);
                prevImage();
              }}
              aria-label="Previous image"
              title="Previous Image (Left Arrow / Swipe Right)"
              className="absolute left-2 sm:left-6 z-30 p-3 rounded-full bg-black/70 hover:bg-amber-500 hover:text-slate-950 text-white border border-white/30 backdrop-blur-md transition-all shadow-2xl hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Image Container with Dynamic Scale, Pan, and Swipe Transitions */}
          <motion.div
            key={`img-${currentIndex}`}
            initial={swipeDirection !== 0 ? { opacity: 0.5, x: swipeDirection * 60 } : { opacity: 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              transformOrigin: 'center center',
            }}
            className="w-full h-full max-w-[90vw] max-h-[75vh] flex items-center justify-center pointer-events-auto"
          >
            {/* Shimmer Loader */}
            {!imageLoaded && (
              <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-2xl bg-festival-card border border-festival-border flex flex-col items-center justify-center animate-pulse">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center animate-spin">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-xs text-amber-400/90 font-bold mt-3">
                  Loading high resolution cracker preview...
                </span>
              </div>
            )}

            {/* Main Product Image (Click to close when not zoomed) */}
            <img
              src={currentImgSrc}
              alt={`${productTitle} - High Resolution View`}
              onClick={handleImageClick}
              draggable={false}
              decoding="async"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              onLoad={() => {
                setImageLoaded(true);
              }}
              onError={() => {
                if (fallbackTier === 1 && currentRawUrl && currentRawUrl !== currentImgSrc) {
                  setFallbackTier(2);
                  setCurrentImgSrc(currentRawUrl);
                } else if (fallbackTier <= 2 && currentImgSrc !== FESTIVE_PLACEHOLDER_SVG) {
                  setFallbackTier(3);
                  setCurrentImgSrc(FESTIVE_PLACEHOLDER_SVG);
                  setImageLoaded(true);
                  setImageFailed(true);
                  logImageError({
                    url: currentRawUrl || highResUrl,
                    productId,
                    productName: productTitle,
                    componentName: 'ProductImageLightbox',
                    error: new Error('Failed to load image in lightbox after fallback'),
                  });
                } else {
                  setImageLoaded(true);
                  setImageFailed(true);
                }
              }}
              className={`max-w-[90vw] max-h-[70vh] sm:max-h-[75vh] w-auto h-auto object-contain rounded-2xl shadow-2xl transition-opacity duration-300 cursor-pointer ${
                imageLoaded ? 'opacity-100' : 'opacity-0 absolute'
              }`}
              title="Click image to close preview • Double-click to zoom"
              style={{
                userSelect: 'none',
                WebkitUserDrag: 'none',
                display: 'block',
                visibility: 'visible',
              }}
            />
          </motion.div>

          {/* Next Image Trigger */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSwipeDirection(-1);
                nextImage();
              }}
              aria-label="Next image"
              title="Next Image (Right Arrow / Swipe Left)"
              className="absolute right-2 sm:right-6 z-30 p-3 rounded-full bg-black/70 hover:bg-amber-500 hover:text-slate-950 text-white border border-white/30 backdrop-blur-md transition-all shadow-2xl hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* 4. Footer Toolbar & Gallery Thumbnails */}
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 flex flex-col items-center p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent gap-2.5 border-t border-white/10"
        >
          {/* Gallery Thumbnails Strip */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto max-w-full px-2 py-1 scrollbar-thin">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSwipeDirection(idx > currentIndex ? -1 : 1);
                    setIndex(idx);
                  }}
                  aria-label={`View image ${idx + 1}`}
                  className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                    currentIndex === idx
                      ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105'
                      : 'border-festival-border opacity-50 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img || FESTIVE_PLACEHOLDER_SVG}
                    alt={`Thumbnail ${idx + 1}`}
                    draggable={false}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Bottom Bar Details & Navigation Hints */}
          <div className="flex items-center justify-between w-full max-w-3xl px-3 text-xs text-slate-400 flex-wrap gap-2">
            {/* Counter */}
            <span className="font-semibold text-amber-300">
              {images.length > 1
                ? `Image ${currentIndex + 1} of ${images.length}`
                : '1 Image Preview'}
            </span>

            {/* Helpful Close / Interaction Hints */}
            <span className="text-slate-300 text-[11px] font-medium hidden sm:inline">
              Click image, click background, or press <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-white font-mono text-[10px]">ESC</kbd> to return to products
            </span>

            {/* View Product Page Link if product exists */}
            {product && (
              <Link
                to={`/product/${product.slug || product._id}`}
                onClick={closeLightbox}
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 hover:underline ml-auto"
              >
                <span>Product Details</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </motion.footer>
      </div>
    </AnimatePresence>
  );
};

export default ProductImageLightbox;
