import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Edit, Trash2, Copy, ArrowUpRight, 
  ArrowDownLeft, RefreshCw, Loader2, Calendar, 
  AlertCircle, Filter, FileText, X ,Package, Truck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStockMutations, deleteStockMutation, updateStockMutation } from '../../../services/pharmacyService';

const StockMutations = () => {
  const [mutationData, setMutationData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // State untuk Detail Mutasi
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('detail'); // 'detail' | 'edit'
  const [selectedMutation, setSelectedMutation] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = async () => {
    if (!selectedMutation) return;
    setIsSaving(true);
    try {
      // Menyesuaikan payload untuk backend, date perlu di format ulang ke format database bila perlu
      const payload = {
        ...editFormData,
        date: editFormData.date ? editFormData.date.replace('T', ' ') + ':00' : null
      };
      await updateStockMutation(selectedMutation.id, payload);
      setIsModalOpen(false);
      fetchMutations(searchTerm);
    } catch (err) {
      alert(err.message || "Gagal memperbarui mutasi");
    } finally {
      setIsSaving(false);
    }
  };

  const fetchMutations = async (search = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getStockMutations(search);
      // Asumsi API mengembalikan data list di dalam properti tertentu atau langsung berupa array
      setMutationData(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      setError(err.message || 'Gagal memuat data mutasi stok.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus riwayat mutasi ini?")) {
      try {
        await deleteStockMutation(id);
        fetchMutations(searchTerm);
      } catch (err) {
        alert(err.message || "Gagal menghapus mutasi");
      }
    }
  };

  useEffect(() => {
    fetchMutations();
  }, []);

  // Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMutations(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const cardStats = useMemo(() => {

  const totalMutation = mutationData.length;

  const totalIn = mutationData.filter(
    item => item.mutation_type === "In"
  ).length;

  const totalOut = mutationData.filter(
    item => item.mutation_type === "Out"
  ).length;

  const supplierCount = new Set(
    mutationData
      .filter(item => item.supplier_id)
      .map(item => item.supplier_id)
  ).size;

  return [
    {
      title: "Total Mutasi",
      value: totalMutation,
      icon: <Package className="h-6 w-6 text-blue-600" />,
      bgIcon: "bg-blue-100",
    },
    {
      title: "Barang Masuk",
      value: totalIn,
      icon: <ArrowUpRight className="h-6 w-6 text-emerald-600" />,
      bgIcon: "bg-emerald-100",
    },
    {
      title: "Barang Keluar",
      value: totalOut,
      icon: <ArrowDownLeft className="h-6 w-6 text-red-600" />,
      bgIcon: "bg-red-100",
    },
    {
      title: "Mutasi Hari Ini",
      value: mutationData.filter(item => {
        const today = new Date().toDateString();
        return new Date(item.date).toDateString() === today;
      }).length,
      icon: <Calendar className="h-6 w-6 text-purple-600" />,
      bgIcon: "bg-purple-100",
    }
  ];

}, [mutationData]);

  const handleExportCSV = () => {
    if (!mutationData || mutationData.length === 0) {
      alert("Tidak ada data untuk diekspor");
      return;
    }

    // Header CSV
    const headers = ["ID", "Produk", "ID Produk", "Supplier", "Tipe", "Jumlah", "Tanggal Mutasi"];
    
    // Baris data
    const rows = mutationData.map(item => {
      return [
        item.id,
        `"${item.product_name}"`,
        item.product_id,
        `"${item.supplier_name || '-'}"`,
        item.mutation_type,
        item.quantity,
        `"${formatDate(item.date)}"`
      ].join(",");
    });

    // Gabungkan header dan baris data
    const csvContent = [headers.join(","), ...rows].join("\n");
    
    // Buat Blob dan trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Mutasi_Stok_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mutasi Stok Produk</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Riwayat barang masuk (In) dan barang keluar (Out) dari gudang farmasi.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 shadow-sm"
          >
            <FileText className="h-4 w-4" />
            Export Laporan
          </button>
          <Link 
            to="/pharmacy/restock" 
            className="inline-flex items-center justify-center gap-2 rounded-sm bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Mutasi Baru
          </Link>
        </div>
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

      {/* 2. Main Table Area */}
      <div className="rounded-sm border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between bg-white">
          <div className="relative w-full max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari produk atau tipe (In/Out)..." 
              className="block w-full rounded-sm border border-slate-300 pl-10 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <Filter className="h-4 w-4" />
              Filter Tanggal
            </button>
            <button
              onClick={() => fetchMutations(searchTerm)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <span className="mt-4 text-sm font-medium text-slate-500">Memuat riwayat mutasi...</span>
          </div>
        ) : mutationData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <RefreshCw className="h-12 w-12 mb-3" />
            <p className="text-sm font-medium">Data mutasi tidak ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-left whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Produk</th>
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4 text-center">Tipe</th>
                  <th className="px-6 py-4 text-center">Jumlah</th>
                  <th className="px-6 py-4">Tanggal Mutasi</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {mutationData.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedMutation(item);
                      setModalType('detail');
                      setIsModalOpen(true);
                    }}
                  >
                    <td className="px-6 py-4 font-mono text-xs text-slate-900">{item.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{item.product_name}</div>
                      <div className="text-xs text-slate-500">ID Produk: {item.product_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      {item.supplier_id ? (
                        <div className="text-slate-600 font-medium">{item.supplier_name}</div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-bold border ${
                        item.mutation_type === 'In' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {item.mutation_type === 'In' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                        {item.mutation_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(item.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation();
                            setSelectedMutation(item); 
                            setEditFormData({
                              mutation_type: item.mutation_type,
                              quantity: item.quantity,
                              date: item.date ? item.date.replace(' ', 'T').substring(0, 16) : ''
                            });
                            setModalType('edit');
                            setIsModalOpen(true); 
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-sm" 
                          title="Ubah"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={(e) => e.stopPropagation()} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-sm" title="Salin">
                          <Copy className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm" title="Hapus"
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

      {/* Modal Detail / Ubah Mutasi */}
      {isModalOpen && selectedMutation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-md bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <h3 className="text-lg font-bold text-slate-800">
                {modalType === 'edit' ? 'Ubah Mutasi Stok' : 'Detail Mutasi Stok'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 border border-slate-100 bg-slate-50 rounded-sm">
                  <div className="text-slate-500 text-xs font-bold uppercase">Produk</div>
                  <div className="text-slate-800 font-bold">{selectedMutation.product_name}</div>
                </div>
                
                {modalType === 'edit' ? (
                  <>
                    <div className="p-3 border border-slate-100 bg-slate-50 rounded-sm">
                      <div className="text-slate-500 text-xs font-bold uppercase mb-1">Tipe Mutasi</div>
                      <select 
                        value={editFormData.mutation_type || ''} 
                        onChange={(e) => setEditFormData({...editFormData, mutation_type: e.target.value})}
                        className="block w-full rounded-sm border-slate-300 px-3 py-1.5 text-sm border focus:border-blue-500 focus:outline-none"
                      >
                        <option value="In">Barang Masuk (In)</option>
                        <option value="Out">Barang Keluar (Out)</option>
                      </select>
                    </div>
                    <div className="p-3 border border-slate-100 bg-slate-50 rounded-sm">
                      <div className="text-slate-500 text-xs font-bold uppercase mb-1">Jumlah</div>
                      <input 
                        type="number" 
                        value={editFormData.quantity || ''} 
                        onChange={(e) => setEditFormData({...editFormData, quantity: e.target.value})}
                        className="block w-full rounded-sm border-slate-300 px-3 py-1.5 text-sm border focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 border border-slate-100 bg-slate-50 rounded-sm">
                      <div className="text-slate-500 text-xs font-bold uppercase">Tipe Mutasi</div>
                      <div className={`font-bold ${selectedMutation.mutation_type === 'In' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {selectedMutation.mutation_type === 'In' ? 'Barang Masuk' : 'Barang Keluar'}
                      </div>
                    </div>
                    <div className="p-3 border border-slate-100 bg-slate-50 rounded-sm">
                      <div className="text-slate-500 text-xs font-bold uppercase">Jumlah</div>
                      <div className="text-slate-800 font-bold">{selectedMutation.quantity} Pcs</div>
                    </div>
                  </>
                )}
                
                <div className="p-3 border border-slate-100 bg-slate-50 rounded-sm">
                  <div className="text-slate-500 text-xs font-bold uppercase">ID Mutasi</div>
                  <div className="text-slate-800 font-mono">MUT-{selectedMutation.id}</div>
                </div>
              </div>
              
              <div className="p-3 border border-slate-100 bg-slate-50 rounded-sm">
                <div className="text-slate-500 text-xs font-bold uppercase mb-1">Tanggal Mutasi</div>
                {modalType === 'edit' ? (
                  <input 
                    type="datetime-local" 
                    value={editFormData.date || ''} 
                    onChange={(e) => setEditFormData({...editFormData, date: e.target.value})}
                    className="block w-full rounded-sm border-slate-300 px-3 py-1.5 text-sm border focus:border-blue-500 focus:outline-none"
                  />
                ) : (
                  <div className="text-slate-800 font-bold">{formatDate(selectedMutation.date)}</div>
                )}
              </div>

              {/* Rincian Batch Terkait */}
              {modalType === 'detail' && selectedMutation.product_batch && (
                <div className="mt-6 border-t border-slate-200 pt-4">
                  <h4 className="mb-3 text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Package className="h-4 w-4 text-slate-500" />
                    Rincian Batch Terkait
                  </h4>
                  <div className="rounded-sm border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                        <tr>
                          <th className="px-4 py-3 font-semibold border-b border-slate-200">No. Batch</th>
                          <th className="px-4 py-3 font-semibold border-b border-slate-200">Kedaluwarsa</th>
                          <th className="px-4 py-3 font-semibold border-b border-slate-200 w-full">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        <tr>
                          <td className="px-4 py-3 font-medium text-slate-800">{selectedMutation.product_batch.batch_number}</td>
                          <td className={`px-4 py-3 font-medium ${selectedMutation.product_batch.exp_date && new Date(selectedMutation.product_batch.exp_date) < new Date() ? 'text-red-600' : 'text-slate-600'}`}>
                            {formatDate(selectedMutation.product_batch.exp_date)}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs whitespace-normal break-words">
                            {selectedMutation.product_batch.notes || '-'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 border-t border-slate-200 p-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="rounded-sm bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                {modalType === 'edit' ? 'Batal' : 'Tutup'}
              </button>
              
              {modalType === 'edit' && (
                <button 
                  onClick={handleUpdate}
                  disabled={isSaving}
                  className="rounded-sm bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockMutations;