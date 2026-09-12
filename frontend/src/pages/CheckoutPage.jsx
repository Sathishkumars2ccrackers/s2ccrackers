import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { orderService } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, cartSubtotal, totalSavings, totalItemsCount, clearCart } = useCart();
  const {
    minimumOrderAmount,
    freeDeliveryThreshold,
    defaultDeliveryFee,
    deliveryMessage,
    calculateDiscount,
  } = useSettings();

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

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const { discountPercentage, discountAmount } = calculateDiscount(cartSubtotal);
  const deliveryFee = cartSubtotal >= freeDeliveryThreshold ? 0 : defaultDeliveryFee;
  const grandTotal = Math.max(0, cartSubtotal - discountAmount + deliveryFee);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError('');

    // Field Validations
    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!formData.phone.trim() || !/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
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

    if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode.trim())) {
      setError('Please enter a valid 6-digit postal PIN code.');
      return;
    }

    if (cartSubtotal < minimumOrderAmount) {
      setError(`Minimum order amount is ₹${minimumOrderAmount}. Please add more items.`);
      return;
    }

    setSubmitting(true);

    const fullStreetAddress = `${formData.doorNo.trim()}, ${formData.street.trim()}`;

    try {
      const orderPayload = {
        customerDetails: {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          altPhone: formData.altPhone.trim(),
          email: formData.email.trim(),
          address: fullStreetAddress,
          city: formData.city.trim(),
          pincode: formData.pincode.trim(),
          landmark: formData.landmark.trim(),
          state: formData.state.trim(),
        },
        items: cartItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
          image: item.image,
        })),
        notes: formData.notes.trim(),
      };

      // Submit order directly to backend without any pincode restrictions
      const res = await orderService.placeOrder(orderPayload);

      if (res.data?.success && res.data.orderId) {
        clearCart();
        navigate(`/order-success/${res.data.orderId}`, {
          state: { order: res.data.order, whatsapp: res.data.whatsapp },
        });
      } else {
        setError(res.data?.message || 'Failed to submit order. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to place festival order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-festival-dark py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Title */}
        <div className="pb-6 border-b border-festival-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <Lock className="w-7 h-7 text-amber-400" />
              <span>Direct Guest Checkout</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
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
            className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs sm:text-sm font-semibold flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
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
              <div className="max-h-60 overflow-y-auto space-y-3 pr-1 text-xs">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between gap-3 pb-2 border-b border-festival-border/50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=100'}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="truncate">
                        <p className="font-bold text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400">{item.quantity} × {formatCurrency(item.price)}</p>
                      </div>
                    </div>
                    <span className="font-bold text-white flex-shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Bill breakdown */}
              <div className="space-y-2 text-xs pt-2 border-t border-festival-border">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal:</span>
                  <span className="font-bold text-white">{formatCurrency(cartSubtotal)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Festival Factory Savings:</span>
                    <span>-{formatCurrency(totalSavings)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-amber-300 font-bold bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                    <span>Special Discount ({discountPercentage}%):</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300">
                  <span>Shipping & Delivery:</span>
                  <span className="font-bold text-white">
                    {deliveryFee === 0 ? <span className="text-emerald-400 font-black">FREE</span> : formatCurrency(deliveryFee)}
                  </span>
                </div>
                <div className="pt-3 border-t border-festival-border flex justify-between text-base font-black text-white">
                  <span>Total Amount:</span>
                  <span className="text-amber-400 text-xl">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:opacity-50 text-slate-950 font-black text-base shadow-2xl shadow-amber-950/60 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Booking Your Order...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Place Order</span>
                    <ArrowRight className="w-5 h-5" />
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
