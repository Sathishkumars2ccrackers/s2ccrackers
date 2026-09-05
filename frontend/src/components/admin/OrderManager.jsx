import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Search,
  Filter,
  Download,
  Printer,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
  Clock,
  MapPin,
  Phone,
  User,
  X,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { orderService, analyticsService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { createWhatsAppOrderUrl } from '../../utils/whatsappHelper';
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

const OrderManager = () => {
  const { toastSuccess, toastError, toastWarning } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

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
    setIsDetailModalOpen(true);
  };

  const openInvoice = (order) => {
    setSelectedOrder(order);
    setIsInvoiceModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e?.preventDefault();
    if (!selectedOrder || !newStatus) return;

    setUpdatingStatus(true);
    try {
      const res = await orderService.updateStatus(selectedOrder._id, newStatus, statusNote);
      toastSuccess(res.data.message);
      setSelectedOrder(res.data.order);
      fetchOrders();
    } catch (err) {
      toastError('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    const reason = prompt('Please enter the reason for cancellation (Stock will be automatically restored):');
    if (reason === null) return;

    try {
      const res = await orderService.cancelOrder(selectedOrder._id, reason);
      toastSuccess(res.data.message);
      setIsDetailModalOpen(false);
      fetchOrders();
    } catch (err) {
      toastError('Failed to cancel order');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-festival-card border border-festival-border p-6 rounded-3xl">
        <div>
          <h2 className="text-xl font-bold text-white">Order Management & Fulfillment</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Process Cash On Delivery orders, update dispatch timelines, and print GST invoices
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={analyticsService.getExportUrl('orders', 'xlsx')}
            download
            className="px-4 py-2.5 rounded-xl bg-festival-dark hover:bg-festival-cardHover border border-festival-border text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export Orders (.xlsx)</span>
          </a>
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
            <option value="Delivered">Delivered (COD Paid)</option>
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
                  <th className="p-4">Delivery Location</th>
                  <th className="p-4 text-center">Items Qty</th>
                  <th className="p-4 text-right">Amount (COD)</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-festival-border/50">
                {orders.map((o) => {
                  const statusClass = STATUS_COLORS[o.status] || 'bg-slate-900 text-slate-300';
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
                        </div>
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
                        <div className="flex items-center justify-end gap-2">
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

      {/* Order Detail & Status Management Modal */}
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
              <div className="flex items-center justify-between pb-4 border-b border-festival-border">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Order Information</span>
                  <h3 className="text-xl font-black text-amber-400 font-mono">{selectedOrder.orderId}</h3>
                </div>
                <button onClick={() => setIsDetailModalOpen(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
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
                <div className="flex justify-between items-center pt-2">
                  {selectedOrder.status !== 'Cancelled' && (
                    <button
                      type="button"
                      onClick={handleCancelOrder}
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
                  <p className="text-sm font-black text-amber-400">Total COD Amount: {formatCurrency(selectedOrder.totalAmount)}</p>
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
                {selectedOrder.notes && <p className="text-amber-300 pt-1">Notes: {selectedOrder.notes}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-2">
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

      {/* Printable GST Invoice Modal */}
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
                        124/B, Sivakasi Main Road, Viswanatham, Sivakasi, Tamil Nadu - 626123<br />
                        Phone: +91 99444 76516 | Web: www.s2ccrackers.com
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-base font-black uppercase text-slate-900">TAX INVOICE (COD)</h2>
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
                  </div>
                  <div className="text-right space-y-1">
                    <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">Dispatch Details:</h4>
                    <p>Payment Mode: <strong className="text-emerald-700">Cash On Delivery (COD)</strong></p>
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
                      <td colSpan="4" className="p-3 text-right text-red-700">Total Payable at Doorstep (COD):</td>
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
