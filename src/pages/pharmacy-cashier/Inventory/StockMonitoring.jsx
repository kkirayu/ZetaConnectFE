import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, Package, X, Calendar, AlertCircle, RefreshCw, Loader2, AlertTriangle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProducts, deleteProduct } from '../../../services/pharmacyService';

const StockMonitoring = () => {
  const [productData, setProductData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // State untuk Pop-up (Modal)
  const [modalType, setModalType] = useState('detail'); // 'detail' or 'edit'
  const [editFormData, setEditFormData] = useState({
    name: '', category: '', description: '', base_price: 0, selling_price: 0, min_stock: 0, exp_date: '', image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // State untuk konfirmasi hapus
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fungsi untuk mengambil data produk dari backend
  const fetchProducts = async (search = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const responseData = await getProducts(search);
      // Paginasi: Ambil dari responseData.data (array produk), abaikan metadata halamannya
      setProductData(Array.isArray(responseData.data) ? responseData.data : []);
    } catch (err) {
      console.error('Stock Monitoring Error:', err);
      setError(err.message || 'Gagal memuat data produk.');
    } finally {
      setIsLoading(false);
    }
  };



  // Debounce pencarian agar tidak terlalu sering request
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleOpenModal = (product, type = 'detail') => {
    setSelectedProduct(product);
    setModalType(type);
    if (type === 'edit') {
      setEditFormData({
        name: product.name,
        category: product.category,
        description: product.description || '',
        base_price: product.base_price || 0,
        selling_price: product.selling_price || 0,
        min_stock: product.min_stock || 0,
        exp_date: product.exp_date ? product.exp_date.split(' ')[0] : '',
        image: null
      });
      setImagePreview(product.image_url || null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setModalType('detail');
  };

  const handleUpdate = async () => {
    if (!selectedProduct) return;
    setIsSaving(true);
    try {
      const { updateProduct } = await import('../../../services/pharmacyService');
      
      let payload = editFormData;
      if (editFormData.image) {
        payload = new FormData();
        Object.keys(editFormData).forEach(key => {
          if (editFormData[key] !== null && editFormData[key] !== undefined) {
            payload.append(key, editFormData[key]);
          }
        });
      }

      await updateProduct(selectedProduct.id, payload);
      setIsModalOpen(false);
      fetchProducts(searchTerm);
    } catch (err) {
      alert(err.message || 'Gagal memperbarui produk.');
    } finally {
      setIsSaving(false);
    }
  };

  // Fungsi hapus produk
  const handleDelete = async (id) => {
    setIsDeleting(true);
    try {
      await deleteProduct(id);
      // Hapus dari state lokal tanpa perlu fetch ulang
      setProductData(prev => prev.filter(p => p.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      alert(err.message || 'Gagal menghapus produk.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  // Format tanggal dari ISO ke format Indonesia
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const cardStats = useMemo(() => {
    const totalProducts = productData.length;
    
    const lowStock = productData.filter(
      p => p.current_stock <= p.min_stock && p.current_stock > 0
    ).length;

    const outOfStock = productData.filter(
      p => p.current_stock === 0 || p.stock_status === 'Habis'
    ).length;

    const expiredProducts = productData.filter(
      p => p.is_expired
    ).length;

    return [
      {
        title: "Total Produk",
        value: totalProducts,
        icon: <Package className="h-6 w-6 text-blue-600" />,
        bgIcon: "bg-blue-100",
      },
      {
        title: "Stok Menipis",
        value: lowStock,
        icon: <AlertTriangle className="h-6 w-6 text-orange-600" />,
        bgIcon: "bg-orange-100",
      },
      {
        title: "Stok Habis",
        value: outOfStock,
        icon: <XCircle className="h-6 w-6 text-red-600" />,
        bgIcon: "bg-red-100",
      },
      {
        title: "Kedaluwarsa",
        value: expiredProducts,
        icon: <AlertCircle className="h-6 w-6 text-purple-600" />,
        bgIcon: "bg-purple-100",
      }
    ];
  }, [productData]);

  return (
    <div className="space-y-6 relative">
      {/* 1. Header & Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Master Stock Produk</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Monitoring stok obat, vaksin, makanan, dan aksesori klinik.</p>
        </div>
        <Link 
          to="/pharmacy/restock" 
          className="inline-flex items-center justify-center gap-2 rounded-sm bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Tambah Produk
        </Link>
      </div>

      {/* Card Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cardStats.map((stat, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            {/* Top Accent */}
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600" />

            <div className="flex items-center justify-between p-6">
              {/* Left */}
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500">
                  {stat.title}
                </p>

                <h2 className="mt-3 text-5xl font-bold tracking-tight text-slate-800">
                  {stat.value}
                </h2>

                <div className="mt-4 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                  Ringkasan Data
                </div>
              </div>

              {/* Right Icon */}
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-2xl ${stat.bgIcon} transition-transform duration-300 group-hover:scale-110`}
              >
                {React.cloneElement(stat.icon, {
                  className: stat.icon.props.className.replace("h-6 w-6", "h-9 w-9"),
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Area Tabel Utama */}
      <div className="rounded-sm border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Toolbar Tabel */}
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between bg-white">
          <div className="relative w-full max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama produk atau kategori..." 
              className="block w-full rounded-sm border border-slate-300 pl-10 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
          </div>
          {/* Tombol Refresh */}
          <button
            onClick={() => fetchProducts(searchTerm)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Konten berdasarkan state */}
        {isLoading ? (
          // State Loading
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <span className="mt-4 text-sm font-medium text-slate-500">Memuat data stok produk...</span>
          </div>
        ) : error ? (
          // State Error
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center max-w-md w-full">
              <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-red-800 mb-1">Gagal Memuat Data</h3>
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <button
                onClick={() => fetchProducts(searchTerm)}
                className="inline-flex items-center gap-2 rounded-sm bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition shadow-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Coba Lagi
              </button>
            </div>
          </div>
        ) : productData.length === 0 ? (
          // State Empty
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Package className="h-12 w-12 mb-3" />
            <p className="text-sm font-medium">
              {searchTerm ? 'Tidak ada produk yang sesuai pencarian.' : 'Belum ada data produk.'}
            </p>
          </div>
        ) : (
          // Tabel Data Produk
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-left whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Nama Produk</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4 text-center">Stok</th>
                  <th className="px-6 py-4">Exp. Date</th>
                  <th className="px-6 py-4 text-center">Status Stok</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {productData.map((product) => (
                  <tr 
                    key={product.id} 
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                    onClick={() => handleOpenModal(product, 'detail')}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border bg-slate-100 border-slate-200 text-slate-400 overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{product.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">ID: PRD-{String(product.id).padStart(3, '0')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-sm bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 border border-slate-200">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div>
                        <span className={`font-medium ${product.current_stock <= product.min_stock ? 'text-red-600' : 'text-slate-700'}`}>
                          {product.current_stock}
                        </span>
                        <span className="text-slate-400 text-xs ml-1">/ min {product.min_stock}</span>
                      </div>
                    </td>
                    
                    {/* Kolom Exp Date */}
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 font-semibold ${product.is_expired ? 'text-red-600' : 'text-slate-600'}`}>
                        {formatDate(product.exp_date)}
                        {product.exp_date && <AlertCircle className="h-4 w-4 opacity-70" />}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-sm px-2.5 py-1 text-xs font-medium border ${
                        product.stock_status === 'Tersedia' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : product.stock_status === 'Habis'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {product.stock_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenModal(product, 'edit'); }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-sm transition-colors" title="Edit Produk">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(product); }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors" 
                          title="Hapus Produk"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. POP-UP (MODAL) DETAIL PRODUK */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-lg rounded-md bg-white shadow-xl ring-1 ring-slate-900/5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {modalType === 'edit' ? 'Ubah Produk' : 'Detail Produk'}
                </h3>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  {modalType === 'edit' ? 'Edit data produk' : selectedProduct.name}
                </p>
              </div>
              <button onClick={handleCloseModal} className="rounded-sm p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {modalType === 'edit' ? (
                // FORM EDIT
                <div className="space-y-4">
                  {/* Foto Upload */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Foto Produk (Maks 1MB)</label>
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 shrink-0 bg-slate-100 border border-slate-300 border-dashed rounded-md flex items-center justify-center overflow-hidden">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-8 w-8 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <input 
                          type="file" 
                          accept="image/*"
                          className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              if (file.size > 1024 * 1024) {
                                alert('Ukuran gambar tidak boleh melebihi 1MB');
                                e.target.value = '';
                                return;
                              }
                              setEditFormData({...editFormData, image: file});
                              setImagePreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                        <p className="text-[11px] text-slate-400 mt-1">Format didukung: JPG, PNG, WEBP.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Produk</label>
                    <input 
                      type="text"
                      className="w-full rounded-sm border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kategori</label>
                    <select 
                      className="w-full rounded-sm border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                      value={editFormData.category}
                      onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                    >
                      <option value="Obat">Obat</option>
                      <option value="Vaksin">Vaksin</option>
                      <option value="Makanan">Makanan</option>
                      <option value="Aksesoris">Aksesoris</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Deskripsi</label>
                    <textarea 
                      className="w-full rounded-sm border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                      rows="3"
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Harga Beli</label>
                      <input 
                        type="number" min="0"
                        className="w-full rounded-sm border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={editFormData.base_price}
                        onChange={(e) => setEditFormData({...editFormData, base_price: Number(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Harga Jual</label>
                      <input 
                        type="number" min="0"
                        className="w-full rounded-sm border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={editFormData.selling_price}
                        onChange={(e) => setEditFormData({...editFormData, selling_price: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Minimal Stok</label>
                      <input 
                        type="number" min="0"
                        className="w-full rounded-sm border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={editFormData.min_stock}
                        onChange={(e) => setEditFormData({...editFormData, min_stock: Number(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tgl Kadaluarsa</label>
                      <input 
                        type="date"
                        className="w-full rounded-sm border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={editFormData.exp_date}
                        onChange={(e) => setEditFormData({...editFormData, exp_date: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // DETAIL VIEW
                <div className="space-y-4">
                  {/* Summary Box */}
                  <div className="mb-5 flex items-center justify-between rounded-sm border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <div className="text-xs font-bold uppercase text-slate-500">Stok Saat Ini</div>
                      <div className="mt-1 text-xl font-bold text-slate-900">{selectedProduct.current_stock} Pcs</div>
                      <div className="text-xs text-slate-400 mt-0.5">Minimum: {selectedProduct.min_stock} Pcs</div>
                    </div>
                    {/* Info Alert jika ada yang expired */}
                    {selectedProduct.is_expired && (
                      <div className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        <span className="font-bold">Perhatian:</span> Produk sudah kedaluwarsa!
                      </div>
                    )}
                  </div>

                  {/* Detail Info */}
                  <h4 className="mb-3 text-sm font-bold text-slate-700">Informasi Produk</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-sm border border-slate-200 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-slate-100">
                          <Package className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">Kategori</div>
                          <div className="text-xs text-slate-500">{selectedProduct.category}</div>
                        </div>
                      </div>
                      <span className={`inline-flex rounded-sm px-2.5 py-1 text-xs font-medium border ${
                        selectedProduct.stock_status === 'Tersedia' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : selectedProduct.stock_status === 'Habis'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {selectedProduct.stock_status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-sm border border-slate-200 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-slate-100">
                          <Calendar className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">Tanggal Kedaluwarsa</div>
                          <div className="text-xs text-slate-500">{formatDate(selectedProduct.exp_date)}</div>
                        </div>
                      </div>
                      <div className={`text-xs font-medium ${selectedProduct.is_expired ? 'text-red-600' : 'text-emerald-600'}`}>
                        {selectedProduct.is_expired ? 'Sudah Expired' : 'Masih Aman'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-sm border border-slate-200 p-3">
                        <div className="text-xs font-bold uppercase text-slate-400">Harga Beli</div>
                        <div className="mt-1 text-sm font-bold text-slate-800">{formatRupiah(selectedProduct.base_price)}</div>
                      </div>
                      <div className="rounded-sm border border-slate-200 p-3">
                        <div className="text-xs font-bold uppercase text-slate-400">Harga Jual</div>
                        <div className="mt-1 text-sm font-bold text-slate-800">{formatRupiah(selectedProduct.selling_price)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Rincian Batch Stok */}
                  <div className="mt-6 border-t border-slate-200 pt-4">
                    <h4 className="mb-3 text-sm font-bold text-slate-700">Rincian Batch Stok</h4>
                    {selectedProduct.product_batches && selectedProduct.product_batches.length > 0 ? (
                      <div className="overflow-x-auto rounded-sm border border-slate-200 shadow-sm">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                            <tr>
                              <th className="px-4 py-3 font-semibold border-b border-slate-200">No. Batch</th>
                              <th className="px-4 py-3 font-semibold text-center border-b border-slate-200">Stok Sisa</th>
                              <th className="px-4 py-3 font-semibold border-b border-slate-200">Kedaluwarsa</th>
                              <th className="px-4 py-3 font-semibold border-b border-slate-200">Catatan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {selectedProduct.product_batches.map((batch) => {
                              const isBatchExpired = batch.exp_date && new Date(batch.exp_date) < new Date();
                              return (
                                <tr key={batch.id} className={`hover:bg-slate-50 transition-colors ${isBatchExpired ? 'bg-red-50/40' : ''}`}>
                                  <td className="px-4 py-3 font-medium text-slate-800">{batch.batch_number}</td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
                                      {batch.stock}
                                    </span>
                                  </td>
                                  <td className={`px-4 py-3 font-medium ${isBatchExpired ? 'text-red-600' : 'text-slate-600'}`}>
                                    {formatDate(batch.exp_date)}
                                  </td>
                                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-normal break-words max-w-xs">
                                    {batch.notes || '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rounded-sm border border-slate-200 border-dashed bg-slate-50 p-6 text-center">
                        <p className="text-sm font-medium text-slate-500">Belum ada riwayat batch untuk produk ini.</p>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* Modal Footer for Edit Mode */}
            {modalType === 'edit' && (
              <div className="border-t border-slate-200 p-5 flex justify-end gap-3 bg-slate-50 rounded-b-md">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-sm border border-slate-300 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Simpan Perubahan
                </button>
              </div>
            )}

            {/* Modal Footer for Detail Mode */}
            {modalType === 'detail' && (
              <div className="flex justify-end gap-3 rounded-b-md border-t border-slate-200 bg-slate-50 p-4">
                <button onClick={handleCloseModal} className="rounded-sm bg-white border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Tutup</button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 4. MODAL KONFIRMASI HAPUS */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-md bg-white shadow-xl ring-1 ring-slate-900/5 p-6 text-center">
            <div className="flex justify-center mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Hapus Produk?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Apakah Anda yakin ingin menghapus <span className="font-bold text-slate-700">"{deleteConfirm.name}"</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="rounded-sm border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-sm bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition shadow-sm disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockMonitoring;