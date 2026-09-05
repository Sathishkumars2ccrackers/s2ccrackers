import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Building,
  Phone,
  User,
  Home,
  Briefcase,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { pincodeService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AddressFormModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const { toastError, toastSuccess } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
    type: 'home',
    isDefault: false,
  });

  const [pinVerifying, setPinVerifying] = useState(false);
  const [pinStatus, setPinStatus] = useState({ checked: false, serviceable: true, message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        addressLine1: initialData.addressLine1 || '',
        addressLine2: initialData.addressLine2 || '',
        city: initialData.city || '',
        state: initialData.state || 'Tamil Nadu',
        pincode: initialData.pincode || '',
        type: initialData.type || 'home',
        isDefault: Boolean(initialData.isDefault),
      });
      if (initialData.pincode) {
        setPinStatus({ checked: true, serviceable: true, message: 'Verified' });
      }
    } else {
      setFormData({
        name: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: 'Tamil Nadu',
        pincode: '',
        type: 'home',
        isDefault: false,
      });
      setPinStatus({ checked: false, serviceable: true, message: '' });
    }
    setError('');
  }, [initialData, isOpen]);

  const verifyPincode = async (pin) => {
    if (!pin || pin.length !== 6 || !/^[1-9][0-9]{5}$/.test(pin)) {
      setPinStatus({ checked: false, serviceable: true, message: '' });
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
          message: res.data.message || (res.data.serviceable ? 'Delivery available' : 'Currently unserviceable'),
        });

        if (res.data.serviceable) {
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
        serviceable: true,
        message: 'Direct delivery verification on dispatch',
      });
    } finally {
      setPinVerifying(false);
    }
  };

  const handlePincodeChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setFormData((prev) => ({ ...prev, pincode: val }));
    if (val.length === 6) {
      verifyPincode(val);
    } else {
      setPinStatus({ checked: false, serviceable: true, message: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Contact person name is required.');
      return;
    }

    if (!formData.phone.trim() || !/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!formData.addressLine1.trim()) {
      setError('Door/flat number & building name is required.');
      return;
    }

    if (!formData.city.trim()) {
      setError('City / district is required.');
      return;
    }

    if (!formData.pincode.trim() || formData.pincode.length !== 6) {
      setError('Please enter a 6-digit delivery PIN code.');
      return;
    }

    setSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save address. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-festival-card border border-festival-border rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-festival-border">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-lg">
              <MapPin className="w-5 h-5" />
              <h3 className="text-white">{initialData ? 'Edit Saved Address' : 'Add New Delivery Address'}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Address Type Tag Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-2">Address Tag</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'home', label: 'Home', icon: Home },
                  { id: 'office', label: 'Office', icon: Briefcase },
                  { id: 'other', label: 'Other', icon: Navigation },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = formData.type === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: item.id })}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-950/50'
                          : 'bg-festival-dark text-slate-300 border-festival-border hover:border-amber-500/40'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Recipient Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ramesh"
                    className="w-full bg-festival-dark border border-festival-border rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  10-Digit Mobile <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '') })
                    }
                    placeholder="e.g. 9876543210"
                    className="w-full bg-festival-dark border border-festival-border rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Address Line 1 */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Flat, House no., Building, Company, Apartment <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                placeholder="e.g. No. 42, Sri Krishna Nagar, 2nd Cross Street"
                className="w-full bg-festival-dark border border-festival-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Address Line 2 */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Area, Street, Sector, Village (Optional)
              </label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                placeholder="e.g. Near Bus Stand / Landmark"
                className="w-full bg-festival-dark border border-festival-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Pincode & City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  6-Digit PIN Code <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={formData.pincode}
                    onChange={handlePincodeChange}
                    placeholder="e.g. 600001"
                    className="w-full bg-festival-dark border border-festival-border rounded-xl pl-9 pr-9 py-2.5 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  {pinVerifying && (
                    <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                  {!pinVerifying && pinStatus.checked && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  City / District <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Chennai"
                    className="w-full bg-festival-dark border border-festival-border rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                  <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* State */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full bg-festival-dark border border-festival-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Set as Default Checkbox */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4 rounded border-festival-border text-amber-500 focus:ring-amber-500/50 bg-festival-dark"
              />
              <label htmlFor="isDefault" className="text-xs text-slate-300 font-medium select-none cursor-pointer">
                Make this my default delivery address
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-festival-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-festival-border text-slate-300 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 hover:from-red-500 hover:to-orange-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/50 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{initialData ? 'Update Address' : 'Save Address'}</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddressFormModal;
