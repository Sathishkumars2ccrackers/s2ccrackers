import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { getProductImage } from '../utils/imageUrlUtils';
import { calculateItemPricing, calculateOrderPricing } from '../utils/pricing';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 's2c_shopping_cart';

export const CartProvider = ({ children }) => {
  const { toastSuccess, toastWarning, toastInfo } = useToast();

  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.map((item) => {
            const pricing = calculateItemPricing(item, item.quantity || 1);
            return {
              ...item,
              ...pricing,
              image: getProductImage(item.image || item),
            };
          })
        : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  // Add product to cart without automatically opening drawer
  const addToCart = (product, quantity = 1, showDrawer = false) => {
    if (!product || product.stockQuantity <= 0) {
      toastWarning(`"${product?.name || 'Product'}" is currently out of stock.`);
      return false;
    }

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.productId === product._id);
      const productImg = getProductImage(product);
      const pricing = calculateItemPricing(product, quantity);

      if (existingIndex > -1) {
        const currentQty = prevItems[existingIndex].quantity;
        const newQty = currentQty + quantity;

        if (newQty > product.stockQuantity) {
          toastWarning(`Cannot add more. Only ${product.stockQuantity} box(es) available in stock.`);
          return prevItems;
        }

        const updatedPricing = calculateItemPricing(product, newQty);
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...updatedPricing,
          quantity: newQty,
          maxStock: product.stockQuantity,
          price: product.price,
          originalPrice: product.originalPrice || product.price,
        };
        toastSuccess(`Added "${product.name}" to cart (${newQty} in cart)`, 2000);
        return updated;
      } else {
        if (quantity > product.stockQuantity) {
          toastWarning(`Only ${product.stockQuantity} box(es) available in stock.`);
          return prevItems;
        }

        toastSuccess(`Added "${product.name}" to cart`, 2000);
        return [
          ...prevItems,
          {
            productId: product._id,
            productCode: product.productCode || '',
            name: product.name,
            price: product.price,
            sellingPrice: product.price,
            originalPrice: product.originalPrice || product.price,
            mrpPrice: product.originalPrice || product.price,
            discountPercentage: product.discountPercentage || 0,
            quantity: quantity,
            maxStock: product.stockQuantity,
            image: productImg,
            packSize: product.packSize || '1 Box',
            category: product.category?.name || 'Crackers',
            ...pricing,
          },
        ];
      }
    });

    if (showDrawer) {
      setIsCartOpen(true);
    }
    return true;
  };

  // Update item quantity
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.productId === productId) {
          const qty = Math.min(newQuantity, item.maxStock || 999);
          if (newQuantity > item.maxStock) {
            toastWarning(`Only ${item.maxStock} box(es) available in stock.`);
          }
          const itemPricing = calculateItemPricing(item, qty);
          return {
            ...item,
            ...itemPricing,
            quantity: qty,
          };
        }
        return item;
      })
    );
  };

  // Remove single item
  const removeFromCart = (productId) => {
    setCartItems((prevItems) => {
      const removed = prevItems.find((i) => i.productId === productId);
      if (removed) {
        toastInfo(`Removed "${removed.name}" from cart`, 2000);
      }
      return prevItems.filter((i) => i.productId !== productId);
    });
  };

  // Clear all cart items
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  // Unified Pricing Model for Cart Totals
  const orderPricing = calculateOrderPricing(cartItems);

  const cartSubtotal = orderPricing.orderItemsSubtotal;
  const totalOriginalPrice = orderPricing.orderMrpTotal;
  const totalMrp = orderPricing.orderMrpTotal;
  const totalSavings = orderPricing.orderItemSavingsTotal;
  const totalItemsCount = cartItems.reduce((sum, item) => {
    const qty = Math.max(0, parseInt(item?.quantity, 10) || 0);
    return sum + qty;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartSubtotal,
        totalOriginalPrice,
        totalMrp,
        totalSavings,
        totalItemsCount,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        toggleCart: () => setIsCartOpen((prev) => !prev),
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
