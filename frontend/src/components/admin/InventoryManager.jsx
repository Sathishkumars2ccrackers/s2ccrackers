import React, { useState, useEffect } from 'react';
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Search,
  RotateCcw,
  Edit,
  Save,
  X,
  Plus,
  Minus,
} from 'lucide-react';
import { productService, inventoryService, analyticsService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';

const InventoryManager = () => {
  const { toastSuccess, toastError } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  // Inline edit state
  const [editingId, setEditingId] = useState(null);
  const [newStockVal, setNewStockVal] = useState(0);
  const [adjustReason, setAdjustReason] = useState('Manual Stock Count');

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const [prodRes, overRes] = await Promise.all([
        productService.getAllAdmin({ search, stockStatus: stockFilter !== 'all' ? stockFilter : undefined, limit: 150 }),
        inventoryService.getOverview(),
      ]);

      if (prodRes.data?.products) setProducts(prodRes.data.products);
      if (overRes.data?.stats) setOverview(overRes.data.stats);
    } catch (err) {
      toastError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [search, stockFilter]);

  const handleStartEdit = (product) => {
    setEditingId(product._id);
    setNewStockVal(product.stockQuantity);
    setAdjustReason('Physical Stock Audit');
  };

  const handleSaveAdjust = async (id) => {
    try {
      const res = await inventoryService.adjustStock(id, newStockVal, adjustReason);
      toastSuccess(res.data.message);
      setEditingId(null);
      fetchInventory();
    } catch (err) {
      toastError('Failed to adjust stock');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Overview Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-festival-card border border-festival-border p-6 rounded-3xl">
        <div>
          <h2 className="text-xl font-bold text-white">Real-Time Inventory Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor factory stock, trigger restock alerts, and log adjustments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={analyticsService.getExportUrl('inventory', 'xlsx')}
            download
            className="px-4 py-2.5 rounded-xl bg-festival-dark hover:bg-festival-cardHover border border-festival-border text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export Inventory (.xlsx)</span>
          </a>
        </div>
      </div>

      {/* Stock Overview Stat Chips */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            onClick={() => setStockFilter('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              stockFilter === 'all' ? 'bg-festival-card border-amber-500 shadow-md' : 'bg-festival-card/50 border-festival-border'
            }`}
          >
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Items</span>
            <div className="text-2xl font-black text-white mt-1">{overview.totalProducts}</div>
          </div>

          <div
            onClick={() => setStockFilter('in')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              stockFilter === 'in' ? 'bg-emerald-950/60 border-emerald-500 shadow-md' : 'bg-festival-card/50 border-festival-border'
            }`}
          >
            <span className="text-[11px] font-bold text-emerald-400 uppercase">In Stock (&gt;10)</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">{overview.inStockCount}</div>
          </div>

          <div
            onClick={() => setStockFilter('low')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              stockFilter === 'low' ? 'bg-amber-950/60 border-amber-500 shadow-md' : 'bg-festival-card/50 border-festival-border'
            }`}
          >
            <span className="text-[11px] font-bold text-amber-400 uppercase">Low Stock (1-10)</span>
            <div className="text-2xl font-black text-amber-400 mt-1">{overview.lowStockCount}</div>
          </div>

          <div
            onClick={() => setStockFilter('out')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              stockFilter === 'out' ? 'bg-rose-950/60 border-rose-500 shadow-md' : 'bg-festival-card/50 border-festival-border'
            }`}
          >
            <span className="text-[11px] font-bold text-rose-400 uppercase">Out of Stock (0)</span>
            <div className="text-2xl font-black text-rose-400 mt-1">{overview.outOfStockCount}</div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter inventory by cracker name..."
          className="w-full bg-festival-card border border-festival-border rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
      </div>

      {/* Inventory Table */}
      {loading ? (
        <LoadingSpinner text="Fetching inventory counts..." />
      ) : products.length === 0 ? (
        <div className="p-12 text-center bg-festival-card border border-festival-border rounded-3xl text-slate-400 text-xs">
          No inventory records matched your filters.
        </div>
      ) : (
        <div className="bg-festival-card border border-festival-border rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-festival-dark/80 text-slate-400 uppercase font-bold border-b border-festival-border">
                <tr>
                  <th className="p-4">Cracker Item</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-right">Price</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Current Stock</th>
                  <th className="p-4 text-right">Total Units Sold</th>
                  <th className="p-4 text-right">Inline Restock / Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-festival-border/50">
                {products.map((p) => {
                  const isEditing = editingId === p._id;
                  const isOut = p.stockQuantity <= 0;
                  const isLow = p.stockQuantity > 0 && p.stockQuantity <= 10;

                  return (
                    <tr key={p._id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images && p.images.length > 0 ? p.images[0] : 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=100'}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover border border-amber-500/20"
                          />
                          <div>
                            <p className="font-bold text-white leading-snug">{p.name}</p>
                            <span className="text-[10px] text-slate-400">{p.packSize || '1 Box'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">{p.category?.name || 'Crackers'}</td>
                      <td className="p-4 text-right font-black text-amber-400">{formatCurrency(p.price)}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`font-black text-[10px] uppercase px-2.5 py-1 rounded-full ${
                            isOut
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                              : isLow
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/40 animate-pulse'
                              : 'bg-emerald-950 text-emerald-300'
                          }`}
                        >
                          {isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'HEALTHY'}
                        </span>
                      </td>
                      <td className="p-4 text-center font-black text-sm text-white">
                        {p.stockQuantity}
                      </td>
                      <td className="p-4 text-right font-bold text-slate-300">{p.totalSold || 0}</td>
                      <td className="p-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="number"
                              min="0"
                              value={newStockVal}
                              onChange={(e) => setNewStockVal(parseInt(e.target.value, 10) || 0)}
                              className="w-20 bg-festival-dark border border-amber-500 rounded-lg p-1 text-center font-bold text-white"
                            />
                            <button
                              onClick={() => handleSaveAdjust(p._id)}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                              title="Save Stock Quantity"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 bg-festival-dark hover:bg-white/10 text-slate-400 rounded-lg"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(p)}
                            className="px-3 py-1.5 rounded-lg bg-festival-dark hover:bg-festival-cardHover border border-amber-500/30 text-amber-300 hover:text-white text-xs font-bold transition-colors"
                          >
                            Adjust Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
