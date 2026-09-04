import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Trash2, Edit2, Upload, Download, Search, CheckCircle2, XCircle, X } from 'lucide-react';
import { pincodeService, analyticsService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';

const PincodeManager = () => {
  const { toastSuccess, toastError, toastWarning } = useToast();

  const [pincodes, setPincodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPin, setEditingPin] = useState(null);
  const [formData, setFormData] = useState({
    pincode: '',
    city: '',
    state: 'Tamil Nadu',
    deliveryFee: '150',
    estimatedDays: '2-4 business days',
    isActive: true,
  });

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkImporting, setBulkImporting] = useState(false);

  const fetchPincodes = async () => {
    setLoading(true);
    try {
      const res = await pincodeService.getAllAdmin({ search, limit: 150 });
      if (res.data?.success) {
        setPincodes(res.data.pincodes || []);
      }
    } catch {
      toastError('Failed to load pincodes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPincodes();
  }, [search]);

  const openAdd = () => {
    setEditingPin(null);
    setFormData({
      pincode: '',
      city: '',
      state: 'Tamil Nadu',
      deliveryFee: '150',
      estimatedDays: '2-4 business days',
      isActive: true,
    });
    setIsAddModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingPin(item);
    setFormData({
      pincode: item.pincode,
      city: item.city,
      state: item.state || 'Tamil Nadu',
      deliveryFee: item.deliveryFee.toString(),
      estimatedDays: item.estimatedDays || '2-4 business days',
      isActive: item.isActive !== undefined ? item.isActive : true,
    });
    setIsAddModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.pincode || formData.pincode.length !== 6 || !formData.city) {
      toastWarning('Please enter a valid 6-digit PIN code and city.');
      return;
    }

    try {
      if (editingPin) {
        await pincodeService.update(editingPin._id, formData);
        toastSuccess('Pincode updated successfully');
      } else {
        await pincodeService.create(formData);
        toastSuccess('New serviceable pincode added');
      }
      setIsAddModalOpen(false);
      fetchPincodes();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save pincode');
    }
  };

  const handleDelete = async (id, pin) => {
    if (window.confirm(`Delete serviceable PIN code ${pin}? Customers at this location will be blocked at checkout.`)) {
      try {
        await pincodeService.delete(id);
        toastSuccess(`Deleted PIN code ${pin}`);
        fetchPincodes();
      } catch (err) {
        toastError('Failed to delete pincode');
      }
    }
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!bulkFile) {
      toastWarning('Please select an Excel or CSV file.');
      return;
    }
    setBulkImporting(true);
    try {
      const data = new FormData();
      data.append('file', bulkFile);
      const res = await pincodeService.importBulk(data);
      toastSuccess(res.data.message);
      setIsBulkModalOpen(false);
      fetchPincodes();
    } catch (err) {
      toastError('Bulk import failed');
    } finally {
      setBulkImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-festival-card border border-festival-border p-6 rounded-3xl">
        <div>
          <h2 className="text-xl font-bold text-white">Serviceable Pincode Delivery Zones</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure delivery coverage and dispatch fees. Unlisted pincodes will be blocked at checkout.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-festival-dark hover:bg-festival-cardHover border border-festival-border text-xs font-bold text-amber-300 flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Import Pincodes</span>
          </button>

          <a
            href={analyticsService.getExportUrl('pincodes', 'xlsx')}
            download
            className="px-4 py-2.5 rounded-xl bg-festival-dark hover:bg-festival-cardHover border border-festival-border text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export (.xlsx)</span>
          </a>

          <button
            onClick={openAdd}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 hover:from-red-500 hover:to-orange-500 text-slate-950 font-black text-xs shadow-lg flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Serviceable Pincode</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by PIN code (e.g. 600001) or City..."
          className="w-full bg-festival-card border border-festival-border rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
      </div>

      {/* Pincodes Table */}
      {loading ? (
        <LoadingSpinner text="Fetching delivery zones..." />
      ) : pincodes.length === 0 ? (
        <div className="p-12 text-center bg-festival-card border border-festival-border rounded-3xl text-slate-400 text-xs">
          No serviceable pincodes found. Click "Add Serviceable Pincode" or bulk import from CSV/Excel.
        </div>
      ) : (
        <div className="bg-festival-card border border-festival-border rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-festival-dark/80 text-slate-400 uppercase font-bold border-b border-festival-border">
                <tr>
                  <th className="p-4">PIN Code</th>
                  <th className="p-4">City / Area</th>
                  <th className="p-4">State</th>
                  <th className="p-4 text-right">Delivery Charge</th>
                  <th className="p-4">Estimated Dispatch Duration</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-festival-border/50">
                {pincodes.map((pin) => (
                  <tr key={pin._id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono font-black text-amber-400 text-sm">{pin.pincode}</td>
                    <td className="p-4 font-bold text-white">{pin.city}</td>
                    <td className="p-4 text-slate-300">{pin.state}</td>
                    <td className="p-4 text-right font-black text-white">
                      {pin.deliveryFee === 0 ? <span className="text-emerald-400">FREE</span> : formatCurrency(pin.deliveryFee)}
                    </td>
                    <td className="p-4 text-slate-400">{pin.estimatedDays}</td>
                    <td className="p-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          pin.isActive
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {pin.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(pin)}
                          className="p-1.5 text-amber-400 hover:bg-amber-500/20 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(pin._id, pin.pincode)}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Pincode Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-festival-card border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-5"
            >
              <div className="flex items-center justify-between pb-4 border-b border-festival-border">
                <h3 className="text-base font-bold text-white">
                  {editingPin ? 'Edit Serviceable Pincode' : 'Add Serviceable Pincode'}
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    6-Digit PIN Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    disabled={!!editingPin}
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="e.g. 600001"
                    className="w-full bg-festival-dark border border-festival-border rounded-xl px-3 py-2.5 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    City / Town <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Chennai Central"
                    className="w-full bg-festival-dark border border-festival-border rounded-xl px-3 py-2.5 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 uppercase mb-1">Delivery Fee (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.deliveryFee}
                      onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
                      placeholder="150"
                      className="w-full bg-festival-dark border border-festival-border rounded-xl px-3 py-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 uppercase mb-1">Estimated Days</label>
                    <input
                      type="text"
                      value={formData.estimatedDays}
                      onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value })}
                      placeholder="2-4 business days"
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
                  <span>Active & Open for Delivery</span>
                </label>

                <div className="flex justify-end gap-3 pt-4 border-t border-festival-border">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-2.5 bg-festival-dark rounded-xl text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold rounded-xl shadow"
                  >
                    Save Pincode
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Pincode Import Modal */}
      <AnimatePresence>
        {isBulkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBulkModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-festival-card border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-5"
            >
              <div className="flex items-center justify-between pb-4 border-b border-festival-border">
                <h3 className="text-base font-bold text-white">Bulk Import Serviceable Pincodes</h3>
                <button onClick={() => setIsBulkModalOpen(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Upload CSV or Excel file containing columns: <strong>Pincode, City, State, Delivery Fee, Estimated Days</strong>
              </p>

              <form onSubmit={handleBulkImport} className="space-y-4 text-xs">
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={(e) => setBulkFile(e.target.files[0])}
                  className="w-full text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-festival-dark file:text-amber-400"
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-festival-border">
                  <button
                    type="button"
                    onClick={() => setIsBulkModalOpen(false)}
                    className="px-5 py-2.5 bg-festival-dark rounded-xl text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bulkImporting || !bulkFile}
                    className="px-6 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl"
                  >
                    {bulkImporting ? 'Importing...' : 'Upload & Add'}
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

export default PincodeManager;
