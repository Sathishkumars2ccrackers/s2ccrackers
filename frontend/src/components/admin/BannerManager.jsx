import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Plus, Trash2, Edit2, X, Eye, EyeOff, Sparkles, ExternalLink } from 'lucide-react';
import { bannerService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../common/LoadingSpinner';

const BannerManager = () => {
  const { toastSuccess, toastError, toastWarning } = useToast();

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    badge: 'FESTIVAL SPECIAL OFFER',
    discountTag: 'Save Up To 80% OFF',
    imageUrl: '',
    linkUrl: '/products',
    buttonText: 'Order Sivakasi Crackers',
    displayOrder: 0,
    isActive: true,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await bannerService.getAllAdmin();
      if (res.data?.banners) {
        setBanners(res.data.banners);
      }
    } catch {
      toastError('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openAdd = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      badge: 'FESTIVAL SPECIAL OFFER',
      discountTag: 'Save Up To 80% OFF',
      imageUrl: '',
      linkUrl: '/products',
      buttonText: 'Order Sivakasi Crackers',
      displayOrder: banners.length + 1,
      isActive: true,
    });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const openEdit = (b) => {
    setEditingBanner(b);
    setFormData({
      title: b.title,
      subtitle: b.subtitle || '',
      badge: b.badge || 'FESTIVAL SPECIAL OFFER',
      discountTag: b.discountTag || '',
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl || '/products',
      buttonText: b.buttonText || 'Shop Now',
      displayOrder: b.displayOrder || 0,
      isActive: b.isActive !== undefined ? b.isActive : true,
    });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || (!formData.imageUrl && !selectedFile)) {
      toastWarning('Title and Image are required.');
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([k, v]) => data.append(k, v));
      if (selectedFile) {
        data.append('image', selectedFile);
      }

      if (editingBanner) {
        await bannerService.update(editingBanner._id, data);
        toastSuccess('Banner updated successfully');
      } else {
        await bannerService.create(data);
        toastSuccess('New banner created');
      }

      setIsModalOpen(false);
      fetchBanners();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Delete banner "${title}"?`)) {
      try {
        await bannerService.delete(id);
        toastSuccess('Banner deleted');
        fetchBanners();
      } catch {
        toastError('Failed to delete banner');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-festival-card border border-festival-border p-6 rounded-3xl">
        <div>
          <h2 className="text-xl font-bold text-white">Homepage Promotional Banners</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage carousel banners, special festival tags, and promotional CTAs
          </p>
        </div>

        <button
          onClick={openAdd}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 hover:from-red-500 hover:to-orange-500 text-slate-950 font-black text-xs shadow-lg flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Banner</span>
        </button>
      </div>

      {/* Banners Grid */}
      {loading ? (
        <LoadingSpinner text="Fetching banners..." />
      ) : banners.length === 0 ? (
        <div className="p-12 text-center bg-festival-card border border-festival-border rounded-3xl text-slate-400 text-xs">
          No promotional banners configured.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((b) => (
            <div
              key={b._id}
              className="rounded-3xl bg-festival-card border border-festival-border overflow-hidden shadow-xl flex flex-col justify-between"
            >
              <div className="relative aspect-video w-full bg-festival-dark">
                <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3">
                  <span className="bg-red-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow">
                    {b.badge}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      b.isActive ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                    }`}
                  >
                    {b.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white text-base leading-snug">{b.title}</h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">{b.subtitle}</p>
                  {b.discountTag && (
                    <span className="inline-block mt-2 text-[11px] text-amber-400 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      {b.discountTag}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-festival-border text-xs">
                  <span className="text-slate-400">Order: #{b.displayOrder}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(b)}
                      className="p-1.5 text-amber-400 hover:bg-amber-500/20 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(b._id, b.title)}
                      className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Banner Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-festival-card border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-festival-border">
                <h3 className="text-base font-bold text-white">
                  {editingBanner ? 'Edit Banner' : 'Create Home Banner'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Banner Main Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Diwali Mega Fireworks 2026"
                    className="w-full bg-festival-dark border border-festival-border rounded-xl px-3 py-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Subtitle / Details</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="Direct Factory Sivakasi Genuine Crackers with Up To 80% Discount"
                    className="w-full bg-festival-dark border border-festival-border rounded-xl px-3 py-2.5 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 uppercase mb-1">Top Badge Text</label>
                    <input
                      type="text"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      placeholder="FESTIVAL SPECIAL OFFER"
                      className="w-full bg-festival-dark border border-festival-border rounded-xl px-3 py-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 uppercase mb-1">Discount Tag</label>
                    <input
                      type="text"
                      value={formData.discountTag}
                      onChange={(e) => setFormData({ ...formData, discountTag: e.target.value })}
                      placeholder="Save Up To 80% OFF"
                      className="w-full bg-festival-dark border border-festival-border rounded-xl px-3 py-2.5 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Upload Banner Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="w-full text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-festival-dark file:text-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Or Direct Image URL</label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-festival-dark border border-festival-border rounded-xl px-3 py-2.5 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 uppercase mb-1">Link Destination</label>
                    <input
                      type="text"
                      value={formData.linkUrl}
                      onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                      placeholder="/products"
                      className="w-full bg-festival-dark border border-festival-border rounded-xl px-3 py-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 uppercase mb-1">Button Text</label>
                    <input
                      type="text"
                      value={formData.buttonText}
                      onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                      placeholder="Shop Crackers Now"
                      className="w-full bg-festival-dark border border-festival-border rounded-xl px-3 py-2.5 text-white"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300 pt-1">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500"
                  />
                  <span>Active & Visible on Home Page</span>
                </label>

                <div className="flex justify-end gap-3 pt-3 border-t border-festival-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-festival-dark rounded-xl text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl shadow"
                  >
                    {saving ? 'Saving...' : 'Save Banner'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BannerManager;
