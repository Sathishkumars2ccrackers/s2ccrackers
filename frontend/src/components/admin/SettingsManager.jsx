import React, { useState, useEffect } from 'react';
import { Settings, Save, Download, Database, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { settingService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../common/LoadingSpinner';

const SettingsManager = () => {
  const { toastSuccess, toastError } = useToast();

  const [settings, setSettings] = useState({
    storeName: 'S2C Crackers',
    tagline: 'Direct from Sivakasi Factory - Safe & Genuine Fireworks',
    contactPhone: '+91 94421 87654',
    whatsappNumber: '919442187654',
    supportEmail: 'orders@s2ccrackers.com',
    factoryAddress: '124/B, Sivakasi Main Road, Viswanatham, Sivakasi, Tamil Nadu - 626123',
    minOrderAmount: 500,
    freeDeliveryThreshold: 3000,
    announcementText: '🔥 DIWALI 2026 FACTORY DIRECT BOOKING OPEN • FLAT 80% DISCOUNT ON ALL SIVAKASI CRACKERS • 100% CASH ON DELIVERY (COD)',
    isStoreOpen: true,
    storeClosedMessage: 'Booking is temporarily paused for Diwali dispatch preparation.',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  useEffect(() => {
    settingService
      .getPublic()
      .then((res) => {
        if (res.data?.settings) {
          const s = res.data.settings;
          setSettings((prev) => ({
            ...prev,
            storeName: s.businessName || prev.storeName,
            whatsappNumber: s.whatsappNumber || prev.whatsappNumber,
            contactPhone: s.phone || prev.contactPhone,
            supportEmail: s.email || prev.supportEmail,
            factoryAddress: s.address || prev.factoryAddress,
            minOrderAmount: s.minOrderAmount || prev.minOrderAmount,
            freeDeliveryThreshold: s.freeDeliveryThreshold || prev.freeDeliveryThreshold,
            announcementText: s.festivalAnnouncement || prev.announcementText,
            isStoreOpen: s.isStoreOpen !== undefined ? s.isStoreOpen : prev.isStoreOpen,
            storeClosedMessage: s.storeClosedNotice || prev.storeClosedMessage,
          }));
        }
      })
      .catch((err) => console.error('Failed to load settings:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingService.updateAdmin({
        businessName: settings.storeName,
        phone: settings.contactPhone,
        whatsappNumber: settings.whatsappNumber,
        email: settings.supportEmail,
        address: settings.factoryAddress,
        minOrderAmount: settings.minOrderAmount,
        freeDeliveryThreshold: settings.freeDeliveryThreshold,
        festivalAnnouncement: settings.announcementText,
        isStoreOpen: settings.isStoreOpen,
        storeClosedNotice: settings.storeClosedMessage,
      });
      toastSuccess('Store configuration updated successfully!');
    } catch (err) {
      toastError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = async () => {
    setBackingUp(true);
    try {
      const res = await settingService.downloadBackup();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `s2c_crackers_db_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toastSuccess('Database backup downloaded successfully!');
    } catch (err) {
      toastError('Failed to generate database backup');
    } finally {
      setBackingUp(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Fetching store settings..." />;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="bg-festival-card border border-festival-border p-6 rounded-3xl">
        <h2 className="text-xl font-bold text-white">Store Settings & Configuration</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage factory contact information, WhatsApp numbers, order threshold rules, and database backups
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-festival-card border border-festival-border p-6 sm:p-8 rounded-3xl space-y-6">
        <h3 className="text-sm font-bold text-white uppercase pb-3 border-b border-festival-border flex items-center gap-2 text-amber-400">
          <Settings className="w-4 h-4" />
          <span>General Business & Contact Details</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 uppercase mb-1">Store Name</label>
            <input
              type="text"
              name="storeName"
              value={settings.storeName}
              onChange={handleChange}
              className="w-full bg-festival-dark border border-festival-border rounded-xl px-3.5 py-2.5 text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-300 uppercase mb-1">WhatsApp Order Number</label>
            <input
              type="text"
              name="whatsappNumber"
              value={settings.whatsappNumber}
              onChange={handleChange}
              placeholder="e.g. 919442187654"
              className="w-full bg-festival-dark border border-festival-border rounded-xl px-3.5 py-2.5 text-white font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-300 uppercase mb-1">Contact Phone</label>
            <input
              type="text"
              name="contactPhone"
              value={settings.contactPhone}
              onChange={handleChange}
              className="w-full bg-festival-dark border border-festival-border rounded-xl px-3.5 py-2.5 text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-300 uppercase mb-1">Support Email</label>
            <input
              type="email"
              name="supportEmail"
              value={settings.supportEmail}
              onChange={handleChange}
              className="w-full bg-festival-dark border border-festival-border rounded-xl px-3.5 py-2.5 text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
            Sivakasi Factory Physical Address
          </label>
          <textarea
            name="factoryAddress"
            rows={2}
            value={settings.factoryAddress}
            onChange={handleChange}
            className="w-full bg-festival-dark border border-festival-border rounded-xl p-3 text-xs text-white"
          />
        </div>

        <h3 className="text-sm font-bold text-white uppercase pb-3 pt-2 border-b border-festival-border flex items-center gap-2 text-amber-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Checkout & Minimum Order Thresholds</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 uppercase mb-1">Minimum Order Amount (₹)</label>
            <input
              type="number"
              min="0"
              name="minOrderAmount"
              value={settings.minOrderAmount}
              onChange={handleChange}
              className="w-full bg-festival-dark border border-festival-border rounded-xl px-3.5 py-2.5 text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-300 uppercase mb-1">Free Delivery Threshold (₹)</label>
            <input
              type="number"
              min="0"
              name="freeDeliveryThreshold"
              value={settings.freeDeliveryThreshold}
              onChange={handleChange}
              className="w-full bg-festival-dark border border-festival-border rounded-xl px-3.5 py-2.5 text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
            Top Announcement Marquee Text
          </label>
          <input
            type="text"
            name="announcementText"
            value={settings.announcementText}
            onChange={handleChange}
            className="w-full bg-festival-dark border border-festival-border rounded-xl px-3.5 py-2.5 text-xs text-white"
          />
        </div>

        <div className="p-4 rounded-2xl bg-festival-dark border border-festival-border space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-white">
            <input
              type="checkbox"
              name="isStoreOpen"
              checked={settings.isStoreOpen}
              onChange={handleChange}
              className="w-4 h-4 rounded text-amber-500"
            />
            <span>Store Open for Customer Checkout</span>
          </label>
          {!settings.isStoreOpen && (
            <div>
              <label className="block text-xs font-bold text-rose-300 uppercase mb-1">
                Store Closed Reason Message
              </label>
              <input
                type="text"
                name="storeClosedMessage"
                value={settings.storeClosedMessage}
                onChange={handleChange}
                className="w-full bg-festival-card border border-rose-500/40 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 hover:from-red-500 hover:to-orange-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-xl shadow-amber-950/40 transition-all flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Store Configuration</span>
          </button>
        </div>
      </form>

      {/* Database Full Backup Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-festival-card border border-emerald-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-emerald-400 font-bold">
            <Database className="w-6 h-6" />
            <div>
              <h3 className="text-white text-base">Full Database JSON Backup</h3>
              <p className="text-xs text-slate-400 font-normal">
                Download complete store collection data (Products, Orders, Customers, Pincodes, Settings)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownloadBackup}
            disabled={backingUp}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all"
          >
            {backingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Download Database Backup</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;
