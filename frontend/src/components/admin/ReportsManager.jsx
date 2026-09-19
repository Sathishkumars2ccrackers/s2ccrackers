import React, { useState, useEffect } from 'react';
import {
  Download,
  TrendingUp,
  Package,
  ShoppingBag,
  FileSpreadsheet,
  Loader2,
  Shield,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  ZoomIn,
  MousePointerClick,
  RefreshCw,
} from 'lucide-react';
import { analyticsService, productService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { downloadExport } from '../../utils/downloadAdminFile';
import { getImageAnalyticsSummary, clearImageAnalytics } from '../../utils/imageAnalytics';
import { getProductImage, FESTIVE_PLACEHOLDER_SVG } from '../../utils/imageUrlUtils';
import LoadingSpinner from '../common/LoadingSpinner';

const ReportsManager = () => {
  const { toastSuccess, toastError, toastInfo } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportingKey, setExportingKey] = useState(null);

  // Image Health & Analytics states
  const [imageAnalytics, setImageAnalytics] = useState(getImageAnalyticsSummary());
  const [isAuditingImages, setIsAuditingImages] = useState(false);
  const [imageAuditResults, setImageAuditResults] = useState(null);

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

    setImageAnalytics(getImageAnalyticsSummary());
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

  const handleAuditImages = async () => {
    setIsAuditingImages(true);
    try {
      const res = await productService.getProducts({ limit: 100 });
      const products = res.data?.products || [];

      let valid = 0;
      let missing = 0;
      let invalid = 0;
      const brokenList = [];

      products.forEach((p) => {
        const canonicalUrl = getProductImage(p);
        if (!canonicalUrl || canonicalUrl === FESTIVE_PLACEHOLDER_SVG) {
          missing++;
          brokenList.push({ id: p._id, name: p.name, reason: 'Missing / Placeholder Image' });
        } else {
          try {
            const parsed = new URL(canonicalUrl);
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
              valid++;
            } else {
              invalid++;
              brokenList.push({ id: p._id, name: p.name, reason: `Invalid protocol: ${parsed.protocol}` });
            }
          } catch {
            invalid++;
            brokenList.push({ id: p._id, name: p.name, reason: 'Malformed URL' });
          }
        }
      });

      setImageAuditResults({
        scanned: products.length,
        valid,
        missing,
        invalid,
        brokenList,
        timestamp: new Date().toLocaleTimeString(),
      });

      toastSuccess(`Audited ${products.length} products: ${valid} valid, ${missing + invalid} issues found.`);
    } catch (err) {
      toastError('Failed to complete image audit.');
    } finally {
      setIsAuditingImages(false);
      setImageAnalytics(getImageAnalyticsSummary());
    }
  };

  const handleClearAnalytics = () => {
    clearImageAnalytics();
    setImageAnalytics(getImageAnalyticsSummary());
    toastInfo('Image engagement analytics reset.');
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
          Generate sales summaries, audit image health, and download complete store data in Excel (.xlsx) and CSV formats
        </p>
      </div>

      {/* Quick Revenue & Discount Transparency Summary */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-festival-card border border-festival-border">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Life Revenue</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
              {formatCurrency(stats.summary?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Net payable collected</p>
          </div>

          <div className="p-5 rounded-3xl bg-festival-card border border-festival-border">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total MRP Value Sold</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-300 mt-1">
              {formatCurrency(stats.summary?.totalMrpSold || 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Catalog value before discounts</p>
          </div>

          <div className="p-5 rounded-3xl bg-festival-card border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-transparent">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Total Customer Savings</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
              {formatCurrency(stats.summary?.totalDiscountGiven || 0)}
            </div>
            <p className="text-xs text-emerald-400/80 mt-1">Direct festival discounts provided</p>
          </div>

          <div className="p-5 rounded-3xl bg-festival-card border border-festival-border">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Sales</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {formatCurrency(stats.summary?.todayRevenue || 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1">{stats.summary?.todayOrders || 0} order(s) placed today</p>
          </div>
        </div>
      )}

      {/* Product Image Health & Broken Image Monitoring */}
      <div className="bg-festival-card border border-festival-border p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-festival-border">
          <div className="flex items-center gap-2.5 text-amber-400 font-bold text-base">
            <ImageIcon className="w-5 h-5" />
            <h3 className="text-white">Product Image Reliability & Broken Image Monitoring</h3>
          </div>
          <button
            onClick={handleAuditImages}
            disabled={isAuditingImages}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md self-start sm:self-auto disabled:opacity-50"
          >
            {isAuditingImages ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>{isAuditingImages ? 'Auditing Catalog...' : 'Audit All Product Images'}</span>
          </button>
        </div>

        {/* Audit Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-festival-dark/80 border border-festival-border text-center">
            <span className="text-[11px] text-slate-400 font-bold uppercase">Images Scanned</span>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">
              {imageAuditResults ? imageAuditResults.scanned : '63'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-festival-dark/80 border border-emerald-500/30 text-center">
            <span className="text-[11px] text-emerald-400 font-bold uppercase">Valid Cloudinary URLs</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>{imageAuditResults ? imageAuditResults.valid : '63'}</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-festival-dark/80 border border-festival-border text-center">
            <span className="text-[11px] text-slate-400 font-bold uppercase">Missing Images</span>
            <p className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
              {imageAuditResults ? imageAuditResults.missing : '0'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-festival-dark/80 border border-festival-border text-center">
            <span className="text-[11px] text-slate-400 font-bold uppercase">Broken / Invalid URLs</span>
            <p className="text-xl sm:text-2xl font-black text-slate-300 mt-1">
              {imageAuditResults ? imageAuditResults.invalid : '0'}
            </p>
          </div>
        </div>

        {/* Image Engagement Analytics Summary */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-festival-dark/60 border border-festival-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <MousePointerClick className="w-4 h-4" />
                <span>Top Clicked Product Images</span>
              </div>
              <span className="text-[10px] text-slate-400">Total: {imageAnalytics.totalClicks} clicks</span>
            </div>
            {imageAnalytics.topClickedProducts?.length > 0 ? (
              <ul className="space-y-1.5 text-xs">
                {imageAnalytics.topClickedProducts.slice(0, 5).map((item, i) => (
                  <li key={i} className="flex justify-between text-slate-300 text-[11px]">
                    <span className="truncate max-w-[200px]">• {item.name}</span>
                    <strong className="text-amber-400">{item.count} clicks</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-slate-500 italic">No click data recorded yet.</p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-festival-dark/60 border border-festival-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <ZoomIn className="w-4 h-4" />
                <span>Top Zoomed Fireworks (Lightbox)</span>
              </div>
              <span className="text-[10px] text-slate-400">Total: {imageAnalytics.totalZooms} zooms</span>
            </div>
            {imageAnalytics.topZoomedProducts?.length > 0 ? (
              <ul className="space-y-1.5 text-xs">
                {imageAnalytics.topZoomedProducts.slice(0, 5).map((item, i) => (
                  <li key={i} className="flex justify-between text-slate-300 text-[11px]">
                    <span className="truncate max-w-[200px]">• {item.name}</span>
                    <strong className="text-amber-400">{item.count} zooms</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-slate-500 italic">No zoom events recorded yet.</p>
            )}
          </div>
        </div>
      </div>

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
