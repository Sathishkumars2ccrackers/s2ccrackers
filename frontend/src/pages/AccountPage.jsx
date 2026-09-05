import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Package,
  MapPin,
  LogOut,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck,
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Home,
  Briefcase,
  Navigation,
  Loader2,
  Flame,
  Truck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import UserAvatar from '../components/common/UserAvatar';
import AddressFormModal from '../components/account/AddressFormModal';
import OrderDetailsModal from '../components/account/OrderDetailsModal';
import {
  getUserAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getUserOrders,
} from '../services/firestoreService';
import { formatCurrency, formatDate } from '../utils/formatters';

const AccountPage = () => {
  const { user, profile, updateCustomerProfile, logout } = useAuth();
  const { toastSuccess, toastError, toastInfo } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // URL query parameter tab sync (?tab=profile|orders|addresses|overview)
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tabParam = new URLSearchParams(location.search).get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/account?tab=${tabId}`, { replace: true });
  };

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: profile?.name || user?.displayName || '',
    email: profile?.email || user?.email || '',
    phone: profile?.phone || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (profile || user) {
      setProfileForm({
        name: profile?.name || user?.displayName || '',
        email: profile?.email || user?.email || '',
        phone: profile?.phone || '',
      });
    }
  }, [profile, user]);

  // Addresses State
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Logout Confirm Modal
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Fetch Saved Addresses
  const loadAddresses = async () => {
    if (!user?.uid) return;
    setLoadingAddresses(true);
    try {
      const data = await getUserAddresses(user.uid);
      setAddresses(data);
    } catch (err) {
      console.error('Failed to load saved addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Fetch Customer Orders
  const loadOrders = async () => {
    if (!user?.uid) return;
    setLoadingOrders(true);
    try {
      const data = await getUserOrders(user.uid);
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      loadAddresses();
      loadOrders();
    }
  }, [user?.uid]);

  // Save Profile Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      toastError('Name cannot be empty.');
      return;
    }
    if (profileForm.phone.trim() && !/^[6-9]\d{9}$/.test(profileForm.phone.trim())) {
      toastError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setSavingProfile(true);
    try {
      await updateCustomerProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
      });
    } catch (err) {
      // error handled in context
    } finally {
      setSavingProfile(false);
    }
  };

  // Address Handlers
  const handleSaveAddress = async (formData) => {
    if (!user?.uid) return;
    if (editingAddress) {
      await updateAddress(editingAddress.id, formData, user.uid);
      toastSuccess('Address updated successfully!');
    } else {
      await addAddress(user.uid, formData);
      toastSuccess('New address saved successfully!');
    }
    await loadAddresses();
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to remove this delivery address?')) return;
    try {
      await deleteAddress(addressId);
      toastSuccess('Address removed.');
      await loadAddresses();
    } catch (err) {
      toastError('Failed to remove address.');
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      await setDefaultAddress(user.uid, addressId);
      toastSuccess('Default delivery address updated!');
      await loadAddresses();
    } catch (err) {
      toastError('Failed to update default address.');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const customerName = profile?.name || user?.displayName || 'Customer';
  const customerEmail = profile?.email || user?.email || '';
  const isProfileIncomplete = !profile?.phone;

  return (
    <div className="min-h-screen bg-festival-dark py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header Banner */}
        <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-festival-card via-festival-cardHover to-red-950/40 border border-amber-500/20 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              <UserAvatar user={user} profile={profile} size="xl" />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
                    Welcome back, {customerName}!
                  </h1>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
                    S2C Club Member
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customerEmail}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Link
                to="/products"
                className="flex-1 md:flex-initial px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Shop Crackers</span>
              </Link>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="px-4 py-2.5 rounded-full bg-festival-dark hover:bg-rose-950/50 border border-festival-border hover:border-rose-500/40 text-slate-300 hover:text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Incomplete Profile Alert Prompt */}
        {isProfileIncomplete && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 sm:p-5 rounded-2xl bg-amber-950/70 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 text-xs sm:text-sm text-amber-200">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 flex-shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-white">Complete Your Festival Profile</p>
                <p className="text-slate-300 text-xs mt-0.5">
                  Add your 10-digit mobile number for instant WhatsApp order dispatches and delivery updates.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleTabChange('profile')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs whitespace-nowrap shadow-md"
            >
              Add Mobile Number →
            </button>
          </motion.div>
        )}

        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 space-y-2">
            <div className="bg-festival-card border border-festival-border p-2 rounded-3xl space-y-1">
              {[
                { id: 'overview', label: 'Account Overview', icon: Sparkles },
                { id: 'profile', label: 'My Profile', icon: User },
                { id: 'orders', label: 'My Orders', icon: Package, count: orders.length },
                { id: 'addresses', label: 'Saved Addresses', icon: MapPin, count: addresses.length },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 text-slate-950 shadow-lg shadow-amber-950/50'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </div>
                    {tab.count !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isActive
                            ? 'bg-slate-950 text-amber-400'
                            : 'bg-festival-dark text-slate-400 border border-festival-border'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold text-rose-400 hover:bg-rose-950/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Tab Content Panel */}
          <div className="lg:col-span-3 space-y-6">
            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-6 rounded-3xl bg-festival-card border border-festival-border space-y-2">
                    <div className="flex items-center justify-between text-amber-400">
                      <Package className="w-6 h-6" />
                      <span className="text-2xl font-black text-white">{orders.length}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-300">Orders Placed</p>
                    <p className="text-[11px] text-slate-500">Genuine Sivakasi Direct Orders</p>
                  </div>

                  <div className="p-6 rounded-3xl bg-festival-card border border-festival-border space-y-2">
                    <div className="flex items-center justify-between text-emerald-400">
                      <MapPin className="w-6 h-6" />
                      <span className="text-2xl font-black text-white">{addresses.length}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-300">Saved Addresses</p>
                    <p className="text-[11px] text-slate-500">Fast 1-Click COD Delivery</p>
                  </div>

                  <div className="p-6 rounded-3xl bg-festival-card border border-festival-border space-y-2">
                    <div className="flex items-center justify-between text-cyan-400">
                      <Calendar className="w-6 h-6" />
                      <span className="text-xs font-bold text-white truncate max-w-[120px]">
                        {orders.length > 0 ? formatDate(orders[0].createdAt || orders[0].createdAtIso) : 'None'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-300">Last Order Date</p>
                    <p className="text-[11px] text-slate-500">Festival Season 2026</p>
                  </div>
                </div>

                {/* Recent Orders Overview */}
                <div className="bg-festival-card border border-festival-border p-6 sm:p-8 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-festival-border">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Package className="w-5 h-5 text-amber-400" />
                      <span>Recent Orders</span>
                    </h3>
                    {orders.length > 0 && (
                      <button
                        onClick={() => handleTabChange('orders')}
                        className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        <span>View All ({orders.length})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {loadingOrders ? (
                    <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Loading orders...</span>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8 space-y-3">
                      <Package className="w-12 h-12 text-slate-600 mx-auto" />
                      <p className="text-sm font-bold text-white">No orders placed yet</p>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
                        Explore our Sivakasi direct factory crackers and gift boxes at up to 80% OFF.
                      </p>
                      <Link
                        to="/products"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 text-slate-950 font-bold text-xs"
                      >
                        <span>Start Shopping</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.slice(0, 3).map((order) => (
                        <div
                          key={order.orderId || order.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-festival-dark border border-festival-border/70 gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-amber-400">{order.orderId}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                {order.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              {formatDate(order.createdAt || order.createdAtIso)} • {(order.items || []).length} items
                            </p>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <span className="text-sm font-black text-white">
                              {formatCurrency(order.totalAmount || order.amount)}
                            </span>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="px-3.5 py-1.5 rounded-xl bg-festival-cardHover border border-amber-500/30 text-amber-300 hover:text-white font-bold text-xs"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. MY PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="bg-festival-card border border-festival-border p-6 sm:p-8 rounded-3xl space-y-6">
                <div className="pb-4 border-b border-festival-border">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-amber-400" />
                    <span>My Customer Profile</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage your contact details. Changes are saved across your Firestore and MongoDB profiles.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full bg-festival-dark border border-festival-border rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Email Address (Google Account Linked)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        disabled
                        value={profileForm.email}
                        className="w-full bg-festival-dark/60 border border-festival-border/60 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-slate-400 cursor-not-allowed"
                      />
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Email is permanently linked to your Google login.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Mobile Number (10 Digits)
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        maxLength={10}
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            phone: e.target.value.replace(/[^0-9]/g, ''),
                          })
                        }
                        placeholder="e.g. 9876543210"
                        className="w-full bg-festival-dark border border-festival-border rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Used for dispatch notifications and COD delivery verification.
                    </p>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-8 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 hover:from-red-500 hover:to-orange-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/50 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {savingProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <span>Save Profile Changes</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 3. MY ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="bg-festival-card border border-festival-border p-6 sm:p-8 rounded-3xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-festival-border">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Package className="w-5 h-5 text-amber-400" />
                      <span>My Order History</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Track festival dispatch, status updates, and download invoices.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    {orders.length} Orders
                  </span>
                </div>

                {loadingOrders ? (
                  <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                    <span>Loading your orders...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-festival-dark border border-festival-border flex items-center justify-center mx-auto text-slate-600">
                      <Package className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-white">No Orders Found</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        You haven't placed any cracker orders yet. Check out our festival bundles with factory prices!
                      </p>
                    </div>
                    <Link
                      to="/products"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Browse Products</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.orderId || order.id}
                        className="p-5 rounded-2xl bg-festival-dark border border-festival-border space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-festival-border/50 gap-2">
                          <div>
                            <span className="font-mono font-black text-amber-400 text-sm">
                              {order.orderId}
                            </span>
                            <span className="text-[11px] text-slate-400 block sm:inline sm:ml-2">
                              Placed on {formatDate(order.createdAt || order.createdAtIso)}
                            </span>
                          </div>
                          <span
                            className={`inline-block w-fit px-3 py-0.5 rounded-full text-xs font-bold ${
                              order.status === 'Delivered'
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                                : order.status === 'Cancelled'
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                                : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {order.status || 'Pending'}
                          </span>
                        </div>

                        {/* Items preview */}
                        <div className="flex items-center justify-between gap-4 text-xs">
                          <div className="space-y-1 min-w-0">
                            <p className="font-bold text-slate-200">
                              {(order.items || []).map((i) => i.name).join(', ')}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {(order.items || []).length} item(s) • Payment: Cash On Delivery (COD)
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-[10px] text-slate-400 block">Total Amount</span>
                            <span className="text-base font-black text-amber-400">
                              {formatCurrency(order.totalAmount || order.amount)}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2 border-t border-festival-border/50 flex items-center justify-end gap-2.5">
                          <Link
                            to={`/track-order?orderId=${order.orderId}&phone=${order.customerDetails?.phone || ''}`}
                            className="px-4 py-2 rounded-xl bg-festival-card hover:bg-festival-cardHover border border-festival-border text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                          >
                            <Truck className="w-3.5 h-3.5 text-amber-400" />
                            <span>Track Order</span>
                          </Link>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                          >
                            <span>View Details</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. SAVED ADDRESSES TAB */}
            {activeTab === 'addresses' && (
              <div className="bg-festival-card border border-festival-border p-6 sm:p-8 rounded-3xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-festival-border gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-amber-400" />
                      <span>Saved Delivery Addresses</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Manage your saved addresses for fast 1-click checkout.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingAddress(null);
                      setIsAddressModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Address</span>
                  </button>
                </div>

                {loadingAddresses ? (
                  <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                    <span>Loading addresses...</span>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-festival-dark border border-festival-border flex items-center justify-center mx-auto text-slate-600">
                      <MapPin className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-white">No Saved Addresses</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Add your shipping address now to enable 1-click checkout on festival orders.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingAddress(null);
                        setIsAddressModalOpen(true);
                      }}
                      className="px-6 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg"
                    >
                      Add First Address
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                          addr.isDefault
                            ? 'bg-festival-dark border-amber-500/50 shadow-lg shadow-amber-950/40 ring-1 ring-amber-500/30'
                            : 'bg-festival-dark/80 border-festival-border hover:border-amber-500/30'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {addr.type === 'office' ? (
                                <Briefcase className="w-4 h-4 text-cyan-400" />
                              ) : addr.type === 'other' ? (
                                <Navigation className="w-4 h-4 text-orange-400" />
                              ) : (
                                <Home className="w-4 h-4 text-amber-400" />
                              )}
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                                {addr.type || 'Home'}
                              </span>
                            </div>

                            {addr.isDefault && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                                Default Address
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-300 leading-relaxed pt-1">
                            <p className="font-bold text-white text-sm">{addr.name}</p>
                            <p className="text-slate-400">{addr.phone}</p>
                            <p className="mt-1">{addr.addressLine1}</p>
                            {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                            <p>
                              {addr.city}, {addr.state} -{' '}
                              <span className="font-bold text-amber-300">{addr.pincode}</span>
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-3 border-t border-festival-border flex items-center justify-between text-xs">
                          <div>
                            {!addr.isDefault && (
                              <button
                                onClick={() => handleSetDefaultAddress(addr.id)}
                                className="text-[11px] text-amber-400 hover:text-amber-300 font-bold"
                              >
                                Set as Default
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingAddress(addr);
                                setIsAddressModalOpen(true);
                              }}
                              className="p-2 rounded-xl bg-festival-card hover:bg-white/10 text-slate-300 hover:text-white"
                              title="Edit Address"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="p-2 rounded-xl bg-festival-card hover:bg-rose-950/40 text-slate-400 hover:text-rose-400"
                              title="Delete Address"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Address Form Modal */}
      <AddressFormModal
        isOpen={isAddressModalOpen}
        onClose={() => {
          setIsAddressModalOpen(false);
          setEditingAddress(null);
        }}
        onSave={handleSaveAddress}
        initialData={editingAddress}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />

      {/* Logout Confirmation Dialog */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm p-6 rounded-3xl bg-festival-card border border-festival-border text-center space-y-4 z-10 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
                <LogOut className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Sign Out?</h4>
              <p className="text-xs text-slate-300">
                Are you sure you want to sign out from your S2C Crackers account?
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 rounded-xl border border-festival-border text-slate-300 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md"
                >
                  Confirm Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountPage;
