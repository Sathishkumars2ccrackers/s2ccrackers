import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, MapPin, ShoppingBag, Download, Search, X, ExternalLink, Calendar } from 'lucide-react';
import { customerService, analyticsService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';

const CustomerManager = () => {
  const { toastError } = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Customer Orders Modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerService.getAllAdmin({ search, limit: 100 });
      if (res.data?.customers) {
        setCustomers(res.data.customers);
      }
    } catch {
      toastError('Failed to load customer directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const viewCustomerDetails = async (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
    setLoadingOrders(true);
    try {
      const res = await customerService.getDetailsAdmin(customer._id);
      if (res.data?.orders) {
        setCustomerOrders(res.data.orders);
      }
    } catch {
      toastError('Failed to load customer orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-festival-card border border-festival-border p-6 rounded-3xl">
        <div>
          <h2 className="text-xl font-bold text-white">Customer Database & Order History</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Registered customer contact information, lifetime order counts, and total spend
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={analyticsService.getExportUrl('customers', 'xlsx')}
            download
            className="px-4 py-2.5 rounded-xl bg-festival-dark hover:bg-festival-cardHover border border-festival-border text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export Customers (.xlsx)</span>
          </a>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, mobile number, or city..."
          className="w-full bg-festival-card border border-festival-border rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
      </div>

      {/* Customers Table */}
      {loading ? (
        <LoadingSpinner text="Fetching customer directory..." />
      ) : customers.length === 0 ? (
        <div className="p-12 text-center bg-festival-card border border-festival-border rounded-3xl text-slate-400 text-xs">
          No customer records found.
        </div>
      ) : (
        <div className="bg-festival-card border border-festival-border rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-festival-dark/80 text-slate-400 uppercase font-bold border-b border-festival-border">
                <tr>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Location</th>
                  <th className="p-4 text-center">Total Orders</th>
                  <th className="p-4 text-right">Lifetime Spend</th>
                  <th className="p-4 text-right">Last Order Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-festival-border/50">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-white">{c.name}</td>
                    <td className="p-4 font-mono text-amber-300">📞 {c.phone}</td>
                    <td className="p-4 text-slate-300">
                      {c.city ? `${c.city} (${c.pincode})` : 'N/A'}
                    </td>
                    <td className="p-4 text-center font-bold text-white">
                      <span className="px-2.5 py-0.5 rounded-full bg-festival-dark border border-festival-border">
                        {c.totalOrders || 1}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-amber-400">
                      {formatCurrency(c.totalSpent || 0)}
                    </td>
                    <td className="p-4 text-right text-slate-400">
                      {formatDate(c.lastOrderAt)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => viewCustomerDetails(c)}
                        className="px-3 py-1.5 rounded-lg bg-festival-dark hover:bg-festival-cardHover border border-amber-500/30 text-amber-300 hover:text-white text-xs font-bold transition-colors"
                      >
                        View Orders
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Orders History Modal */}
      <AnimatePresence>
        {isModalOpen && selectedCustomer && (
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
              className="relative w-full max-w-2xl bg-festival-card border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-festival-border">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedCustomer.name}</h3>
                  <p className="text-xs text-amber-400 font-mono">📞 {selectedCustomer.phone}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer Stats summary */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-festival-dark border border-festival-border">
                  <span className="text-slate-400">Total Lifetime Orders</span>
                  <div className="text-lg font-black text-white mt-1">{selectedCustomer.totalOrders}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-festival-dark border border-festival-border">
                  <span className="text-slate-400">Total Lifetime Spend</span>
                  <div className="text-lg font-black text-amber-400 mt-1">
                    {formatCurrency(selectedCustomer.totalSpent)}
                  </div>
                </div>
              </div>

              {/* Orders List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Past Order History</h4>
                {loadingOrders ? (
                  <LoadingSpinner text="Fetching past orders..." />
                ) : customerOrders.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No orders on record.</p>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {customerOrders.map((o) => (
                      <div
                        key={o._id}
                        className="p-3.5 rounded-xl bg-festival-dark border border-festival-border flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-400">{o.orderId}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-950 text-amber-300">
                              {o.status}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px] mt-0.5">
                            {formatDate(o.createdAt, true)} • {o.items?.length} item(s)
                          </p>
                        </div>
                        <span className="text-sm font-black text-white">{formatCurrency(o.totalAmount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerManager;
