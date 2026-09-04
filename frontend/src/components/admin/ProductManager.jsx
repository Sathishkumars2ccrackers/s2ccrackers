import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Upload,
  Download,
  Edit2,
  Trash2,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Layers,
  DollarSign,
  Loader2,
  Image as ImageIcon,
  Tag,
  Package,
  Wand2,
} from 'lucide-react';
import { productService, categoryService, analyticsService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';

const COMMON_BRANDS = ['NACHIYAR', 'Brothers', 'SURYA', 'Sree Balaji'];

const getDefaultCategoryDescription = (categoryName) => {
  const cat = (categoryName || '').toLowerCase();
  if (cat.includes('sparkler')) return 'Safe and colorful sparklers ideal for children and family celebrations.';
  if (cat.includes('flower') || cat.includes('pot')) return 'Beautiful fountain-style fireworks producing vibrant showers of sparks.';
  if (cat.includes('shot') || cat.includes('ariel')) return 'Premium aerial fireworks with colorful burst effects.';
  if (cat.includes('gift') || cat.includes('box')) return 'Curated collection of fireworks suitable for family celebrations and gifting.';
  if (cat.includes('sound') || cat.includes('bomb') || cat.includes('wala')) return 'Traditional high-energy Sivakasi sound celebration fireworks.';
  if (cat.includes('chakkar') || cat.includes('chakra') || cat.includes('spinner')) return 'Fast spinning ground chakkar with radiant golden and color sparks.';
  if (cat.includes('gun') || cat.includes('cap')) return 'Festive toy ring cap guns and accessories for kids.';
  return 'Authentic factory-direct Sivakasi firework item crafted for safe, joyful festival celebrations.';
};

const ProductManager = () => {
  const { toastSuccess, toastError, toastWarning } = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    productCode: '',
    name: '',
    category: '',
    brand: 'NACHIYAR',
    piecesPerPack: 1,
    description: '',
    price: '',
    originalPrice: '',
    stockQuantity: '100',
    discountPercentage: '',
    packSize: '1 Box',
    soundLevel: 'Medium',
    regionalName: '',
    isFeatured: false,
    isActive: true,
  });

  // Multiple image management
  const [existingImages, setExistingImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [selectedImageFiles, setSelectedImageFiles] = useState([]);
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [saving, setSaving] = useState(false);

  // Bulk Import Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Bulk Stock / Price Modals
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [priceAdjustment, setPriceAdjustment] = useState({ adjustmentType: 'percentage', value: 10, categoryId: 'all' });
  const [adjustingPrice, setAdjustingPrice] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productService.getAllAdmin({
        search,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        brand: brandFilter !== 'all' ? brandFilter : undefined,
        stockStatus: stockFilter !== 'all' ? stockFilter : undefined,
        limit: 150,
      });
      if (res.data?.success) {
        setProducts(res.data.products || []);
      }
    } catch (err) {
      toastError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    categoryService.getAllAdmin().then((res) => {
      if (res.data?.categories) setCategories(res.data.categories);
    });
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, brandFilter, stockFilter]);

  // Real-time duplicate check
  const handleNameChange = async (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, name: val }));

    if (val.trim().length > 2) {
      try {
        const res = await productService.checkDuplicate({
          name: val.trim(),
          excludeId: editingProduct?._id,
        });
        if (res.data?.isDuplicate) {
          setDuplicateWarning(`Warning: A product with name "${val.trim()}" already exists.`);
        } else {
          setDuplicateWarning('');
        }
      } catch {
        setDuplicateWarning('');
      }
    } else {
      setDuplicateWarning('');
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      productCode: String(products.length + 1),
      name: '',
      category: categories[0]?._id || '',
      brand: 'NACHIYAR',
      piecesPerPack: 1,
      description: getDefaultCategoryDescription(categories[0]?.name || ''),
      price: '',
      originalPrice: '',
      stockQuantity: '100',
      discountPercentage: '0',
      packSize: '1 Box',
      soundLevel: 'Medium',
      regionalName: '',
      isFeatured: false,
      isActive: true,
    });
    setExistingImages([]);
    setNewImageUrl('');
    setSelectedImageFiles([]);
    setDuplicateWarning('');
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      productCode: product.productCode || '',
      name: product.name,
      category: product.category?._id || product.category || '',
      brand: product.brand || 'NACHIYAR',
      piecesPerPack: product.piecesPerPack || product.piecesPerBox || 1,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      stockQuantity: product.stockQuantity,
      discountPercentage: product.discountPercentage || 0,
      packSize: product.packSize || '1 Box',
      soundLevel: product.soundLevel || 'Medium',
      regionalName: product.regionalName || '',
      isFeatured: product.isFeatured || false,
      isActive: product.isActive !== undefined ? product.isActive : true,
    });
    setExistingImages(product.images || []);
    setNewImageUrl('');
    setSelectedImageFiles([]);
    setDuplicateWarning('');
    setIsModalOpen(true);
  };

  const handleAddImageUrl = () => {
    if (newImageUrl && newImageUrl.trim()) {
      setExistingImages((prev) => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveExistingImage = (indexToRemove) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleAutoGenerateDescription = () => {
    const selectedCat = categories.find((c) => c._id === formData.category);
    const generated = getDefaultCategoryDescription(selectedCat?.name || '');
    setFormData((prev) => ({ ...prev, description: generated }));
    toastSuccess('Generated category description!');
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.price || formData.stockQuantity === '') {
      toastWarning('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });

      // Append existing image list
      existingImages.forEach((imgUrl) => {
        data.append('images', imgUrl);
      });

      // Append uploaded image files
      if (selectedImageFiles && selectedImageFiles.length > 0) {
        for (const file of selectedImageFiles) {
          data.append('images', file);
        }
      }

      if (editingProduct) {
        await productService.update(editingProduct._id, data);
        toastSuccess('Product updated successfully!');
      } else {
        await productService.create(data);
        toastSuccess('New cracker product created!');
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await productService.delete(id);
        toastSuccess(`Deleted product "${name}"`);
        fetchProducts();
      } catch (err) {
        toastError(err.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await productService.toggleStatus(id);
      toastSuccess(res.data.message);
      setProducts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, isActive: res.data.isActive } : p))
      );
    } catch (err) {
      toastError('Failed to toggle status');
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      const res = await productService.toggleFeatured(id);
      toastSuccess(res.data.message);
      setProducts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, isFeatured: res.data.isFeatured } : p))
      );
    } catch (err) {
      toastError('Failed to toggle featured status');
    }
  };

  const handleBulkImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) {
      toastWarning('Please select an Excel (.xlsx) or CSV file.');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const data = new FormData();
      data.append('file', importFile);
      const res = await productService.importBulk(data);
      if (res.data?.success) {
        setImportResult(res.data);
        toastSuccess(res.data.message);
        fetchProducts();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Bulk import failed');
      setImportResult(err.response?.data || null);
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvHeaders = 'Stock Code,Product Name,Category,Brand,Pieces Per Pack,MRP Price,Sell Rate,Stock Quantity,Description,Image URL,Featured\n';
    const csvRows = [
      '101,S2C Gold Special Sparkler,Sparklers,NACHIYAR,10,150,60,100,"Safe and colorful sparklers ideal for children and family celebrations.",https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800,true',
      '102,Mega 12 Shot Sky Cake,Ariel Fancy Shots,Brothers,1,450,180,50,"Premium aerial fireworks with colorful burst effects.",https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800,false',
    ].join('\n');

    const blob = new Blob([csvHeaders + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'S2C_Crackers_Product_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess('Downloaded import template (CSV)!');
  };

  const handleBulkPriceSubmit = async (e) => {
    e.preventDefault();
    setAdjustingPrice(true);
    try {
      const res = await productService.bulkUpdatePrice(priceAdjustment);
      toastSuccess(res.data.message);
      setIsPriceModalOpen(false);
      fetchProducts();
    } catch (err) {
      toastError('Failed to update prices');
    } finally {
      setAdjustingPrice(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-festival-card border border-festival-border p-6 rounded-3xl">
        <div>
          <h2 className="text-xl font-bold text-white">Fireworks Product Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Total {products.length} crackers loaded • Manage prices, brands, stock & images
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-festival-dark hover:bg-festival-cardHover border border-festival-border text-xs font-bold text-amber-300 flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Import (Excel/CSV)</span>
          </button>

          <a
            href={analyticsService.getExportUrl('products', 'xlsx')}
            download
            className="px-4 py-2.5 rounded-xl bg-festival-dark hover:bg-festival-cardHover border border-festival-border text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Catalog (.xlsx)</span>
          </a>

          <button
            onClick={() => setIsPriceModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-festival-dark hover:bg-festival-cardHover border border-amber-500/30 text-xs font-bold text-amber-400 flex items-center gap-1.5 transition-colors"
          >
            <DollarSign className="w-4 h-4" />
            <span>Bulk Price Adjust</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-orange-600 hover:from-red-500 hover:to-orange-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/40 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Cracker</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, name, brand..."
            className="w-full bg-festival-card border border-festival-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-festival-card border border-festival-border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="w-full bg-festival-card border border-festival-border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Brands</option>
            {COMMON_BRANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="w-full bg-festival-card border border-festival-border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in">In Stock (&gt;10)</option>
            <option value="low">Low Stock (1-10)</option>
            <option value="out">Out of Stock (0)</option>
          </select>
        </div>
      </div>

      {/* Product List Table */}
      {loading ? (
        <LoadingSpinner text="Loading official crackers catalog..." />
      ) : products.length === 0 ? (
        <div className="p-12 text-center bg-festival-card border border-festival-border rounded-3xl text-slate-400 text-xs">
          No products matched your search. Click "Add New Cracker" or "Bulk Import" to populate items.
        </div>
      ) : (
        <div className="bg-festival-card border border-festival-border rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-festival-dark/80 text-slate-400 uppercase font-bold border-b border-festival-border">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5">Brand</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5 text-center">Pack Qty</th>
                  <th className="p-3.5 text-right">MRP (₹)</th>
                  <th className="p-3.5 text-right">Sell Rate (₹)</th>
                  <th className="p-3.5 text-center">Stock</th>
                  <th className="p-3.5 text-center">Featured</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-festival-border/50">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-amber-400">
                      #{p.productCode || '—'}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images && p.images.length > 0 ? p.images[0] : 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=100'}
                          alt={p.name}
                          className="w-9 h-9 rounded-xl object-cover border border-amber-500/20 flex-shrink-0"
                        />
                        <div>
                          <p className="font-bold text-white leading-snug">{p.name}</p>
                          <span className="text-[10px] text-slate-400 truncate max-w-xs block">
                            {p.description}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/30 text-red-200 font-bold text-[10px]">
                        {p.brand || 'NACHIYAR'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-300">{p.category?.name || 'Crackers'}</td>
                    <td className="p-3.5 text-center text-slate-300 font-medium">
                      {p.piecesPerPack || p.piecesPerBox || 1} pcs
                    </td>
                    <td className="p-3.5 text-right text-slate-400 line-through">
                      {p.originalPrice ? formatCurrency(p.originalPrice) : '—'}
                    </td>
                    <td className="p-3.5 text-right font-black text-amber-400 text-sm">
                      {formatCurrency(p.price)}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`font-bold px-2.5 py-1 rounded-full text-[11px] ${
                          p.stockQuantity <= 0
                            ? 'bg-rose-950 text-rose-300 border border-rose-600/40'
                            : p.stockQuantity <= 10
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40 animate-pulse'
                            : 'bg-emerald-950 text-emerald-300'
                        }`}
                      >
                        {p.stockQuantity}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleToggleFeatured(p._id)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                          p.isFeatured
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                        title="Toggle Featured on Homepage"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleToggleStatus(p._id)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                          p.isActive
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}
                        title="Toggle Store Visibility"
                      >
                        {p.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-amber-400 hover:bg-amber-500/20 rounded-lg transition-colors"
                          title="Edit Product Details & Images"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p._id, p.name)}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                          title="Delete Product"
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

      {/* Add / Edit Product Modal with Full Multi-Field & Multi-Image Control */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
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
              className="relative w-full max-w-2xl bg-festival-card border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 my-8 max-h-[90vh] overflow-y-auto space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-festival-border">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingProduct ? `Edit Cracker: ${editingProduct.name}` : 'Add New Cracker to Catalog'}
                  </h3>
                  <p className="text-[11px] text-slate-400">All fields immediately update store & customer views</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                {duplicateWarning && (
                  <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{duplicateWarning}</span>
                  </div>
                )}

                {/* Code & Product Name */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block font-bold text-slate-300 uppercase mb-1">
                      Product Code <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.productCode}
                      onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                      placeholder="e.g. 1"
                      className="w-full bg-festival-dark border border-festival-border rounded-xl px-3 py-2.5 text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-bold text-slate-300 uppercase mb-1">
                      Product Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleNameChange}
                      placeholder="e.g. 4'' Lakshmi"
                      className="w-full bg-festival-dark border border-festival-border rounded-xl px-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Category & Brand */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 uppercase mb-1">
                      Category <span className="text-rose-400">*</span>
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-festival-dark border border-festival-border rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 uppercase mb-1">Brand Name</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g. NACHIYAR / Brothers / SURYA / Sree Balaji"
                      className="w-full bg-festival-dark border border-festival-border rounded-xl px-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Price, MRP, Pieces Per Pack & Stock */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 uppercase mb-1">
                      Selling Rate (₹) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="e.g. 28"
                      className="w-full bg-festival-dark border border-festival-border rounded-xl px-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 uppercase mb-1">MRP Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                      placeholder="e.g. 69"
                      className="w-full bg-festival-dark border border-festival-border rounded-xl px-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 uppercase mb-1">Pcs / Pack</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.piecesPerPack}
                      onChange={(e) => setFormData({ ...formData, piecesPerPack: e.target.value })}
                      placeholder="e.g. 5"
                      className="w-full bg-festival-dark border border-festival-border rounded-xl px-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 uppercase mb-1">
                      Stock Qty <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                      placeholder="e.g. 370"
                      className="w-full bg-festival-dark border border-festival-border rounded-xl px-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Description with Auto-generate helper */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-300 uppercase">
                      Product Description <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateDescription}
                      className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      Auto-generate from category
                    </button>
                  </div>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter professional product description..."
                    className="w-full bg-festival-dark border border-festival-border rounded-xl p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Multi-Image Management Gallery */}
                <div className="space-y-3 p-4 bg-festival-dark/90 rounded-2xl border border-festival-border">
                  <label className="block font-bold text-slate-200 uppercase text-[11px]">
                    Product Images Management (Multiple Images Supported)
                  </label>

                  {/* Existing Images Gallery */}
                  {existingImages.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {existingImages.map((imgUrl, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square border border-festival-border bg-festival-card">
                          <img src={imgUrl} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-md opacity-80 group-hover:opacity-100 transition-opacity shadow"
                            title="Delete Image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add URL input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Add Image URL (https://...)"
                      className="flex-1 bg-festival-card border border-festival-border rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-4 py-2 bg-festival-card hover:bg-festival-cardHover border border-amber-500/30 text-amber-300 font-bold text-xs rounded-xl"
                    >
                      Add Image URL
                    </button>
                  </div>

                  {/* File Upload input */}
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1 font-medium">
                      Or Upload Image Files directly:
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setSelectedImageFiles(Array.from(e.target.files))}
                      className="w-full text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-festival-card file:text-amber-400 hover:file:bg-festival-cardHover cursor-pointer"
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    <span>Featured on Home Page</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    <span>Active in Store</span>
                  </label>
                </div>

                {/* Submit button */}
                <div className="pt-4 flex justify-end gap-3 border-t border-festival-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-festival-dark hover:bg-festival-cardHover rounded-xl text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{editingProduct ? 'Save Product Changes' : 'Create Cracker'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Import Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImportModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl bg-festival-card border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-festival-border">
                <div className="flex items-center gap-2.5 text-amber-400 font-bold text-base">
                  <FileSpreadsheet className="w-5 h-5" />
                  <h3 className="text-white">Bulk Product Import (.xlsx / .csv)</h3>
                </div>
                <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-2">
                <p>Upload your Excel catalog or CSV spreadsheet to add or update products in bulk without code changes.</p>
                <div className="p-3 bg-festival-dark rounded-xl border border-festival-border font-mono text-[11px] text-amber-300 flex items-center justify-between">
                  <span>Columns: Stock Code, Product Name, Category, Brand, Pieces Per Pack, MRP Price, Sell Rate, Stock Quantity, Description</span>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-bold pt-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Pre-Formatted Excel Sample Template
                </button>
              </div>

              <form onSubmit={handleBulkImportSubmit} className="space-y-4 text-xs">
                <div className="p-6 border-2 border-dashed border-festival-border rounded-2xl bg-festival-dark text-center space-y-3">
                  <Upload className="w-8 h-8 mx-auto text-amber-400" />
                  <div>
                    <input
                      type="file"
                      id="bulk-product-file"
                      accept=".xlsx, .xls, .csv"
                      onChange={(e) => setImportFile(e.target.files[0])}
                      className="hidden"
                    />
                    <label
                      htmlFor="bulk-product-file"
                      className="cursor-pointer font-bold text-amber-400 hover:underline"
                    >
                      {importFile ? importFile.name : 'Choose an Excel (.xlsx) or CSV file'}
                    </label>
                  </div>
                </div>

                {importResult && (
                  <div
                    className={`p-4 rounded-xl border ${
                      importResult.success
                        ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                        : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    <p className="font-bold">{importResult.message}</p>
                    {importResult.invalidCount > 0 && (
                      <p className="text-[11px] mt-1 text-rose-300">
                        Skipped {importResult.invalidCount} invalid rows.
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-5 py-2.5 bg-festival-dark hover:bg-festival-cardHover rounded-xl text-slate-300 font-bold"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={importing || !importFile}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl shadow flex items-center gap-2"
                  >
                    {importing && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{importing ? 'Processing File...' : 'Upload & Import Catalog'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Price Adjust Modal */}
      <AnimatePresence>
        {isPriceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPriceModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-festival-card border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-festival-border">
                <h3 className="text-base font-bold text-white">Bulk Price Adjustment</h3>
                <button onClick={() => setIsPriceModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleBulkPriceSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Target Category</label>
                  <select
                    value={priceAdjustment.categoryId}
                    onChange={(e) => setPriceAdjustment({ ...priceAdjustment, categoryId: e.target.value })}
                    className="w-full bg-festival-dark border border-festival-border rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Adjustment Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPriceAdjustment({ ...priceAdjustment, adjustmentType: 'percentage' })}
                      className={`py-2 rounded-xl font-bold border transition-colors ${
                        priceAdjustment.adjustmentType === 'percentage'
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-festival-dark text-slate-300 border-festival-border'
                      }`}
                    >
                      Percentage (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriceAdjustment({ ...priceAdjustment, adjustmentType: 'flat' })}
                      className={`py-2 rounded-xl font-bold border transition-colors ${
                        priceAdjustment.adjustmentType === 'flat'
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-festival-dark text-slate-300 border-festival-border'
                      }`}
                    >
                      Flat Amount (₹)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Value ({priceAdjustment.adjustmentType === 'percentage' ? '+/- %' : '+/- ₹'})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={priceAdjustment.value}
                    onChange={(e) => setPriceAdjustment({ ...priceAdjustment, value: e.target.value })}
                    placeholder="e.g. 10 or -5"
                    className="w-full bg-festival-dark border border-festival-border rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Positive values increase price; negative values apply instant discount.
                  </span>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPriceModalOpen(false)}
                    className="px-5 py-2.5 bg-festival-dark hover:bg-festival-cardHover rounded-xl text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adjustingPrice}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow flex items-center gap-2"
                  >
                    {adjustingPrice && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Apply Price Adjustment</span>
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

export default ProductManager;
