import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { settingService } from '../services/api';

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  businessName: 'S2C Crackers',
  businessDomain: 'www.s2ccrackers.com',
  phone: '+91 99444 76516',
  whatsappNumber: '919944476516',
  email: 's2ccrackers@gmail.com',
  address: 'Azhagar Crackers, 570 (East Part), Singapore Nagar, Chatitapatti, Madurai - 625014, Tamil Nadu, India',
  minimumOrderAmount: 500,
  minOrderAmount: 500,
  freeDeliveryThreshold: 3000,
  defaultDeliveryFee: 150,
  discountSlabs: [
    { minAmount: 1000, discountPercentage: 5 },
    { minAmount: 3000, discountPercentage: 10 },
    { minAmount: 5000, discountPercentage: 15 },
  ],
  deliveryMessage: 'Door Delivery Available',
  cartProgressMessage: 'Add more items to unlock benefits',
  festivalAnnouncement: '💥 SIVAKASI DIRECT FACTORY PRICES! Book your Festival Crackers early & Get Up To 80% OFF. Door Delivery Available Across India! 💥',
  isStoreOpen: true,
  storeClosedNotice: '',
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await settingService.getPublicSettings();
      if (res.data?.success && res.data.settings) {
        const s = res.data.settings;
        setSettings((prev) => ({
          ...prev,
          ...s,
          minimumOrderAmount: s.minimumOrderAmount !== undefined ? s.minimumOrderAmount : (s.minOrderAmount || prev.minimumOrderAmount),
          minOrderAmount: s.minimumOrderAmount !== undefined ? s.minimumOrderAmount : (s.minOrderAmount || prev.minOrderAmount),
          freeDeliveryThreshold: s.freeDeliveryThreshold !== undefined ? s.freeDeliveryThreshold : prev.freeDeliveryThreshold,
          defaultDeliveryFee: s.defaultDeliveryFee !== undefined ? s.defaultDeliveryFee : prev.defaultDeliveryFee,
          discountSlabs: Array.isArray(s.discountSlabs) && s.discountSlabs.length > 0 ? s.discountSlabs : prev.discountSlabs,
          deliveryMessage: s.deliveryMessage || prev.deliveryMessage,
          cartProgressMessage: s.cartProgressMessage || prev.cartProgressMessage,
          festivalAnnouncement: s.festivalAnnouncement !== undefined ? s.festivalAnnouncement : prev.festivalAnnouncement,
          isStoreOpen: s.isStoreOpen !== undefined ? s.isStoreOpen : prev.isStoreOpen,
        }));
      }
    } catch (err) {
      console.warn('Could not fetch dynamic business settings, using defaults:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Discount Engine: Automatic highest matching slab calculation
  const calculateDiscount = useCallback(
    (subtotal) => {
      const slabs = settings.discountSlabs || [];
      const amount = Math.max(0, Number(subtotal) || 0);

      if (!slabs.length || amount <= 0) {
        return {
          discountPercentage: 0,
          discountAmount: 0,
          discountedSubtotal: amount,
          appliedSlab: null,
          nextSlab: slabs.length > 0 ? slabs[0] : null,
          amountNeededForNextSlab: slabs.length > 0 ? Math.max(0, slabs[0].minAmount - amount) : 0,
        };
      }

      // Sort slabs ascending
      const sorted = [...slabs].sort((a, b) => a.minAmount - b.minAmount);

      // Find highest matching slab
      const qualified = sorted.filter((s) => amount >= s.minAmount && s.discountPercentage > 0);
      const appliedSlab = qualified.length > 0 ? qualified[qualified.length - 1] : null;

      const discountPercentage = appliedSlab ? appliedSlab.discountPercentage : 0;
      const discountAmount = Math.round((amount * discountPercentage) / 100);
      const discountedSubtotal = Math.max(0, amount - discountAmount);

      // Find next unlocking slab
      const nextSlab = sorted.find((s) => amount < s.minAmount) || null;
      const amountNeededForNextSlab = nextSlab ? Math.max(0, nextSlab.minAmount - amount) : 0;

      return {
        discountPercentage,
        discountAmount,
        discountedSubtotal,
        appliedSlab,
        nextSlab,
        amountNeededForNextSlab,
      };
    },
    [settings.discountSlabs]
  );

  // Free delivery progress calculation
  const getFreeDeliveryProgress = useCallback(
    (subtotal) => {
      const threshold = Number(settings.freeDeliveryThreshold) || 3000;
      const amount = Math.max(0, Number(subtotal) || 0);
      const isUnlocked = amount >= threshold;
      const amountNeeded = Math.max(0, threshold - amount);
      const progressPercent = threshold > 0 ? Math.min(100, Math.round((amount / threshold) * 100)) : 100;

      return {
        threshold,
        isUnlocked,
        amountNeeded,
        progressPercent,
      };
    },
    [settings.freeDeliveryThreshold]
  );

  const value = {
    settings,
    loading,
    minimumOrderAmount: settings.minimumOrderAmount !== undefined ? settings.minimumOrderAmount : 500,
    minOrderAmount: settings.minimumOrderAmount !== undefined ? settings.minimumOrderAmount : 500,
    freeDeliveryThreshold: settings.freeDeliveryThreshold !== undefined ? settings.freeDeliveryThreshold : 3000,
    defaultDeliveryFee: settings.defaultDeliveryFee !== undefined ? settings.defaultDeliveryFee : 150,
    discountSlabs: settings.discountSlabs || [],
    deliveryMessage: settings.deliveryMessage || 'Door Delivery Available',
    cartProgressMessage: settings.cartProgressMessage || 'Add more items to unlock benefits',
    festivalAnnouncement: settings.festivalAnnouncement || '',
    isStoreOpen: settings.isStoreOpen !== undefined ? settings.isStoreOpen : true,
    storeClosedNotice: settings.storeClosedNotice || '',
    calculateDiscount,
    getFreeDeliveryProgress,
    refreshSettings: fetchSettings,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext;
