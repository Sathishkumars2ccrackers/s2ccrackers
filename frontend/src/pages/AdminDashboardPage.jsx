import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  LogOut,
  Menu,
  X,
  ExternalLink,
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
import logoSvg from '../assets/logo.svg';

const TABS = [
  { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Product Catalog', icon: Package },
  { id: 'inventory', label: 'Stock & Inventory', icon: Boxes },
  { id: 'orders', label: 'Orders & Dispatch', icon: ShoppingBag },
  { id: 'banners', label: 'Home Banners', icon: Image },
  { id: 'customers', label: 'Customer Directory', icon: Users },
  { id: 'logs', label: 'Activity Audit Trail', icon: FileText },
  { id: 'reports', label: 'Sales Reports & Export', icon: TrendingUp },
  { id: 'business-settings', label: 'Business Settings', icon: SlidersHorizontal },
  { id: 'settings', label: 'Store Settings & Backup', icon: Settings },
];

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { admin, logout, isAuthenticated, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (activeTab === 'overview') {
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
    }
  }, [activeTab]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#0a0510] text-slate-100 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-festival-card border-b border-festival-border sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <img src={logoSvg} alt="S2C Crackers" className="h-7 w-auto" />
          <span className="text-xs font-bold text-amber-400">Admin Control</span>
        </div>
        <button
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="p-2 rounded-xl bg-festival-dark text-slate-300"
        >
          {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
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
          <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-240px)] pr-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg shadow-red-950/50'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-amber-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin User Footer & Logout */}
        <div className="pt-4 border-t border-festival-border space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 font-black text-xs flex items-center justify-center border border-amber-500/30">
              {admin?.name ? admin.name[0].toUpperCase() : 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{admin?.name || 'Administrator'}</p>
              <p className="text-[10px] text-slate-400 truncate">{admin?.email || 'admin@s2ccrackers.com'}</p>
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
          <DashboardOverviewWidget data={dashboardData} onNavigateTab={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'products' && <ProductManager />}
        {activeTab === 'inventory' && <InventoryManager />}
        {activeTab === 'orders' && <OrderManager />}
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
