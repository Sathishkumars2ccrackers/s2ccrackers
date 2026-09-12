import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Search,
  Filter,
  Download,
  Printer,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Truck,
  Package,
  Clock,
  MapPin,
  Phone,
  User,
  X,
  ExternalLink,
  ChevronDown,
  Loader2,
  MessageCircle,
  Copy,
  Check,
  Send,
  FileText,
  Mail,
  ShieldCheck,
  Calendar,
  Sparkles,
  Info,
  CheckCheck,
} from 'lucide-react';
import { orderService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { downloadExport } from '../../utils/downloadAdminFile';
import {
  createAdminOrderWhatsAppUrl,
  getBestCustomerPhone,
  validateAndCleanIndianPhone,
} from '../../utils/whatsappHelper';
import LoadingSpinner from '../common/LoadingSpinner';
import logoSvg from '../../assets/logo.svg';

const STATUS_COLORS = {
  Pending: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
  Confirmed: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40',
  Packed: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
  Shipped: 'bg-blue-950/80 text-blue-300 border-blue-500/40',
  Delivered: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
  Cancelled: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
};

const CANCELLATION_REASONS = [
  'Out of Stock',
  'Customer Requested Cancellation',
  'Delivery Not Available',
  'Wrong Pricing',
  'Payment Verification Failed',
  'Other',
];

const OrderManager = () => {
  const { toastSuccess, toastError, toastWarning } = useToast();
  const { settings } = useSettings();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // WhatsApp Confirmation Modal states
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppTargetOrder, setWhatsAppTargetOrder] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('CONFIRM_ORDER');
  const [autoConfirmOnWhatsApp, setAutoConfirmOnWhatsApp] = useState(true);
  const [whatsAppAdminNotes, setWhatsAppAdminNotes] = useState('');
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [isConfirmingWhatsApp, setIsConfirmingWhatsApp] = useState(false);

  // Detail Modal Admin Notes
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Cancellation Modal States
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReasonType, setCancelReasonType] = useState('Out of Stock');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getAllAdmin({
        search,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: 100,
      });
      if (res.data?.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      toastError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter]);

  const openDetails = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusNote('');
    setAdminNotesInput(order.adminNotes || '');
    setIsDetailModalOpen(true);
  };

  const openInvoice = (order) => {
    setSelectedOrder(order);
    setIsInvoiceModalOpen(true);
  };

  const openWhatsAppModal = (order) => {
    setWhatsAppTargetOrder(order);
    setSelectedTemplate('CONFIRM_ORDER');
    setAutoConfirmOnWhatsApp(order.status === 'Pending');
    setWhatsAppAdminNotes(order.adminNotes || '');
    setCopiedMessage(false);
    setIsWhatsAppModalOpen(true);
  };

  // WhatsApp message generation memo
  const whatsAppResult = useMemo(() => {
    if (!whatsAppTargetOrder) return null;
    const storePhone = settings?.whatsappNumber || settings?.phone || '919944476516';
    return createAdminOrderWhatsAppUrl(whatsAppTargetOrder, selectedTemplate, storePhone);
  }, [whatsAppTargetOrder, selectedTemplate, settings]);

  const handleCopyWhatsAppMessage = async () => {
    if (!whatsAppResult?.message) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(whatsAppResult.message);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = whatsAppResult.message;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedMessage(true);
      toastSuccess('WhatsApp confirmation message copied to clipboard!');
      setTimeout(() => setCopiedMessage(false), 2500);
    } catch (err) {
      toastError('Failed to copy message to clipboard.');
    }
  };

  const handleConfirmAndOpenWhatsApp = async () => {
    if (!whatsAppTargetOrder || !whatsAppResult) return;

    if (!whatsAppResult.success) {
      toastError(whatsAppResult.error || 'Invalid customer phone number');
      return;
    }

    setIsConfirmingWhatsApp(true);
    try {
      const res = await orderService.recordWhatsAppConfirmation(whatsAppTargetOrder._id, {
        autoConfirm: autoConfirmOnWhatsApp,
        adminNotes: whatsAppAdminNotes,
      });

      toastSuccess(res.data?.message || 'WhatsApp confirmation logged & order updated!');

      // Update state
      if (res.data?.order) {
        const updated = res.data.order;
        setOrders((prev) =>
          prev.map((o) => (o._id === updated._id ? { ...o, ...updated } : o))
        );
        if (selectedOrder && selectedOrder._id === updated._id) {
          setSelectedOrder((prev) => ({ ...prev, ...updated }));
        }
      } else {
        fetchOrders();
      }

      // Open WhatsApp Click-to-Chat in a new window/tab
      window.open(whatsAppResult.url, '_blank', 'noopener,noreferrer');

      setIsWhatsAppModalOpen(false);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to record WhatsApp confirmation');
    } finally {
      setIsConfirmingWhatsApp(false);
    }
  };

  const handleSaveAdminNotes = async () => {
    if (!selectedOrder) return;
    setIsSavingNotes(true);
    try {
      const res = await orderService.updateStatus(
        selectedOrder._id,
        selectedOrder.status,
        selectedOrder.statusNote || '',
        adminNotesInput
      );
      toastSuccess('Internal order notes saved successfully!');
      if (res.data?.order) {
        setSelectedOrder(res.data.order);
        setOrders((prev) =>
          prev.map((o) => (o._id === res.data.order._id ? res.data.order : o))
        );
      }
    } catch (err) {
      toastError('Failed to save notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadExport('orders', 'xlsx');
      toastSuccess('Orders exported successfully!');
    } catch (err) {
      toastError(err.message || 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e?.preventDefault();
    if (!selectedOrder || !newStatus) return;

    setUpdatingStatus(true);
    try {
      const res = await orderService.updateStatus(
        selectedOrder._id,
        newStatus,
        statusNote,
        adminNotesInput
      );
      toastSuccess(res.data.message);
      setSelectedOrder(res.data.order);
      fetchOrders();
    } catch (err) {
      toastError('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleOpenCancelModal = (order = null) => {
    if (order) setSelectedOrder(order);
    setCancelReasonType('Out of Stock');
    setCustomCancelReason('');
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancelOrder = async (e) => {
    e?.preventDefault();
    if (!selectedOrder) return;

    const finalReason =
      cancelReasonType === 'Other'
        ? customCancelReason.trim() || 'Other'
        : cancelReasonType;

    setCancellingOrder(true);
    try {
      const res = await orderService.cancelOrder(selectedOrder._id, finalReason);
      toastSuccess(res.data.message);
      setIsCancelModalOpen(false);
      setIsDetailModalOpen(false);
      fetchOrders();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-festival-card border border-festival-border p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Order Management & Fulfillment</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
              WhatsApp Integrated
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Review stock, send official WhatsApp order confirmations, track fulfillment, and print tax invoices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2.5 rounded-xl bg-festival-dark hover:bg-festival-cardHover border border-festival-border text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <Download className="w-4 h-4 text-amber-400" />
            )}
            <span>{isExporting ? 'Preparing export...' : 'Export Orders (.xlsx)'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID (S2C-...), Name, Mobile, or PIN code..."
            className="w-full bg-festival-card border border-festival-border rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-festival-card border border-festival-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">All Order Statuses</option>
            <option value="Pending">Pending (Awaiting Confirmation)</option>
            <option value="Confirmed">Confirmed (In Sivakasi Packing)</option>
            <option value="Packed">Packed & Sealed</option>
            <option value="Shipped">Dispatched / In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <LoadingSpinner text="Fetching order records..." />
      ) : orders.length === 0 ? (
        <div className="p-12 text-center bg-festival-card border border-festival-border rounded-3xl text-slate-400 text-xs">
          No orders found matching your search criteria.
        </div>
      ) : (
        <div className="bg-festival-card border border-festival-border rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-festival-dark/80 text-slate-400 uppercase font-bold border-b border-festival-border">
                <tr>
                  <th className="p-4">Order ID & Date</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4 text-center">WhatsApp Contact</th>
                  <th className="p-4">Delivery Location</th>
                  <th className="p-4 text-center">Items Qty</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-festival-border/50">
                {orders.map((o) => {
                  const statusClass = STATUS_COLORS[o.status] || 'bg-slate-900 text-slate-300';
                  const isContacted = !!o.whatsappConfirmationSent;
                  return (
                    <tr key={o._id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className="font-mono font-black text-amber-400 text-xs block">{o.orderId}</span>
                          <span className="text-[10px] text-slate-400">{formatDate(o.createdAt, true)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-white">{o.customerDetails?.name}</p>
                          <p className="text-[11px] text-slate-400">📞 {o.customerDetails?.phone}</p>
                          {o.customerDetails?.email && (
                            <p className="text-[10px] text-slate-500 truncate max-w-[150px]">✉ {o.customerDetails.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {isContacted ? (
                          <div className="inline-flex flex-col items-center gap-0.5">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40"
                              title={o.whatsappConfirmationSentAt ? `Contacted at ${formatDate(o.whatsappConfirmationSentAt, true)} by ${o.whatsappConfirmationSentBy || 'Admin'}` : 'Customer Contacted'}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span>Customer Contacted</span>
                            </span>
                            {o.whatsappConfirmationSentAt && (
                              <span className="text-[9px] text-slate-400 font-mono">
                                {formatDate(o.whatsappConfirmationSentAt, true)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>Pending Contact</span>
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-300">
                        <p className="font-medium text-white">{o.customerDetails?.city}</p>
                        <p className="text-[10px] text-slate-400">PIN: {o.customerDetails?.pincode}</p>
                      </td>
                      <td className="p-4 text-center font-bold text-white">
                        {o.items?.reduce((sum, item) => sum + item.quantity, 0)} boxes
                      </td>
                      <td className="p-4 text-right font-black text-amber-400 text-sm">
                        {formatCurrency(o.totalAmount)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${statusClass}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Direct WhatsApp Confirmation Button */}
                          <button
                            onClick={() => openWhatsAppModal(o)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-all shadow-sm"
                            title="WhatsApp Order Confirmation"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="hidden xl:inline">WhatsApp</span>
                          </button>
                          <button
                            onClick={() => openDetails(o)}
                            className="px-3 py-1.5 rounded-lg bg-festival-dark hover:bg-festival-cardHover border border-amber-500/30 text-amber-300 text-xs font-bold"
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => openInvoice(o)}
                            className="p-1.5 rounded-lg bg-festival-dark hover:bg-white/10 text-slate-300"
                            title="Print Invoice"
                          >
                            <Printer className="w-4 h-4 text-amber-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. WHATSAPP CONFIRMATION & PREVIEW MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isWhatsAppModalOpen && whatsAppTargetOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isConfirmingWhatsApp && setIsWhatsAppModalOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-festival-card border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 my-8 max-h-[92vh] overflow-y-auto space-y-5"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-3 border-b border-festival-border">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-emerald-950/90 text-emerald-400 border border-emerald-500/40">
                      <MessageCircle className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] text-emerald-400 font-extrabold uppercase tracking-wider">
                      WhatsApp Order Confirmation
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white font-mono mt-1">
                    Order #{whatsAppTargetOrder.orderId}
                  </h3>
                </div>
                <button
                  onClick={() => !isConfirmingWhatsApp && setIsWhatsAppModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Confirmation Prompt Alert */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200/95 space-y-1">
                <p className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Do you want to mark this order as Confirmed and open WhatsApp?
                </p>
                <p className="text-[11px] text-slate-300">
                  Review the customer details and live message preview below. Clicking "Confirm & Open WhatsApp" logs the communication, updates order status, and launches WhatsApp Click-to-Chat.
                </p>
              </div>

              {/* Customer & Phone Validation Card */}
              <div className="p-4 rounded-2xl bg-festival-dark border border-festival-border space-y-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer Name</span>
                    <span className="text-white font-bold text-sm">{whatsAppTargetOrder.customerDetails?.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Target WhatsApp Number</span>
                    {whatsAppResult?.success ? (
                      <span className="font-mono font-bold text-emerald-300 flex items-center gap-1 text-sm">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        +{whatsAppResult.customerPhone} ({whatsAppResult.isPrimary ? 'Primary' : 'Secondary'})
                      </span>
                    ) : (
                      <span className="font-mono font-bold text-rose-400 flex items-center gap-1 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        {whatsAppResult?.error || 'Invalid customer phone number'}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Delivery Location</span>
                    <span className="text-slate-200">
                      {whatsAppTargetOrder.customerDetails?.city} - {whatsAppTargetOrder.customerDetails?.pincode}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Order Value</span>
                    <span className="text-amber-400 font-black text-sm">
                      {formatCurrency(whatsAppTargetOrder.totalAmount)} ({whatsAppTargetOrder.items?.length || 0} items)
                    </span>
                  </div>
                </div>

                {whatsAppTargetOrder.customerDetails?.email && (
                  <div className="pt-2 border-t border-festival-border/50 text-[11px] text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Customer Email: <strong>{whatsAppTargetOrder.customerDetails.email}</strong></span>
                  </div>
                )}
              </div>

              {/* Template Switcher (Multi-template ready architecture) */}
              <div>
                <label className="block text-slate-300 font-bold mb-1 text-[11px] uppercase tracking-wide">
                  Select WhatsApp Template
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: 'CONFIRM_ORDER', label: 'Order Confirmed' },
                    { id: 'DISPATCH_UPDATE', label: 'Dispatched' },
                    { id: 'DELIVERED_UPDATE', label: 'Delivered' },
                    { id: 'CANCELLED_ORDER', label: 'Cancelled' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`p-2 rounded-xl text-center font-bold text-[11px] transition-all border ${
                        selectedTemplate === t.id
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 shadow'
                          : 'bg-festival-dark text-slate-400 border-festival-border hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Live Preview Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-bold text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Message Preview (Pre-filled for WhatsApp)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyWhatsAppMessage}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors"
                  >
                    {copiedMessage ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Message</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative p-4 rounded-2xl bg-slate-950/90 border border-festival-border text-slate-200 text-xs font-mono max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text shadow-inner">
                  {whatsAppResult?.message || 'Preparing message...'}
                </div>
              </div>

              {/* Internal Order Notes */}
              <div>
                <label className="block text-slate-300 font-bold mb-1 text-[11px] uppercase tracking-wide">
                  Admin Internal Notes (Special Customer Requests / Dispatch Notes)
                </label>
                <input
                  type="text"
                  value={whatsAppAdminNotes}
                  onChange={(e) => setWhatsAppAdminNotes(e.target.value)}
                  placeholder="e.g. Call before dispatch / Send on Monday morning / Doorstep cash verification"
                  className="w-full bg-festival-dark border border-festival-border rounded-xl p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Auto Confirm Checkbox */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-festival-dark/60 border border-festival-border text-xs">
                <input
                  type="checkbox"
                  id="autoConfirmCheckbox"
                  checked={autoConfirmOnWhatsApp}
                  onChange={(e) => setAutoConfirmOnWhatsApp(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-600 bg-festival-card cursor-pointer"
                />
                <label htmlFor="autoConfirmCheckbox" className="text-slate-300 cursor-pointer select-none">
                  Automatically mark order as <strong className="text-indigo-300">"Confirmed (In Sivakasi Packing)"</strong>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-festival-border">
                <button
                  type="button"
                  disabled={isConfirmingWhatsApp}
                  onClick={() => setIsWhatsAppModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-festival-border text-slate-300 hover:text-white font-bold text-xs transition-colors"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleCopyWhatsAppMessage}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-festival-dark hover:bg-festival-cardHover border border-festival-border text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copiedMessage ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedMessage ? 'Copied' : 'Copy Message'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isConfirmingWhatsApp || !whatsAppResult?.success}
                    onClick={handleConfirmAndOpenWhatsApp}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConfirmingWhatsApp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Recording...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Confirm & Open WhatsApp</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 2. ORDER DETAIL & STATUS MANAGEMENT MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isDetailModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-festival-card border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 my-8 max-h-[90vh] overflow-y-auto space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-festival-border">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Order Information</span>
                  <h3 className="text-xl font-black text-amber-400 font-mono">{selectedOrder.orderId}</h3>
                </div>
                <button onClick={() => setIsDetailModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* WhatsApp Quick Action Banner */}
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-emerald-400 uppercase flex items-center gap-1">
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      <span>WhatsApp Confirmation</span>
                    </span>
                    {selectedOrder.whatsappConfirmationSent ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ✓ Sent
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    {selectedOrder.whatsappConfirmationSent
                      ? `Sent on ${formatDate(selectedOrder.whatsappConfirmationSentAt, true)} by ${selectedOrder.whatsappConfirmationSentBy || 'Admin'}`
                      : 'Send full order breakdown, tracking link, and confirmation directly to customer via WhatsApp'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openWhatsAppModal(selectedOrder)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all shrink-0"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{selectedOrder.whatsappConfirmationSent ? 'Resend WhatsApp' : 'WhatsApp Confirm Order'}</span>
                </button>
              </div>

              {/* Status Update Form */}
              <form onSubmit={handleUpdateStatus} className="p-4 rounded-2xl bg-festival-dark/80 border border-festival-border space-y-3">
                <h4 className="text-xs font-bold text-white uppercase">Update Dispatch Status</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full bg-festival-card border border-festival-border rounded-xl p-2 text-white"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Packed">Packed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Status Note</label>
                    <input
                      type="text"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="e.g. Packed in Box 3 / Dispatched via VRL Parcel"
                      className="w-full bg-festival-card border border-festival-border rounded-xl p-2 text-white"
                    />
                  </div>
                </div>

                {/* Cancelled Order Notice for Admin */}
                {selectedOrder.status === 'Cancelled' && (
                  <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs space-y-1.5">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="font-extrabold text-rose-400 uppercase flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        <span>Status: Cancelled</span>
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Cancelled At: {selectedOrder.cancelledAt ? formatDate(selectedOrder.cancelledAt, true) : 'Not available'}
                      </span>
                    </div>
                    <div className="text-slate-300">
                      <span className="font-semibold text-slate-400">Cancellation Reason: </span>
                      <span className="text-white font-medium">{selectedOrder.cancellationReason || 'Not available'}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  {selectedOrder.status !== 'Cancelled' && (
                    <button
                      type="button"
                      onClick={() => handleOpenCancelModal(selectedOrder)}
                      className="text-xs text-rose-400 font-bold hover:underline"
                    >
                      Cancel Order & Restock
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow"
                  >
                    {updatingStatus ? 'Updating...' : 'Save Status'}
                  </button>
                </div>
              </form>

              {/* Admin Internal Notes Section */}
              <div className="p-4 rounded-2xl bg-festival-dark/80 border border-festival-border space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white uppercase flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Internal Admin Notes</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleSaveAdminNotes}
                    disabled={isSavingNotes}
                    className="px-3 py-1 rounded-lg bg-festival-cardHover border border-festival-border text-amber-300 hover:text-white font-bold text-[11px] flex items-center gap-1 transition-colors"
                  >
                    {isSavingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    <span>{isSavingNotes ? 'Saving...' : 'Save Note'}</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  placeholder="Record customer special requests (e.g., 'Send next week', 'Call before dispatch', etc.)..."
                  className="w-full bg-festival-card border border-festival-border rounded-xl p-2.5 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Items List */}
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-white uppercase pb-1 border-b border-festival-border">
                  Ordered Fireworks ({selectedOrder.items?.length} varieties)
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-festival-dark">
                      <div>
                        <p className="font-bold text-white">{item.name}</p>
                        <p className="text-[10px] text-slate-400">{item.quantity} × {formatCurrency(item.price)}</p>
                      </div>
                      <span className="font-black text-amber-400">{formatCurrency(item.subtotal || item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-festival-border space-y-1 text-right font-semibold">
                  <p className="text-slate-300">Subtotal: {formatCurrency(selectedOrder.subtotal)}</p>
                  <p className="text-slate-300">Delivery Fee: {formatCurrency(selectedOrder.deliveryFee)}</p>
                  <p className="text-sm font-black text-amber-400">Total Amount: {formatCurrency(selectedOrder.totalAmount)}</p>
                </div>
              </div>

              {/* Customer Details */}
              <div className="p-4 rounded-2xl bg-festival-dark text-xs text-slate-300 space-y-1">
                <h4 className="font-bold text-white uppercase text-[11px] text-amber-400">Customer Delivery Info</h4>
                <p className="font-bold text-white text-sm">{selectedOrder.customerDetails?.name}</p>
                <p>{selectedOrder.customerDetails?.address}</p>
                {selectedOrder.customerDetails?.landmark && <p>Landmark: {selectedOrder.customerDetails.landmark}</p>}
                <p>{selectedOrder.customerDetails?.city} - <strong>{selectedOrder.customerDetails?.pincode}</strong></p>
                <p>📞 Phone: {selectedOrder.customerDetails?.phone} {selectedOrder.customerDetails?.altPhone ? `| Alt: ${selectedOrder.customerDetails.altPhone}` : ''}</p>
                {selectedOrder.customerDetails?.email && <p>✉ Email: {selectedOrder.customerDetails.email}</p>}
                {selectedOrder.notes && <p className="text-amber-300 pt-1">Customer Order Notes: {selectedOrder.notes}</p>}
              </div>

              <div className="flex justify-between items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => openWhatsAppModal(selectedOrder)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Confirmation
                </button>
                <button
                  onClick={() => openInvoice(selectedOrder)}
                  className="px-5 py-2.5 bg-festival-cardHover border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  Print Formal Invoice
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 3. CANCEL ORDER MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isCancelModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !cancellingOrder && setIsCancelModalOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-festival-card border border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 my-8 space-y-5"
            >
              <div className="flex items-start justify-between pb-3 border-b border-festival-border">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-rose-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Cancel & Restock Order</span>
                  </span>
                  <h3 className="text-lg font-black text-white font-mono">{selectedOrder.orderId}</h3>
                </div>
                <button
                  onClick={() => !cancellingOrder && setIsCancelModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Warning notice */}
              <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed">
                <p className="font-bold text-amber-300">⚠️ Automatic Inventory Restocking:</p>
                <p className="text-[11px] mt-0.5">
                  Cancelling will restore {(selectedOrder.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0)} item(s) back into active stock and record this cancellation reason on the customer's account and tracking pages.
                </p>
              </div>

              <form onSubmit={handleConfirmCancelOrder} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5 uppercase tracking-wide">
                    Cancellation Reason <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={cancelReasonType}
                    onChange={(e) => setCancelReasonType(e.target.value)}
                    className="w-full bg-festival-dark border border-festival-border rounded-xl p-3 text-white text-xs sm:text-sm focus:outline-none focus:border-rose-500"
                  >
                    {CANCELLATION_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {cancelReasonType === 'Other' && (
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5 uppercase tracking-wide">
                      Custom Cancellation Reason <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={customCancelReason}
                      onChange={(e) => setCustomCancelReason(e.target.value)}
                      placeholder="Enter specific reason for customer and dispatch records..."
                      className="w-full bg-festival-dark border border-festival-border rounded-xl p-3 text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:border-rose-500 resize-none"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={cancellingOrder}
                    onClick={() => setIsCancelModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-festival-border text-slate-300 hover:text-white font-bold text-xs transition-colors"
                  >
                    Keep Order Active
                  </button>
                  <button
                    type="submit"
                    disabled={cancellingOrder}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/50 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {cancellingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Cancelling & Restocking...</span>
                      </>
                    ) : (
                      <span>Confirm Cancellation</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 4. PRINTABLE TAX INVOICE MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isInvoiceModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInvoiceModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm no-print"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-white text-black rounded-3xl p-8 sm:p-10 shadow-2xl z-10 my-8 max-h-[95vh] overflow-y-auto space-y-6"
            >
              {/* Top controls (no-print) */}
              <div className="no-print flex items-center justify-between pb-4 border-b border-slate-200">
                <span className="font-bold text-slate-700 text-sm">Official Packaging Tax Invoice</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow"
                  >
                    <Printer className="w-4 h-4" />
                    Print Invoice
                  </button>
                  <button onClick={() => setIsInvoiceModalOpen(false)} className="text-slate-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Invoice Sheet */}
              <div className="space-y-6 text-xs text-slate-800">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-xl bg-[#180b27] border border-amber-500/30">
                      <img src={logoSvg} alt="S2C Crackers" className="h-10 w-auto" />
                    </div>
                    <div>
                      <h1 className="text-xl font-black tracking-tight text-red-700">S2C CRACKERS</h1>
                      <p className="font-semibold text-slate-700">Direct Factory Sivakasi Fireworks</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs">
                        {settings?.address || 'Azhagar Crackers, 570 (East Part), Singapore Nagar, Chatitapatti, Madurai - 625014, Tamil Nadu, India'}<br />
                        Phone: {settings?.phone || '+91 99444 76516'} | Web: {settings?.businessDomain || 'www.s2ccrackers.com'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-base font-black uppercase text-slate-900">TAX INVOICE</h2>
                    <p className="font-mono font-bold text-sm text-red-700 mt-0.5">#{selectedOrder.orderId}</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Date: {formatDate(selectedOrder.createdAt, true)}
                    </p>
                  </div>
                </div>

                {/* Bill to */}
                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">Billed & Delivered To:</h4>
                    <p className="font-bold text-sm text-slate-900">{selectedOrder.customerDetails?.name}</p>
                    <p>{selectedOrder.customerDetails?.address}</p>
                    {selectedOrder.customerDetails?.landmark && <p>Landmark: {selectedOrder.customerDetails.landmark}</p>}
                    <p>{selectedOrder.customerDetails?.city}, {selectedOrder.customerDetails?.state} - <strong>{selectedOrder.customerDetails?.pincode}</strong></p>
                    <p className="pt-1">Phone: <strong>{selectedOrder.customerDetails?.phone}</strong></p>
                    {selectedOrder.customerDetails?.email && <p>Email: {selectedOrder.customerDetails.email}</p>}
                  </div>
                  <div className="text-right space-y-1">
                    <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">Dispatch Details:</h4>
                    <p>Payment Mode: <strong className="text-emerald-700">Door Delivery Available</strong></p>
                    <p>Dispatch Hub: <strong>Sivakasi Factory Center</strong></p>
                    <p>Status: <strong>{selectedOrder.status}</strong></p>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Product Description</th>
                      <th className="p-2.5 text-center">Qty (Boxes)</th>
                      <th className="p-2.5 text-right">Rate (₹)</th>
                      <th className="p-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedOrder.items?.map((item, i) => (
                      <tr key={i}>
                        <td className="p-2.5 text-slate-500">{i + 1}</td>
                        <td className="p-2.5 font-bold text-slate-900">{item.name}</td>
                        <td className="p-2.5 text-center font-semibold">{item.quantity}</td>
                        <td className="p-2.5 text-right text-slate-600">₹{item.price}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">₹{item.subtotal || item.price * item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-900 font-bold">
                    <tr>
                      <td colSpan="4" className="p-2 text-right">Subtotal:</td>
                      <td className="p-2 text-right">₹{selectedOrder.subtotal}</td>
                    </tr>
                    <tr>
                      <td colSpan="4" className="p-2 text-right">Shipping & Delivery:</td>
                      <td className="p-2 text-right">{selectedOrder.deliveryFee === 0 ? 'FREE' : `₹${selectedOrder.deliveryFee}`}</td>
                    </tr>
                    <tr className="text-sm font-black bg-slate-100">
                      <td colSpan="4" className="p-3 text-right text-red-700">Total Order Amount:</td>
                      <td className="p-3 text-right text-red-700 text-base">₹{selectedOrder.totalAmount}</td>
                    </tr>
                  </tfoot>
                </table>

                {/* Footer notes */}
                <div className="pt-4 border-t border-slate-300 flex justify-between items-end text-[10px] text-slate-500">
                  <div className="space-y-0.5">
                    <p>⭐ 100% Genuine Sivakasi Quality Verified.</p>
                    <p>⭐ Safe handling: Light fireworks only under adult supervision with agarbatti.</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">For S2C CRACKERS, SIVAKASI</p>
                    <p className="pt-6">Authorized Signatory</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderManager;
