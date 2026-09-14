import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
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

  // Touch tracking for pinch-to-zoom & swipe
  const touchStartDist = useRef(null);
  const initialTouchZoom = useRef(1);
  const touchStartPos = useRef({ x: 0, y: 0, time: 0 });
  const containerRef = useRef(null);
  const imageContainerRef = useRef(null);

  const currentRawUrl = images && images.length > 0 ? images[currentIndex] : '';
  const highResUrl = getHighResImageUrl(currentRawUrl);
  const productId = product?._id || product?.id || productCode || 'lightbox-item';

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
      trackLightboxOpen({ productId, productName: productTitle });
    }
  }, [isOpen, currentIndex, resetTransform, productId, productTitle]);

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

  // Keyboard Navigation & Shortcuts
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
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        time: Date.now(),
      };
      if (zoom > 1) {
        setIsDragging(true);
      }
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartDist.current) {
      e.preventDefault();
      const currentDist = getTouchDistance(e.touches);
      const scale = currentDist / touchStartDist.current;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, +(initialTouchZoom.current * scale).toFixed(2)));
      setZoom(newZoom);
      if (newZoom === 1) setPan({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && isDragging && zoom > 1) {
      e.preventDefault();
      const maxPan = 350 * (zoom - 1);
      const nextX = Math.max(-maxPan, Math.min(maxPan, e.touches[0].clientX - touchStartPos.current.x));
      const nextY = Math.max(-maxPan, Math.min(maxPan, e.touches[0].clientY - touchStartPos.current.y));
      setPan({ x: nextX, y: nextY });
    }
  };

  const handleTouchEnd = (e) => {
    touchStartDist.current = null;
    setIsDragging(false);

    // Native Touch Swipe left / right when at 1x zoom on mobile
    if (zoom === 1 && e.changedTouches && e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - touchStartPos.current.startX;
      const deltaY = e.changedTouches[0].clientY - touchStartPos.current.startY;
      const deltaTime = Date.now() - touchStartPos.current.time;

      // Detect horizontal swipe with minimum speed/distance
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4 && deltaTime < 500) {
        if (deltaX < 0) {
          // Swipe Left -> Next Image
          setSwipeDirection(-1);
          nextImage();
        } else {
          // Swipe Right -> Previous Image
          setSwipeDirection(1);
          prevImage();
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Image viewer for ${productTitle}`}
        onContextMenu={(e) => e.preventDefault()} // Download protection: Block right click
        onDragStart={(e) => e.preventDefault()} // Download protection: Block dragging
        className="fixed inset-0 z-50 flex flex-col justify-between select-none bg-black/95"
        style={{ userSelect: 'none', WebkitUserDrag: 'none' }}
      >
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeLightbox}
          className="fixed inset-0 bg-black/92 backdrop-blur-md z-0"
        />

        {/* 1. Header Toolbar */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 flex items-center justify-between p-3 sm:p-5 bg-gradient-to-b from-black/85 via-black/50 to-transparent gap-3"
        >
          {/* Left: Product Information */}
          <div className="flex items-center gap-2.5 min-w-0">
            {productCode && (
              <span className="bg-amber-500/20 text-amber-300 font-mono font-bold text-xs px-2.5 py-1 rounded-lg border border-amber-500/40">
                #{productCode}
              </span>
            )}
            <div className="truncate">
              <h2 className="text-sm sm:text-base font-bold text-white truncate drop-shadow-md">
                {productTitle}
              </h2>
              {category && (
                <p className="text-[11px] text-amber-400 font-medium truncate">
                  {category}
                </p>
              )}
            </div>
          </div>

          {/* Right: Controls (Zoom, Fullscreen & Close) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Zoom Controls */}
            <div className="flex items-center bg-festival-card/80 border border-festival-border rounded-xl p-0.5 backdrop-blur-md">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= MIN_ZOOM}
                title="Zoom Out (-)"
                className="p-1.5 sm:p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <button
                onClick={handleResetZoom}
                title="Reset Zoom (0)"
                className="px-2 py-1 text-xs font-bold text-amber-400 hover:text-amber-300 hover:bg-white/5 rounded-md min-w-[50px] text-center"
              >
                {Math.round(zoom * 100)}%
              </button>

              <button
                onClick={handleZoomIn}
                disabled={zoom >= MAX_ZOOM}
                title="Zoom In (+)"
                className="p-1.5 sm:p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Reset Button */}
            {zoom > 1 && (
              <button
                onClick={handleResetZoom}
                title="Reset View"
                className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl bg-festival-card border border-festival-border text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
              className="p-2 sm:p-2.5 rounded-xl bg-festival-card/80 hover:bg-white/10 border border-festival-border text-slate-200 hover:text-white transition-all shadow"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={closeLightbox}
              title="Close (ESC)"
              className="p-2 sm:p-2.5 rounded-xl bg-red-600/85 hover:bg-red-600 text-white font-bold transition-all shadow-lg hover:scale-105"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.header>

        {/* 2. Main Viewport & Interactive Image */}
        <div
          ref={imageContainerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleToggleZoom}
          className={`relative z-10 flex-1 flex items-center justify-center overflow-hidden p-2 sm:p-6 ${
            zoom > 1
              ? isDragging
                ? 'cursor-grabbing'
                : 'cursor-grab'
              : 'cursor-zoom-in'
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
              title="Previous Image (Left Arrow / Swipe Right)"
              className="absolute left-2 sm:left-6 z-30 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-amber-500 hover:text-slate-950 text-white border border-white/20 backdrop-blur-md transition-all shadow-xl hover:scale-110"
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
            className="max-w-[90vw] max-h-[75vh] flex items-center justify-center pointer-events-auto"
          >
            {/* Shimmer Loader */}
            {!imageLoaded && !imageFailed && (
              <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-2xl bg-festival-card border border-festival-border flex flex-col items-center justify-center animate-pulse">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center animate-spin">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-xs text-amber-400/90 font-bold mt-3">
                  Loading high resolution fireworks...
                </span>
              </div>
            )}

            <img
              src={imageFailed ? FESTIVE_PLACEHOLDER_SVG : highResUrl}
              alt={`${productTitle} - High Resolution View`}
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageFailed(true);
                setImageLoaded(true);
                logImageError({
                  url: highResUrl,
                  productName: productTitle,
                  componentName: 'ProductImageLightbox',
                  error: new Error('Failed to load high-res image in lightbox'),
                });
              }}
              className={`max-w-[90vw] max-h-[72vh] sm:max-h-[75vh] object-contain rounded-2xl shadow-2xl transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ userSelect: 'none', WebkitUserDrag: 'none' }}
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
              title="Next Image (Right Arrow / Swipe Left)"
              className="absolute right-2 sm:right-6 z-30 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-amber-500 hover:text-slate-950 text-white border border-white/20 backdrop-blur-md transition-all shadow-xl hover:scale-110"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* 3. Footer Toolbar & Gallery Thumbnails */}
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 flex flex-col items-center p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent gap-2.5"
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
                  className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
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

          {/* Bottom Bar Details & Counter */}
          <div className="flex items-center justify-between w-full max-w-2xl px-3 text-xs text-slate-400">
            {/* Counter */}
            <span className="font-semibold text-amber-300">
              {images.length > 1
                ? `Image ${currentIndex + 1} of ${images.length}`
                : '1 Image Preview'}
            </span>

            {/* Hint */}
            <span className="text-slate-400 text-[11px]">
              Swipe or arrow keys to browse • Scroll/pinch to zoom • ESC to close
            </span>

            {/* View Product Page Link if product exists */}
            {product && (
              <Link
                to={`/product/${product.slug || product._id}`}
                onClick={closeLightbox}
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 hover:underline"
              >
                <span>Product Details</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </motion.footer>
      </div>
    </AnimatePresence>
  );
};

export default ProductImageLightbox;
