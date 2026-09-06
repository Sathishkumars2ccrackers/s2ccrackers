import React, { useState, useEffect } from 'react';
import { Download, TrendingUp, DollarSign, Package, ShoppingBag, FileSpreadsheet, Loader2, Shield } from 'lucide-react';
import { analyticsService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { downloadExport } from '../../utils/downloadAdminFile';
import LoadingSpinner from '../common/LoadingSpinner';

const ReportsManager = () => {
  const { toastSuccess, toastError } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportingKey, setExportingKey] = useState(null);

  useEffect(() => {
    analyticsService
      .getDashboardSummary()
      .then((res) => {
        if (res.data?.success) {
          setStats(res.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const exportTypes = [
    { label: 'All Orders & Customer Data', entity: 'orders', icon: ShoppingBag },
    { label: 'Full Product Catalog & Prices', entity: 'products', icon: Package },
    { label: 'Inventory & Stock Counts', entity: 'inventory', icon: FileSpreadsheet },
    { label: 'Customer Directory Database', entity: 'customers', icon: TrendingUp },
    { label: 'Administrator Audit Logs', entity: 'activity-logs', icon: Shield },
  ];

  const handleExport = async (entity, format, label) => {
    const key = `${entity}-${format}`;
    setExportingKey(key);
    try {
      await downloadExport(entity, format);
      toastSuccess(`${label} exported successfully (${format.toUpperCase()})!`);
    } catch (err) {
      toastError(err.message || `Failed to export ${label}`);
    } finally {
      setExportingKey(null);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Compiling financial & sales metrics..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-festival-card border border-festival-border p-6 rounded-3xl">
        <h2 className="text-xl font-bold text-white">Reports & Financial Analytics</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Generate sales summaries and download complete store data in Excel (.xlsx) and CSV formats
        </p>
      </div>

      {/* Quick Revenue Summary */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-6 rounded-3xl bg-festival-card border border-festival-border">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Life Revenue</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
              {formatCurrency(stats.summary?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1">From all delivered and confirmed orders</p>
          </div>

          <div className="p-6 rounded-3xl bg-festival-card border border-festival-border">
            <span className="text-xs font-bold text-slate-400 uppercase">Today's Sales (COD)</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
              {formatCurrency(stats.summary?.todayRevenue || 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1">{stats.summary?.todayOrders || 0} order(s) placed today</p>
          </div>

          <div className="p-6 rounded-3xl bg-festival-card border border-festival-border">
            <span className="text-xs font-bold text-slate-400 uppercase">Average Order Value (AOV)</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {stats.summary?.totalOrders > 0
                ? formatCurrency(Math.round(stats.summary.totalRevenue / stats.summary.totalOrders))
                : formatCurrency(0)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Per completed order</p>
          </div>
        </div>
      )}

      {/* 1-Click Excel / CSV Bulk Export Hub */}
      <div className="bg-festival-card border border-festival-border p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-festival-border text-amber-400 font-bold text-base">
          <Download className="w-5 h-5" />
          <h3 className="text-white">Direct Excel (.xlsx) & CSV Data Export Hub</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {exportTypes.map((item, idx) => {
            const Icon = item.icon;
            const isXlsxExporting = exportingKey === `${item.entity}-xlsx`;
            const isCsvExporting = exportingKey === `${item.entity}-csv`;
            const isAnyExporting = Boolean(exportingKey);

            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-festival-dark/80 border border-festival-border flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">{item.label}</h4>
                    <span className="text-[10px] text-slate-400">Complete raw table data</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExport(item.entity, 'xlsx', item.label)}
                    disabled={isAnyExporting}
                    className="px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    title={`Export ${item.label} as Excel`}
                  >
                    {isXlsxExporting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3" />
                    )}
                    <span>{isXlsxExporting ? 'Exporting...' : '.XLSX'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExport(item.entity, 'csv', item.label)}
                    disabled={isAnyExporting}
                    className="px-3 py-1.5 rounded-lg bg-festival-card border border-festival-border text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    title={`Export ${item.label} as CSV`}
                  >
                    {isCsvExporting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3" />
                    )}
                    <span>{isCsvExporting ? 'Exporting...' : '.CSV'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReportsManager;
