import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Truck,
  MapPin,
  Phone,
  User,
  Mail,
  Building,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  Loader2,
  Lock,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { orderService, pincodeService } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const MIN_ORDER_AMOUNT = 500;
const FREE_DELIVERY_THRESHOLD = 3000;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, cartSubtotal, totalSavings, totalItemsCount, clearCart, pincodeInfo, setPincodeInfo } = useCart();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    altPhone: '',
    email: '',
    address: '',
    city: pincodeInfo?.city || '',
    pincode: pincodeInfo?.pincode || '',
    landmark: '',
    state: pincodeInfo?.state || 'Tamil Nadu',
    notes: '',
  });

  const [pinStatus, setPinStatus] = useState({
    checked: !!pincodeInfo?.serviceable,
    serviceable: !!pincodeInfo?.serviceable,
    deliveryFee: pincodeInfo?.deliveryFee !== undefined ? pincodeInfo.deliveryFee : 150,
    estimatedDays: pincodeInfo?.estimatedDays || '2-4 business days',
    message: pincodeInfo?.message || '',
  });

  const [pinVerifying, setPinVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  // Live verify pincode when 6 digits are entered
  const verifyPincode = async (pin) => {
    if (!pin || pin.length !== 6 || !/^[1-9][0-9]{5}$/.test(pin)) {
      setPinStatus({ checked: false, serviceable: false, deliveryFee: 150, estimatedDays: '', message: '' });
      return;
    }

    setPinVerifying(true);
    setError('');

    try {
      const res = await pincodeService.checkPincode(pin);
      if (res.data?.success) {
        setPinStatus({
          checked: true,
          serviceable: res.data.serviceable,
          deliveryFee: res.data.deliveryFee || 150,
          estimatedDays: res.data.estimatedDays || '2-4 business days',
          message: res.data.message,
        });

        if (res.data.serviceable) {
          setPincodeInfo(res.data);
          setFormData((prev) => ({
            ...prev,
            city: res.data.city || prev.city,
            state: res.data.state || prev.state,
          }));
        }
      }
    } catch (err) {
      setPinStatus({
        checked: true,
        serviceable: false,
        deliveryFee: 150,
        estimatedDays: '',
        message: 'Could not verify delivery serviceability.',
      });
    } finally {
      setPinVerifying(false);
    }
  };

  const handlePincodeChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setFormData((prev) => ({ ...prev, pincode: val }));
    if (val.length === 6) {
      verifyPincode(val);
    } else {
      setPinStatus({ checked: false, serviceable: false, deliveryFee: 150, estimatedDays: '', message: '' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateDeliveryFee = () => {
    if (cartSubtotal >= FREE_DELIVERY_THRESHOLD) return 0;
    return pinStatus.checked && pinStatus.serviceable ? pinStatus.deliveryFee : 150;
  };

  const deliveryFee = calculateDeliveryFee();
  const grandTotal = cartSubtotal + deliveryFee;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!formData.phone.trim() || !/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!formData.address.trim()) {
      setError('Please enter your street delivery address.');
      return;
    }

    if (!formData.city.trim()) {
      setError('Please enter your city / district.');
      return;
    }

    if (!formData.pincode.trim() || formData.pincode.length !== 6) {
      setError('Please enter a valid 6-digit delivery PIN code.');
      return;
    }

    if (!pinStatus.checked || !pinStatus.serviceable) {
      setError('Delivery is currently not available for this PIN code. Please verify with our WhatsApp support.');
      return;
    }

    if (cartSubtotal < MIN_ORDER_AMOUNT) {
      setError(`Minimum order amount is ₹${MIN_ORDER_AMOUNT}. Please add more items.`);
      return;
    }

    setSubmitting(true);

    try {
      const orderPayload = {
        customerDetails: {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          altPhone: formData.altPhone.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          pincode: formData.pincode.trim(),
          landmark: formData.landmark.trim(),
          state: formData.state.trim() || 'Tamil Nadu',
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

      const res = await orderService.placeOrder(orderPayload);
      if (res.data?.success && res.data.orderId) {
        clearCart();
        navigate(`/order-success/${res.data.orderId}`, { state: { order: res.data.order, whatsapp: res.data.whatsapp } });
      } else {
        setError(res.data?.message || 'Failed to submit order. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place festival order. Please try again or order via WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-festival-dark py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Title */}
        <div className="pb-6 border-b border-festival-border">
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Lock className="w-7 h-7 text-amber-400" />
            <span>Cash On Delivery (COD) Checkout</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Zero prepayment risk! Complete your shipping details to receive direct factory dispatch from Sivakasi.
          </p>
        </div>

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
            <div className="bg-festival-card border border-festival-border p-6 sm:p-8 rounded-3xl space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-festival-border text-amber-400 font-bold text-base">
                <MapPin className="w-5 h-5" />
                <h2 className="text-white">1. Delivery Address & Customer Details</h2>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Customer Full Name <span className="text-rose-400">*</span>
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
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value.replace(/[^0-9]/g, '') }))}
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
                      onChange={(e) => setFormData((prev) => ({ ...prev, altPhone: e.target.value.replace(/[^0-9]/g, '') }))}
                      placeholder="e.g. 9841234567"
                      className="w-full bg-festival-dark border border-festival-border rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Email Address (For Order Invoice Copy)
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

              {/* Pincode & City with Live Checker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      onChange={handlePincodeChange}
                      placeholder="e.g. 600001 or 626123"
                      className="w-full bg-festival-dark border border-festival-border rounded-xl pl-10 pr-10 py-3 text-xs sm:text-sm text-white font-bold placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    {pinVerifying && (
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
                    )}
                    {!pinVerifying && pinStatus.checked && (
                      pinStatus.serviceable ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                      )
                    )}
                  </div>
                  {pinStatus.checked && (
                    <p className={`text-[11px] font-medium mt-1.5 ${pinStatus.serviceable ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {pinStatus.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    City / Town / District <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Chennai, Madurai, Sivakasi"
                      className="w-full bg-festival-dark border border-festival-border rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Complete Street Address <span className="text-rose-400">*</span>
                </label>
                <textarea
                  name="address"
                  required
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Door No, Building Name, Street / Area Name"
                  className="w-full bg-festival-dark border border-festival-border rounded-xl p-3.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Landmark & State */}
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
                    placeholder="Near Temple / Petrol Bunk / Bus Stop"
                    className="w-full bg-festival-dark border border-festival-border rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full bg-festival-dark border border-festival-border rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Special Delivery Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Delivery Notes / Festival Instructions (Optional)
                </label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="e.g. Call before delivery / deliver between 10am - 5pm"
                  className="w-full bg-festival-dark border border-festival-border rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Payment Method Banner (Strictly COD) */}
            <div className="p-6 rounded-3xl bg-festival-card border border-emerald-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                  <ShieldCheck className="w-6 h-6" />
                  <span className="text-white text-base">Payment Method: Cash On Delivery (COD)</span>
                </div>
                <span className="px-3 py-1 bg-emerald-500 text-slate-950 font-black text-xs rounded-full">
                  NO PREPAYMENT NEEDED
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pay cash to our delivery executive when your Sivakasi crackers box arrives at your doorstep. Zero online fraud risk!
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
                <div className="flex justify-between text-slate-300">
                  <span>Shipping & Delivery:</span>
                  <span className="font-bold text-white">
                    {deliveryFee === 0 ? <span className="text-emerald-400 font-black">FREE</span> : formatCurrency(deliveryFee)}
                  </span>
                </div>
                <div className="pt-3 border-t border-festival-border flex justify-between text-base font-black text-white">
                  <span>Pay on Delivery:</span>
                  <span className="text-amber-400 text-xl">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting || (pinStatus.checked && !pinStatus.serviceable)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:opacity-50 text-slate-950 font-black text-base shadow-2xl shadow-amber-950/60 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Booking Your Order...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Place Order (COD)</span>
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
