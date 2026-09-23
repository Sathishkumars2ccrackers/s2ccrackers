import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  MapPin,
  Phone,
  User,
  Mail,
  Building,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Lock,
  Truck,
  Home,
  ShoppingBag,
  Sparkles,
  Tag,
  Percent,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { orderService } from '../services/api';
import { formatCurrency, formatProductCode } from '../utils/formatters';
import { calculateItemPricing, calculateOrderPricing } from '../utils/pricing';
import ProductImage from '../components/common/ProductImage';
import SEO from '../components/common/SEO';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems = [], cartSubtotal = 0, totalMrp = 0, totalSavings = 0, totalItemsCount = 0, clearCart } = useCart() || {};
  const {
    minimumOrderAmount = 500,
    freeDeliveryThreshold = 3000,
    defaultDeliveryFee = 150,
    deliveryMessage = 'Door Delivery Available',
    calculateDiscount,
  } = useSettings() || {};

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    altPhone: '',
    email: '',
    doorNo: '',
    street: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
    landmark: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Safe pricing calculation fallbacks
  const safeSubtotal = Math.max(0, Number(cartSubtotal) || 0);
  const discountResult = typeof calculateDiscount === 'function'
    ? calculateDiscount(safeSubtotal)
    : { discountPercentage: 0, discountAmount: 0 };

  const discountPercentage = Number(discountResult?.discountPercentage) || 0;
  const discountAmount = Number(discountResult?.discountAmount) || 0;

  const threshold = Number(freeDeliveryThreshold) || 3000;
  const standardFee = Number(defaultDeliveryFee) || 150;
  const deliveryFee = safeSubtotal >= threshold ? 0 : standardFee;
  const grandTotal = Math.max(0, safeSubtotal - discountAmount + deliveryFee);
  const totalCombinedSavings = Math.max(0, (Number(totalSavings) || 0) + discountAmount);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError('');

    // Defensive cart validation
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      setError('Your cart is empty. Please add cracker items before checking out.');
      return;
    }

    const sanitizedItems = cartItems
      .filter((item) => item && (item.productId || item._id || item.id))
      .map((item) => {
        const itemPricing = calculateItemPricing(item, item.quantity || 1);
        return {
          productId: (item.productId || item._id || item.id || '').toString(),
          productCode: itemPricing.productCode || '',
          name: itemPricing.name || item.name || 'Sivakasi Fireworks Item',
          price: itemPricing.sellingPrice,
          mrpPrice: itemPricing.mrpPrice,
          sellingPrice: itemPricing.sellingPrice,
          discountPercent: itemPricing.discountPercent,
          discountAmount: itemPricing.discountAmount,
          lineSavings: itemPricing.lineSavings,
          quantity: itemPricing.quantity,
          subtotal: itemPricing.lineSellingPrice,
          image: item.image || item.imageUrl || '',
        };
      });

    if (sanitizedItems.length === 0) {
      setError('Your cart is empty. Please add items to proceed.');
      return;
    }

    // Field Validations
    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const cleanPhone = formData.phone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      return;
    }

    if (formData.altPhone && formData.altPhone.trim()) {
      const cleanAlt = formData.altPhone.trim().replace(/\D/g, '');
      if (cleanAlt.length !== 10) {
        setError('Alternate phone number must be 10 digits if provided.');
        return;
      }
    }

    if (formData.email && formData.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        setError('Please enter a valid email address (e.g. name@gmail.com).');
        return;
      }
    }

    if (!formData.doorNo.trim()) {
      setError('Please enter your house / door number.');
      return;
    }

    if (!formData.street.trim()) {
      setError('Please enter your street / area name.');
      return;
    }

    if (!formData.city.trim()) {
      setError('Please enter your city / town / district.');
      return;
    }

    if (!formData.state.trim()) {
      setError('Please enter your state.');
      return;
    }

    const cleanPincode = formData.pincode.trim().replace(/\D/g, '');
    if (!cleanPincode || cleanPincode.length !== 6 || !/^\d{6}$/.test(cleanPincode)) {
      setError('Please enter a valid 6-digit postal PIN code.');
      return;
    }

    const calculatedCartSubtotal = sanitizedItems.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);
    const minOrder = Number(minimumOrderAmount) || 500;

    if (calculatedCartSubtotal < minOrder) {
      setError(`Minimum order amount is ₹${minOrder}. Please add more items to place your order.`);
      return;
    }

    setSubmitting(true);

    const fullStreetAddress = `${formData.doorNo.trim()}, ${formData.street.trim()}`;

    try {
      const orderPayload = {
        customerDetails: {
          name: formData.name.trim(),
          phone: cleanPhone,
          altPhone: formData.altPhone ? formData.altPhone.trim().replace(/\D/g, '') : '',
          email: formData.email ? formData.email.trim() : '',
          address: fullStreetAddress,
          city: formData.city.trim(),
          pincode: cleanPincode,
          landmark: formData.landmark ? formData.landmark.trim() : '',
          state: formData.state ? formData.state.trim() : 'Tamil Nadu',
        },
        items: sanitizedItems,
        notes: formData.notes ? formData.notes.trim() : '',
      };

      // Submit order directly to backend
      const res = await orderService.placeOrder(orderPayload);

      if (res.data?.success && res.data.orderId) {
        const orderData = res.data.order || {
          orderId: res.data.orderId,
          customerDetails: orderPayload.customerDetails,
          items: sanitizedItems,
          orderMrpTotal: totalMrp,
          orderSavingsTotal: totalCombinedSavings,
          orderFinalTotal: grandTotal,
          subtotal: safeSubtotal,
          discountAmount,
          discountPercentage,
          deliveryFee,
          totalAmount: grandTotal,
          createdAt: new Date().toISOString(),
          status: 'Pending',
        };

        // Save order in session storage for instant reload safety
        try {
          sessionStorage.setItem(`s2c_order_${res.data.orderId}`, JSON.stringify(orderData));
        } catch {
          // ignore quota issues
        }

        clearCart();
        navigate(`/order-success/${res.data.orderId}`, {
          state: { order: orderData, whatsapp: res.data.whatsapp },
        });
      } else {
        setError(res.data?.message || 'Failed to submit order. Please check your details and try again.');
      }
    } catch (err) {
      console.error('Checkout submission error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to process your order at this moment. Please check your connection or contact us on WhatsApp (+91 99444 76516).'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // If cart is empty, show dedicated user-friendly empty cart UI
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-festival-dark flex items-center justify-center px-4 py-16">
        <SEO
          title="Direct Factory Checkout | S2C Crackers Sivakasi"
          description="Your cart is empty. Explore our genuine Sivakasi fireworks catalog with 80% direct factory discount and door delivery across India."
          canonical="https://www.s2ccrackers.com/checkout"
        />
        <div className="max-w-md w-full text-center bg-festival-card border border-festival-border rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">Your cart is empty.</h1>
            <p className="text-sm text-slate-400">
              You haven't added any crackers to your cart yet. Explore our genuine Sivakasi fireworks catalog with 80% direct factory discount!
            </p>
          </div>
          <button
            onClick={() => navigate('/products')}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 text-slate-950 font-black text-sm hover:from-red-500 hover:to-amber-400 shadow-lg shadow-amber-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Explore All Crackers</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-festival-dark py-10 px-4 sm:px-6 lg:px-8">
      <SEO
        title="Direct Factory Checkout | Door Delivery Across India - S2C Crackers"
        description="Fast direct factory checkout for Sivakasi fireworks. Complete your delivery address with zero prepayment risk and door delivery across India."
        canonical="https://www.s2ccrackers.com/checkout"
      />
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Title & Back Link */}
        <div className="pb-6 border-b border-festival-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Link
                to="/cart"
                className="p-2 rounded-xl bg-festival-card border border-festival-border text-slate-400 hover:text-white hover:border-amber-400 transition-colors"
                title="Back to Cart"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
                <Lock className="w-7 h-7 text-amber-400" />
                <span>Direct Guest Checkout</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 ml-11">
              Zero prepayment risk! Complete your shipping details to receive direct factory dispatch across India.
            </p>
          </div>

          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-festival-card border border-emerald-500/30 text-emerald-300 text-xs font-bold self-start sm:self-auto">
            <Truck className="w-4 h-4 text-emerald-400" />
            <span>All-India Delivery • Door Delivery Available</span>
          </div>
        </div>

        {/* Nationwide Notice Banner */}
        <div className="p-4 rounded-2xl bg-festival-card border border-emerald-500/30 flex items-center gap-3 text-xs text-slate-200">
          <Truck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>
            <strong>We deliver across India.</strong> Delivery availability and dispatch schedule will be confirmed after order review.
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError('')}
              className="text-xs text-rose-300 hover:text-white underline cursor-pointer flex-shrink-0"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Shipping Details Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Form Fields */}
            <div className="bg-festival-card border border-festival-border p-6 sm:p-8 rounded-3xl space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-festival-border text-amber-400 font-bold text-base">
                <MapPin className="w-5 h-5" />
                <h2 className="text-white">1. Delivery Address & Contact Information</h2>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full bg-festival-dark border border-festival-border rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Mobile Number (10 Digits) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      required
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, phone: e.target.value.replace(/[^0-9]/g, '') }))
                      }
                      placeholder="e.g. 9876543210"
                      className="w-full bg-festival-dark border border-festival-border rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Alternate Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Alternate Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="altPhone"
                      maxLength={10}
                      value={formData.altPhone}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, altPhone: e.target.value.replace(/[^0-9]/g, '') }))
                      }
                      placeholder="e.g. 9841234567"
                      className="w-full bg-festival-dark border border-festival-border rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Email Address (For Invoice Copy - Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. yourname@gmail.com"
                      className="w-full bg-festival-dark border border-festival-border rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* House/Door No & Street/Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    House / Door Number <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="doorNo"
                      required
                      value={formData.doorNo}
                      onChange={handleChange}
                      placeholder="e.g. Door No. 12/4B, Block C"
                      className="w-full bg-festival-dark border border-festival-border rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <Home className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Street / Area Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="street"
                      required
                      value={formData.street}
                      onChange={handleChange}
                      placeholder="e.g. Gandhi Nagar 2nd Street"
                      className="w-full bg-festival-dark border border-festival-border rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* City, State & Pincode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    City / Town / District <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Chennai, Madurai, Mumbai"
                    className="w-full bg-festival-dark border border-festival-border rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    State <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="e.g. Tamil Nadu, Karnataka"
                    className="w-full bg-festival-dark border border-festival-border rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    PIN Code (6 Digits) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="pincode"
                      required
                      maxLength={6}
                      value={formData.pincode}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, pincode: e.target.value.replace(/[^0-9]/g, '') }))
                      }
                      placeholder="e.g. 600001, 560001"
                      className="w-full bg-festival-dark border border-festival-border rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white font-mono placeholder:font-sans placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Landmark & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Nearby Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    placeholder="Near Temple / Petrol Bunk / School"
                    className="w-full bg-festival-dark border border-festival-border rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Delivery Notes (Optional)
                  </label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="e.g. Call before delivery"
                    className="w-full bg-festival-dark border border-festival-border rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment & Delivery Banner */}
            <div className="p-6 rounded-3xl bg-festival-card border border-emerald-500/40 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                  <ShieldCheck className="w-6 h-6" />
                  <span className="text-white text-base">{deliveryMessage || 'Door Delivery Available'}</span>
                </div>
                <span className="px-3 py-1 bg-emerald-500 text-slate-950 font-black text-xs rounded-full">
                  SAFE DIRECT DISPATCH
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Payment method and delivery details will be confirmed by our team after order placement.
              </p>
            </div>
          </div>

          {/* Right Col: Order Items Summary & Submit Button */}
          <div className="space-y-6">
            <div className="bg-festival-card border border-festival-border p-6 rounded-3xl space-y-6">
              <h3 className="text-base font-bold text-white pb-3 border-b border-festival-border flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs text-amber-400 font-medium">{totalItemsCount} items</span>
              </h3>

              {/* Items List preview */}
              <div className="max-h-64 overflow-y-auto space-y-3 pr-1 text-xs">
                {cartItems.map((item, idx) => {
                  const itemPricing = calculateItemPricing(item, item?.quantity || 1);
                  const itemKey = item?.productId || item?._id || item?.id || idx;
                  return (
                    <div key={itemKey} className="flex items-start justify-between gap-3 pb-2.5 border-b border-festival-border/50">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <ProductImage
                          product={item}
                          src={item?.image || item?.imageUrl || ''}
                          alt={itemPricing.name}
                          optimizedWidth={100}
                          optimizedHeight={100}
                          componentName="CheckoutPage"
                          enableZoom={true}
                          containerClassName="w-11 h-11 rounded-lg flex-shrink-0 mt-0.5"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-white truncate max-w-full">{itemPricing.name}</p>
                            {itemPricing.productCode && (
                              <span className="text-[9px] font-mono font-bold text-amber-300 bg-slate-950 px-1 rounded">
                                {formatProductCode(itemPricing.productCode)}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 space-y-0.5 mt-0.5">
                            <div>
                              <span>MRP: </span>
                              <span className="line-through">{formatCurrency(itemPricing.mrpPrice)}</span> × {itemPricing.quantity}
                            </div>
                            <div className="text-amber-300 font-semibold">
                              <span>Rate: </span>
                              <span>{formatCurrency(itemPricing.sellingPrice)}</span> × {itemPricing.quantity}
                            </div>
                            {itemPricing.lineSavings > 0 && (
                              <div className="text-emerald-400 font-bold">
                                Save {formatCurrency(itemPricing.lineSavings)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-bold text-white block">{formatCurrency(itemPricing.lineSellingPrice)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Premium Savings Banner */}
              {totalCombinedSavings > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950 via-festival-card to-emerald-900/80 border-2 border-emerald-500/50 shadow-xl text-center space-y-1">
                  <div className="flex items-center justify-center gap-2 text-emerald-300 font-black text-sm sm:text-base">
                    <Sparkles className="w-5 h-5 text-emerald-400 fill-emerald-400 animate-pulse" />
                    <span>🎉 Congratulations!</span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-white">
                    You saved <span className="text-emerald-400 font-black text-base">{formatCurrency(totalCombinedSavings)}</span> through factory-direct Sivakasi pricing.
                  </p>
                </div>
              )}

              {/* Bill breakdown */}
              <div className="space-y-2.5 text-xs pt-2 border-t border-festival-border">
                <div className="flex justify-between text-slate-300">
                  <span className="font-medium">Total MRP Value:</span>
                  <span className="font-semibold text-slate-400 line-through font-mono">{formatCurrency(totalMrp)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Items Factory Price:</span>
                  <span className="font-bold text-white font-mono">{formatCurrency(safeSubtotal)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Product Discount Savings:</span>
                    <span className="font-mono">-{formatCurrency(totalSavings)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-amber-300 font-bold bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                    <span>Special Tier Discount ({discountPercentage}%):</span>
                    <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                {totalCombinedSavings > 0 && (
                  <div className="flex justify-between text-emerald-300 font-extrabold bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-500/30">
                    <span>Total Discount Saved:</span>
                    <span className="font-mono">Save {formatCurrency(totalCombinedSavings)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300">
                  <span>Shipping & Delivery:</span>
                  <span className="font-bold text-white">
                    {deliveryFee === 0 ? <span className="text-emerald-400 font-black">FREE</span> : formatCurrency(deliveryFee)}
                  </span>
                </div>
                <div className="pt-3 border-t border-festival-border flex justify-between text-base font-black text-white">
                  <span className="text-amber-400">Final Payable Amount:</span>
                  <span className="text-amber-400 text-xl font-mono">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:opacity-50 text-slate-950 font-black text-base shadow-2xl shadow-amber-950/60 transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Booking Your Order...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Place Order</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center text-[11px] text-slate-400">
                After placing order, you can confirm via <strong>1-Click WhatsApp</strong> and download your official invoice.
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
