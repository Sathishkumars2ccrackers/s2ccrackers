import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  Image,
  Users,
  FileText,
  TrendingUp,
  SlidersHorizontal,
  Settings,
  BellRing,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Download,
  Bell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/api';
import DashboardOverviewWidget from '../components/admin/DashboardOverviewWidget';
import ProductManager from '../components/admin/ProductManager';
import InventoryManager from '../components/admin/InventoryManager';
import OrderManager from '../components/admin/OrderManager';
import BannerManager from '../components/admin/BannerManager';
import CustomerManager from '../components/admin/CustomerManager';
import ActivityLogManager from '../components/admin/ActivityLogManager';
import ReportsManager from '../components/admin/ReportsManager';
import BusinessSettingsManager from '../components/admin/BusinessSettingsManager';
import SettingsManager from '../components/admin/SettingsManager';
import NotificationManager from '../components/admin/NotificationManager';
import OrderAlertBanner from '../components/admin/OrderAlertBanner';
import { setupForegroundMessageListener } from '../config/firebase';
import { playOrderAlertChime } from '../utils/notificationAudio';
import SEO from '../components/common/SEO';
import logoSvg from '../assets/logo.svg';

const TABS = [
  { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders & Dispatch', icon: ShoppingBag, showBadge: true },
  { id: 'notifications', label: 'Push Notifications', icon: BellRing, isPwa: true },
  { id: 'products', label: 'Product Catalog', icon: Package },
  { id: 'inventory', label: 'Stock & Inventory', icon: Boxes },
  { id: 'banners', label: 'Home Banners', icon: Image },
  { id: 'customers', label: 'Customer Directory', icon: Users },
  { id: 'logs', label: 'Activity Audit Trail', icon: FileText },
  { id: 'reports', label: 'Sales Reports & Export', icon: TrendingUp },
  { id: 'business-settings', label: 'Business Settings', icon: SlidersHorizontal },
  { id: 'settings', label: 'Store Settings & Backup', icon: Settings },
];

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const routeParams = useParams();
  const { admin, logout, isAuthenticated, loading: authLoading } = useAuth();

  const initialTab = searchParams.get('tab') || (routeParams.orderId ? 'orders' : 'overview');
  const [activeTab, setActiveTab] = useState(initialTab);
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Real-time Push & Order Alert States
  const [currentOrderAlert, setCurrentOrderAlert] = useState(null);
  const [targetOrderId, setTargetOrderId] = useState(
    routeParams.orderId || searchParams.get('orderId') || null
  );
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // PWA Install prompt state
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Handle URL Query Params (e.g. ?tab=orders&orderId=S2C-...)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const orderIdParam = searchParams.get('orderId') || routeParams.orderId;

    if (tabParam && TABS.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
    if (orderIdParam) {
      setTargetOrderId(orderIdParam);
      setActiveTab('orders');
    }
  }, [searchParams, routeParams]);

  // Capture PWA beforeinstallprompt event (Phase 1)
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
      console.log('📱 PWA Install Prompt captured for Admin Dashboard.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const triggerPwaInstall = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choiceResult = await deferredInstallPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA install prompt');
        setDeferredInstallPrompt(null);
      }
    }
  };

  // Load Dashboard Overview Data
  const loadOverviewData = useCallback(() => {
    setLoadingDashboard(true);
    analyticsService
      .getDashboardSummary()
      .then((res) => {
        if (res.data?.success) {
          setDashboardData(res.data);
        }
      })
      .catch((err) => console.error('Failed to load dashboard stats:', err))
      .finally(() => setLoadingDashboard(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') {
      loadOverviewData();
    }
  }, [activeTab, loadOverviewData]);

  // Setup Real-time Foreground Firebase Message Listener
  useEffect(() => {
    const unsubscribe = setupForegroundMessageListener((payload) => {
      console.log('🔔 Foreground Order Notification received in Admin:', payload);

      const orderId = payload.data?.orderId || payload.orderId || '';
      const customerName = payload.data?.customerName || payload.customerName || 'Online Customer';
      const amount = payload.data?.amount || payload.amount || '';

      // 1. Play Audio Alert (Phase 14)
      playOrderAlertChime();

      // 2. Trigger Floating Banner (Phase 13)
      setCurrentOrderAlert({
        orderId,
        customerName,
        amount,
        timestamp: Date.now(),
      });

      // 3. Increment unread counter (Phase 16)
      setUnreadNotificationCount((prev) => prev + 1);

      // 4. Refresh Dashboard summary if on overview tab
      loadOverviewData();
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [loadOverviewData]);

  const handleTabChange = (tabId, orderId = null) => {
    setActiveTab(tabId);
    setIsMobileNavOpen(false);
    if (orderId) {
      setTargetOrderId(orderId);
      setSearchParams({ tab: tabId, orderId });
    } else {
      setSearchParams({ tab: tabId });
    }
    if (tabId === 'orders' || tabId === 'notifications') {
      setUnreadNotificationCount(0);
    }
  };

  const handleViewAlertOrder = (orderId) => {
    setCurrentOrderAlert(null);
    setUnreadNotificationCount(0);
    handleTabChange('orders', orderId);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const pendingCount = dashboardData?.summary?.pendingOrders || dashboardData?.pendingOrdersCount || 0;

  return (
    <div className="min-h-screen bg-[#0a0510] text-slate-100 flex flex-col lg:flex-row">
      <SEO title="Admin Dashboard | S2C Crackers" noindex={true} />
      {/* Real-Time Floating Order Alert Banner (Phase 13) */}
      <OrderAlertBanner
        alert={currentOrderAlert}
        onViewOrder={handleViewAlertOrder}
        onDismiss={() => setCurrentOrderAlert(null)}
      />

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-festival-card border-b border-festival-border sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <img src={logoSvg} alt="S2C Crackers" className="h-7 w-auto" />
          <span className="text-xs font-bold text-amber-400">Admin Control</span>
          {unreadNotificationCount > 0 && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {deferredInstallPrompt && (
            <button
              onClick={triggerPwaInstall}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="p-2 rounded-xl bg-festival-dark text-slate-300"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-festival-card border-r border-festival-border p-6 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0 ${
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Logo Brand */}
          <div className="flex items-center justify-between pb-4 border-b border-festival-border">
            <div className="flex items-center gap-3">
              <img src={logoSvg} alt="S2C Crackers" className="h-9 w-auto" />
              <div>
                <h1 className="text-sm font-black text-white">S2C CRACKERS</h1>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  Admin Control Unit
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsMobileNavOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-270px)] pr-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const hasBadge = tab.id === 'orders' && (unreadNotificationCount > 0 || pendingCount > 0);
              const isNotificationsTab = tab.id === 'notifications';

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg shadow-red-950/50'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-amber-400'}`} />
                    <span>{tab.label}</span>
                  </div>

                  {/* Order / Notification Badges (Phase 16) */}
                  {hasBadge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-red-500 text-white animate-pulse shadow-sm shadow-red-500/50">
                      {unreadNotificationCount > 0 ? `+${unreadNotificationCount}` : pendingCount}
                    </span>
                  )}

                  {isNotificationsTab && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      FCM
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin User Footer & Logout */}
        <div className="pt-4 border-t border-festival-border space-y-3">
          {/* PWA Install Button in Sidebar */}
          {deferredInstallPrompt && (
            <button
              onClick={triggerPwaInstall}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md hover:from-amber-400 hover:to-orange-500 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install Admin PWA</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 font-black text-xs flex items-center justify-center border border-amber-500/30">
              {admin?.name ? admin.name[0].toUpperCase() : 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{admin?.name || 'Administrator'}</p>
              <p className="text-[10px] text-slate-400 truncate">{admin?.email || 'Authorized Administrator'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 px-3 rounded-xl bg-festival-dark hover:bg-festival-cardHover border border-festival-border text-[11px] font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Live Store</span>
            </a>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-festival-dark hover:bg-rose-950/60 border border-festival-border hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto overflow-y-auto">
        {activeTab === 'overview' && (
          <DashboardOverviewWidget data={dashboardData} onNavigateTab={(tab) => handleTabChange(tab)} />
        )}
        {activeTab === 'orders' && (
          <OrderManager
            initialOrderId={targetOrderId}
            onClearInitialOrderId={() => setTargetOrderId(null)}
          />
        )}
        {activeTab === 'notifications' && (
          <NotificationManager
            onNavigateTab={handleTabChange}
            deferredInstallPrompt={deferredInstallPrompt}
            onTriggerInstall={triggerPwaInstall}
          />
        )}
        {activeTab === 'products' && <ProductManager />}
        {activeTab === 'inventory' && <InventoryManager />}
        {activeTab === 'banners' && <BannerManager />}
        {activeTab === 'customers' && <CustomerManager />}
        {activeTab === 'logs' && <ActivityLogManager />}
        {activeTab === 'reports' && <ReportsManager />}
        {activeTab === 'business-settings' && <BusinessSettingsManager />}
        {activeTab === 'settings' && <SettingsManager />}
      </main>
    </div>
  );
};

export default AdminDashboardPage;
