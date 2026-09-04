import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 's2c_shopping_cart';
const PINCODE_STORAGE_KEY = 's2c_delivery_pincode';

export const CartProvider = ({ children }) => {
  const { toastSuccess, toastWarning, toastInfo } = useToast();

  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [pincodeInfo, setPincodeInfo] = useState(() => {
    try {
      const saved = localStorage.getItem(PINCODE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (pincodeInfo) {
      localStorage.setItem(PINCODE_STORAGE_KEY, JSON.stringify(pincodeInfo));
    }
  }, [pincodeInfo]);

  // Add product to cart
  const addToCart = (product, quantity = 1, showDrawer = true) => {
    if (!product || product.stockQuantity <= 0) {
      toastWarning(`"${product?.name || 'Product'}" is currently out of stock.`);
      return false;
    }

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.productId === product._id);
      const productImg = product.images && product.images.length > 0 ? product.images[0] : '';

      if (existingIndex > -1) {
        const currentQty = prevItems[existingIndex].quantity;
        const newQty = currentQty + quantity;

        if (newQty > product.stockQuantity) {
          toastWarning(`Cannot add more. Only ${product.stockQuantity} box(es) available in stock.`);
          return prevItems;
        }

        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          maxStock: product.stockQuantity,
          price: product.price,
        };
        toastSuccess(`Updated quantity for "${product.name}" (${newQty} in cart)`);
        return updated;
      } else {
        if (quantity > product.stockQuantity) {
          toastWarning(`Only ${product.stockQuantity} box(es) available in stock.`);
          return prevItems;
        }

        toastSuccess(`Added "${product.name}" to festival cart!`);
        return [
          ...prevItems,
          {
            productId: product._id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice || product.price,
            quantity: quantity,
            maxStock: product.stockQuantity,
            image: productImg,
            packSize: product.packSize || '1 Box',
            category: product.category?.name || 'Crackers',
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
          if (newQuantity > item.maxStock) {
            toastWarning(`Only ${item.maxStock} box(es) available in stock.`);
            return { ...item, quantity: item.maxStock };
          }
          return { ...item, quantity: newQuantity };
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
        toastInfo(`Removed "${removed.name}" from cart`);
      }
      return prevItems.filter((i) => i.productId !== productId);
    });
  };

  // Clear all cart items
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  // Calculations
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalOriginalPrice = cartItems.reduce(
    (sum, item) => sum + (item.originalPrice || item.price) * item.quantity,
    0
  );
  const totalSavings = totalOriginalPrice - cartSubtotal;
  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartSubtotal,
        totalOriginalPrice,
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
        pincodeInfo,
        setPincodeInfo,
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
