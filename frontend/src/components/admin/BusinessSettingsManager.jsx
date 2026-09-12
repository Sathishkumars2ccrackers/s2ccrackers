import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Save,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Truck,
  Percent,
  MessageSquare,
  Sparkles,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { settingService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';

const BusinessSettingsManager = () => {
  const { toastSuccess, toastError, toastWarning } = useToast();
  const { refreshSettings } = useSettings();

  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState(null); // 'order', 'delivery', 'discount', 'messages', 'all'

  // Business Rules State
  const [minimumOrderAmount, setMinimumOrderAmount] = useState(500);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(3000);
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState(150);
  const [discountSlabs, setDiscountSlabs] = useState([
    { minAmount: 1000, discountPercentage: 5 },
    { minAmount: 3000, discountPercentage: 10 },
    { minAmount: 5000, discountPercentage: 15 },
  ]);
  const [deliveryMessage, setDeliveryMessage] = useState('Door Delivery Available');
  const [cartProgressMessage, setCartProgressMessage] = useState('Add more items to unlock benefits');
  const [festivalAnnouncement, setFestivalAnnouncement] = useState('');

  // Slabs Modal / Add Form State
  const [isEditingSlab, setIsEditingSlab] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [slabForm, setSlabForm] = useState({ minAmount: '', discountPercentage: '' });

  // Live Simulator State
  const [testAmount, setTestAmount] = useState(3500);

  useEffect(() => {
    fetchBusinessSettings();
  }, []);

  const fetchBusinessSettings = async () => {
    setLoading(true);
    try {
      const res = await settingService.getAdminSettings();
      if (res.data?.settings) {
        const s = res.data.settings;
        setMinimumOrderAmount(s.minimumOrderAmount !== undefined ? s.minimumOrderAmount : (s.minOrderAmount || 500));
        setFreeDeliveryThreshold(s.freeDeliveryThreshold !== undefined ? s.freeDeliveryThreshold : 3000);
        setDefaultDeliveryFee(s.defaultDeliveryFee !== undefined ? s.defaultDeliveryFee : 150);
        if (Array.isArray(s.discountSlabs)) {
          setDiscountSlabs([...s.discountSlabs].sort((a, b) => a.minAmount - b.minAmount));
        }
        setDeliveryMessage(s.deliveryMessage || 'Door Delivery Available');
        setCartProgressMessage(s.cartProgressMessage || 'Add more items to unlock benefits');
        setFestivalAnnouncement(s.festivalAnnouncement || '');
      }
    } catch (err) {
      toastError('Failed to load current business settings.');
    } finally {
      setLoading(false);
    }
  };

  // Generic Save Handler
  const handleSaveSettings = async (sectionName = 'all', specificPayload = null) => {
    setSavingSection(sectionName);
    try {
      const payload = specificPayload || {
        minimumOrderAmount: Number(minimumOrderAmount),
        minOrderAmount: Number(minimumOrderAmount),
        freeDeliveryThreshold: Number(freeDeliveryThreshold),
        defaultDeliveryFee: Number(defaultDeliveryFee),
        discountSlabs: discountSlabs.map((s) => ({
          minAmount: Number(s.minAmount),
          discountPercentage: Number(s.discountPercentage),
        })),
        deliveryMessage: deliveryMessage.trim(),
        cartProgressMessage: cartProgressMessage.trim(),
        festivalAnnouncement: festivalAnnouncement.trim(),
      };

      const res = await settingService.updateSettings(payload);
      if (res.data?.success) {
        toastSuccess(
          sectionName === 'all'
            ? 'All Business Settings saved & deployed live!'
            : `${sectionName.toUpperCase()} settings saved successfully!`
        );
        await refreshSettings();
      } else {
        toastError(res.data?.message || 'Failed to update settings');
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save business settings.');
    } finally {
      setSavingSection(null);
    }
  };

  // Discount Slabs Handlers
  const handleOpenAddSlab = () => {
    setEditingIndex(null);
    setSlabForm({ minAmount: '', discountPercentage: '' });
    setIsEditingSlab(true);
  };

  const handleOpenEditSlab = (index) => {
    setEditingIndex(index);
    setSlabForm({
      minAmount: discountSlabs[index].minAmount,
      discountPercentage: discountSlabs[index].discountPercentage,
    });
    setIsEditingSlab(true);
  };

  const handleDeleteSlab = (index) => {
    const updated = discountSlabs.filter((_, i) => i !== index);
    setDiscountSlabs(updated);
    toastSuccess('Discount rule removed. Click "Save Discount Rules" to persist.');
  };

  const handleSaveSlabModal = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const minAmt = parseFloat(slabForm.minAmount);
    const discPct = parseFloat(slabForm.discountPercentage);

    if (slabForm.minAmount === '' || isNaN(minAmt) || minAmt <= 0) {
      toastWarning('Please enter a valid minimum order amount greater than 0.');
      return;
    }

    if (slabForm.discountPercentage === '' || isNaN(discPct) || discPct <= 0 || discPct > 100) {
      toastWarning('Please enter a valid discount percentage between 0.01% and 100%.');
      return;
    }

    let updated = [...discountSlabs];
    if (editingIndex !== null) {
      updated[editingIndex] = { minAmount: minAmt, discountPercentage: discPct };
    } else {
      // Check if duplicate minAmount
      const existingIdx = updated.findIndex((s) => s.minAmount === minAmt);
      if (existingIdx > -1) {
        updated[existingIdx] = { minAmount: minAmt, discountPercentage: discPct };
      } else {
        updated.push({ minAmount: minAmt, discountPercentage: discPct });
      }
    }

    // Sort ascending
    updated.sort((a, b) => a.minAmount - b.minAmount);
    setDiscountSlabs(updated);
    setIsEditingSlab(false);
    toastSuccess(
      editingIndex !== null
        ? 'Discount rule updated. Click "Save Discount Rules" to apply live.'
        : 'New discount rule added. Click "Save Discount Rules" to apply live.'
    );
  };

  // Live Calculator Calculation
  const calculateTestDiscount = (amount) => {
    const amt = Math.max(0, Number(amount) || 0);
    const qualified = [...discountSlabs]
      .sort((a, b) => a.minAmount - b.minAmount)
      .filter((s) => amt >= s.minAmount && s.discountPercentage > 0);

    const appliedSlab = qualified.length > 0 ? qualified[qualified.length - 1] : null;
    const discountPercentage = appliedSlab ? appliedSlab.discountPercentage : 0;
    const discountAmount = Math.round((amt * discountPercentage) / 100);
    const finalAmount = Math.max(0, amt - discountAmount);

    const sorted = [...discountSlabs].sort((a, b) => a.minAmount - b.minAmount);
    const nextSlab = sorted.find((s) => amt < s.minAmount) || null;
    const neededForNext = nextSlab ? Math.max(0, nextSlab.minAmount - amt) : 0;

    return { discountPercentage, discountAmount, finalAmount, appliedSlab, nextSlab, neededForNext };
  };

  const testResults = calculateTestDiscount(testAmount);

  if (loading) {
    return <LoadingSpinner text="Loading Business Rules Engine..." />;
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-festival-card via-[#1e1333] to-festival-card border border-amber-500/30 p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Business Rules & Pricing Strategy
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Dynamically manage minimum order limits, free delivery thresholds, tiered discount slabs, and promotional messaging.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => handleSaveSettings('all')}
          disabled={savingSection === 'all'}
          className="px-6 py-3.5 bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 hover:from-red-500 hover:to-orange-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-xl shadow-amber-950/40 transition-all flex items-center justify-center gap-2 flex-shrink-0"
        >
          {savingSection === 'all' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save All Business Rules</span>
        </button>
      </div>

      {/* Grid: Sections 1 & 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SECTION 1: ORDER SETTINGS */}
        <div className="bg-festival-card border border-festival-border p-6 rounded-3xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-festival-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Section 1: Order Settings
                  </h3>
                  <p className="text-[11px] text-slate-400">Control minimum checkout value</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                ₹{minimumOrderAmount} Min
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                Minimum Order Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={minimumOrderAmount}
                  onChange={(e) => setMinimumOrderAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="500"
                  className="w-full bg-festival-dark border border-festival-border focus:border-amber-400 rounded-xl pl-8 pr-3.5 py-2.5 text-white font-mono font-bold text-sm"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Customers cannot place orders below this value. Validated strictly on client and server.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {[500, 1000, 2000, 5000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMinimumOrderAmount(val)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      minimumOrderAmount === val
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-festival-dark text-slate-300 hover:text-white border border-festival-border hover:border-amber-500/40'
                    }`}
                  >
                    ₹{val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-festival-border flex justify-end">
            <button
              onClick={() => handleSaveSettings('order')}
              disabled={savingSection === 'order'}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all"
            >
              {savingSection === 'order' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save Order Settings</span>
            </button>
          </div>
        </div>

        {/* SECTION 2: FREE DELIVERY SETTINGS */}
        <div className="bg-festival-card border border-festival-border p-6 rounded-3xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-festival-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Section 2: Free Delivery Settings
                  </h3>
                  <p className="text-[11px] text-slate-400">Control shipping waiver thresholds</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ₹{freeDeliveryThreshold} Free
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                Free Delivery Threshold (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={freeDeliveryThreshold}
                  onChange={(e) => setFreeDeliveryThreshold(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="3000"
                  className="w-full bg-festival-dark border border-festival-border focus:border-amber-400 rounded-xl pl-8 pr-3.5 py-2.5 text-white font-mono font-bold text-sm"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Orders equal or above this amount automatically receive 100% Free Shipping.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {[2000, 3000, 4000, 5000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFreeDeliveryThreshold(val)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      freeDeliveryThreshold === val
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-festival-dark text-slate-300 hover:text-white border border-festival-border hover:border-emerald-500/40'
                    }`}
                  >
                    ₹{val}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Standard Shipping Fee Below Threshold (₹)
              </label>
              <input
                type="number"
                min="0"
                value={defaultDeliveryFee}
                onChange={(e) => setDefaultDeliveryFee(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-festival-dark border border-festival-border rounded-xl px-3.5 py-2 text-white font-mono text-xs"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-festival-border flex justify-end">
            <button
              onClick={() => handleSaveSettings('delivery')}
              disabled={savingSection === 'delivery'}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all"
            >
              {savingSection === 'delivery' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save Free Delivery Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: DISCOUNT RULES */}
      <div className="bg-festival-card border border-festival-border p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-festival-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Section 3: Tiered Discount Rules & Slabs
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Automatically applies the highest matching slab to customer orders.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAddSlab}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Discount Rule</span>
          </button>
        </div>

        {/* Slabs Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-festival-dark/80 text-slate-300 font-bold uppercase tracking-wider border-b border-festival-border">
                <th className="py-3 px-4 rounded-l-xl">Minimum Order Amount (₹)</th>
                <th className="py-3 px-4">Discount Percentage (%)</th>
                <th className="py-3 px-4">Instant Savings on Threshold</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-festival-border">
              {discountSlabs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-400">
                    No discount slabs active. Click &quot;Add Discount Rule&quot; to configure pricing tiers.
                  </td>
                </tr>
              ) : (
                discountSlabs.map((slab, idx) => {
                  const savings = Math.round((slab.minAmount * slab.discountPercentage) / 100);
                  return (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white text-sm">
                        {formatCurrency(slab.minAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 font-extrabold font-mono text-xs border border-amber-500/30">
                          <Sparkles className="w-3 h-3" />
                          {slab.discountPercentage}% OFF
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-emerald-400 font-medium">
                        Customer saves <strong className="text-emerald-300 font-mono">+{formatCurrency(savings)}</strong>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSlab(idx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                            title="Edit Rule"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSlab(idx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Live Simulator Widget */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-festival-dark via-[#170e26] to-festival-dark border border-amber-500/30 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
            <Calculator className="w-4 h-4 text-amber-400" />
            <span>Interactive Rule Simulator & Preview</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Test Cart Subtotal (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={testAmount}
                  onChange={(e) => setTestAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-festival-card border border-festival-border focus:border-amber-400 rounded-xl pl-7 pr-3 py-2 text-white font-mono font-bold text-xs"
                />
              </div>
            </div>

            <div className="sm:col-span-2 p-3 rounded-xl bg-festival-card/80 border border-festival-border/60 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-300">
                <span>Applied Slab:</span>
                <span className="font-bold text-amber-400 font-mono">
                  {testResults.discountPercentage > 0
                    ? `${testResults.discountPercentage}% OFF (${formatCurrency(testResults.appliedSlab?.minAmount)} threshold)`
                    : 'No discount (Below first tier)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Discounted Savings:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  -{formatCurrency(testResults.discountAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-festival-border/40">
                <span className="font-bold text-white">Final Customer Payable:</span>
                <span className="font-black text-white font-mono text-sm">
                  {formatCurrency(testResults.finalAmount)}
                </span>
              </div>
              {testResults.nextSlab && (
                <p className="text-[11px] text-amber-300/80 pt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-amber-400" />
                  <span>
                    Add {formatCurrency(testResults.neededForNext)} more to unlock {testResults.nextSlab.discountPercentage}% OFF ({formatCurrency(testResults.nextSlab.minAmount)} tier)!
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => handleSaveSettings('discount')}
            disabled={savingSection === 'discount'}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all"
          >
            {savingSection === 'discount' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Discount Rules</span>
          </button>
        </div>
      </div>

      {/* SECTION 4: CUSTOM MESSAGES */}
      <div className="bg-festival-card border border-festival-border p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-festival-border">
          <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wider">
              Section 4: Custom Customer Messaging
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Control delivery guarantees, cart encouragement text, and homepage announcement banners.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 uppercase mb-1.5">
              Delivery Message (Appears across Homepage, Products, Cart & Checkout)
            </label>
            <input
              type="text"
              value={deliveryMessage}
              onChange={(e) => setDeliveryMessage(e.target.value)}
              placeholder="Door Delivery Available"
              className="w-full bg-festival-dark border border-festival-border focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-white text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">Default: &quot;Door Delivery Available&quot;</p>
          </div>

          <div>
            <label className="block font-bold text-slate-300 uppercase mb-1.5">
              Cart Progress Incentive Message
            </label>
            <input
              type="text"
              value={cartProgressMessage}
              onChange={(e) => setCartProgressMessage(e.target.value)}
              placeholder="Add more items to unlock benefits"
              className="w-full bg-festival-dark border border-festival-border focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-white text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">Default: &quot;Add more items to unlock benefits&quot;</p>
          </div>

          <div>
            <label className="block font-bold text-slate-300 uppercase mb-1.5">
              Top Header / Homepage Marquee Announcement Text
            </label>
            <textarea
              rows={2}
              value={festivalAnnouncement}
              onChange={(e) => setFestivalAnnouncement(e.target.value)}
              placeholder="Festival sale announcement banner text..."
              className="w-full bg-festival-dark border border-festival-border focus:border-amber-400 rounded-xl p-3 text-white text-xs leading-relaxed"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => handleSaveSettings('messages')}
            disabled={savingSection === 'messages'}
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all"
          >
            {savingSection === 'messages' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Custom Messages</span>
          </button>
        </div>
      </div>

      {/* Add / Edit Discount Slab Modal */}
      {isEditingSlab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-festival-card border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-festival-border">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Percent className="w-5 h-5 text-amber-400" />
                <span>{editingIndex !== null ? 'Edit Discount Rule' : 'Add New Discount Rule'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingSlab(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSlabModal} noValidate className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1.5">
                  Minimum Order Amount (₹) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={slabForm.minAmount}
                    onChange={(e) => setSlabForm({ ...slabForm, minAmount: e.target.value })}
                    placeholder="e.g. 1500"
                    className="w-full bg-festival-dark border border-festival-border focus:border-amber-400 rounded-xl pl-8 pr-3.5 py-2.5 text-white font-mono text-sm"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter any minimum cart amount (e.g. ₹100, ₹250, ₹1500, ₹2750, ₹3000, ₹9999).
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1.5">
                  Discount Percentage (%) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={slabForm.discountPercentage}
                    onChange={(e) => setSlabForm({ ...slabForm, discountPercentage: e.target.value })}
                    placeholder="e.g. 10"
                    className="w-full bg-festival-dark border border-festival-border focus:border-amber-400 rounded-xl pl-3.5 pr-8 py-2.5 text-white font-mono text-sm"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    %
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter discount percentage from 0.01% to 100% (e.g. 5, 7.5, 10, 15).
                </p>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingSlab(false)}
                  className="px-4 py-2.5 rounded-xl bg-festival-dark text-slate-300 font-bold hover:text-white border border-festival-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 hover:from-red-500 hover:to-orange-500 text-slate-950 font-black rounded-xl shadow-lg transition-all"
                >
                  {editingIndex !== null ? 'Update Rule' : 'Add Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessSettingsManager;
