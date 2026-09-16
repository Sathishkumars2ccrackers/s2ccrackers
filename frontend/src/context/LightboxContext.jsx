import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const LightboxContext = createContext(null);

export const useLightbox = () => {
  const context = useContext(LightboxContext);
  if (!context) {
    throw new Error('useLightbox must be used within a LightboxProvider');
  }
  return context;
};

export const LightboxProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [productTitle, setProductTitle] = useState('');
  const [productCode, setProductCode] = useState('');
  const [category, setCategory] = useState('');
  const [product, setProduct] = useState(null);

  const openLightbox = useCallback((config = {}) => {
    const rawImages = config.images || [];
    const sanitizedImages = (
      Array.isArray(rawImages) ? rawImages : [rawImages]
    ).filter(Boolean);

    setImages(sanitizedImages.length > 0 ? sanitizedImages : ['']);
    setCurrentIndex(
      typeof config.startIndex === 'number' && config.startIndex >= 0
        ? Math.min(config.startIndex, Math.max(0, sanitizedImages.length - 1))
        : 0
    );
    setProductTitle(config.productTitle || config.title || 'S2C Sivakasi Cracker');
    setProductCode(config.productCode || config.code || '');
    setCategory(config.category || '');
    setProduct(config.product || null);
    setIsOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setIsOpen(false);
  }, []);

  const nextImage = useCallback(() => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }
  }, [images.length]);

  const prevImage = useCallback(() => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  }, [images.length]);

  const setIndex = useCallback(
    (index) => {
      if (index >= 0 && index < images.length) {
        setCurrentIndex(index);
      }
    },
    [images.length]
  );

  // Lock body scroll when Lightbox is open while preserving exact scroll position
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const value = {
    isOpen,
    images,
    currentIndex,
    productTitle,
    productCode,
    category,
    product,
    openLightbox,
    closeLightbox,
    nextImage,
    prevImage,
    setIndex,
  };

  return (
    <LightboxContext.Provider value={value}>
      {children}
    </LightboxContext.Provider>
  );
};
