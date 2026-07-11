import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, CreditCard, Clock, CheckCircle, ChevronRight, PlusCircle, Printer, Eye, Edit, RefreshCw, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getCashierDashboardStats } from '../../../services/cashierDashboardService';
import TransactionDetailModal from '../../../components/TransactionDetailModal';

const CashierDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    total_revenue_today: 0,
    revenue_percentage_change: 0,
    stats: {
      diproses: 0,
      menunggu_bayar: 0,
      selesai: 0,
    },
    hourly_revenue: [],
    queue_list: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCashierDashboardStats();
      if (response && response.data) {
        setData(response.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal memuat data dashboard kasir.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const handleOpenDetail = (queue) => {
    setSelectedQueue(queue);
    setIsModalOpen(true);
  };

  const handlePrint = (e) => {
    e.stopPropagation();
    window.print();
  };

  const handleEdit = (e, queue) => {
    e.stopPropagation();
    if (queue.type === 'appointment') {
      navigate('/cashier/queue');
    } else {
      const invoiceId = queue.raw_data?.id || queue.id;
      navigate(`/cashier/checkout?invoice_id=${invoiceId}`);
    }
  };

  // 1. Statistik Ringkasan Shift Aktif
  const shiftStats = [
    {
      title: 'Diproses',
      value: `${data.stats.diproses} Antrean`,
      icon: <Wallet className="text-emerald-600 h-5 w-5" />,
      bgIcon: 'bg-emerald-100',
    },
    {
      title: 'Menunggu Bayar',
      value: `${data.stats.menunggu_bayar} Antrean`,
      icon: <Clock className="text-orange-600 h-5 w-5" />,
      bgIcon: 'bg-orange-100',
    },
    {
      title: 'Selesai',
      value: `${data.stats.selesai} Transaksi`,
      icon: <CheckCircle className="text-blue-600 h-5 w-5" />,
      bgIcon: 'bg-blue-100',
    },
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center gap-2 text-slate-500 min-h-[400px]">
        <RefreshCw className="animate-spin text-blue-600" size={24} />
        <span className="font-medium">Memuat Dashboard Kasir...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto my-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center shadow-sm">
          <div className="flex justify-center mb-3 text-red-500">
            <AlertCircle size={40} />
          </div>
          <h3 className="text-lg font-bold text-red-800 mb-2">Gagal Memuat Dashboard</h3>
          <p className="text-sm text-red-600 mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-sm text-sm font-semibold hover:bg-red-700 transition shadow-sm"
          >
            <RefreshCw size={16} />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const fullHour = payload[0].payload.hour || label;
      return (
        <div className="bg-slate-800 text-white text-xs py-2 px-3 rounded shadow-lg border border-slate-700">
          <p className="font-semibold mb-1">{fullHour}</p>
          <p className="text-blue-300">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* TOP ROW: STATISTICS GRID */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Main Cashier Status */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pendapatan Hari Ini</p>
              <h1 className="text-3xl font-extrabold text-blue-600 mt-1">{formatCurrency(data.total_revenue_today)}</h1>
            </div>
            <div className="text-right">
              <span className={`${data.revenue_percentage_change >= 0 ? 'text-emerald-600' : 'text-red-600'} font-bold text-sm flex items-center gap-1 justify-end`}>
                {data.revenue_percentage_change >= 0 ? '▲' : '▼'} {Math.abs(data.revenue_percentage_change)}%
              </span>
              <p className="text-[10px] text-slate-400">vs kemarin</p>
            </div>
          </div>
          
          {/* Trend Chart using Recharts */}
          <div className="mt-6 h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourly_revenue} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="short_label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                  dy={10} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {data.hourly_revenue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#60a5fa" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Status Counters */}
        <div className="col-span-12 lg:col-span-4 grid grid-rows-3 gap-3">
          {shiftStats.map((stat, index) => (
            <div key={index} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-blue-500 transition-colors cursor-default">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${stat.bgIcon} flex items-center justify-center`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">{stat.title}</p>
                  <p className="text-base font-bold text-slate-800">{stat.value}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </div>
          ))}
        </div>

      </div>

      {/* MIDDLE ROW: PRIMARY ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/cashier/new-transaction" className="group h-32 bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-between p-8 text-white shadow-md transition-all active:scale-[0.98] block">
          <div className="text-left">
            <h2 className="text-xl font-bold">Transaksi Baru</h2>
            <p className="text-sm opacity-80 mt-1">Mulai tagihan klinik atau penjualan retail</p>
          </div>
          
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <PlusCircle className="h-8 w-8 text-white" />
          </div>
        </Link>

        <Link to="/cashier/log-transaction" className="group h-32 bg-white border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 rounded-xl flex items-center justify-between p-8 text-slate-800 shadow-sm transition-all active:scale-[0.98]">
          <div className="text-left">
            <h2 className="text-xl font-bold">Log Transaksi</h2>
            <p className="text-sm text-slate-400 mt-1">Akses log transaksi </p>
          </div>
          <div className="w-14 h-14 bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-600 rounded-full flex items-center justify-center transition-colors">
            <CreditCard className="h-6 w-6 text-slate-600 group-hover:text-blue-600" />
          </div>
        </Link>
      </div>

      {/* BOTTOM SECTION: ANTREAN TERBARU TABLE */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 flex justify-between items-center border-b border-slate-200 bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Antrean Kasir & Klinik</h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-time update status tagihan</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors text-slate-600">Filter</button>
            <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors text-slate-600">View All</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4 text-xs">No. Invoice/Apt</th>
                <th className="px-6 py-4 text-xs">Pemilik (Hewan)</th>
                <th className="px-6 py-4 text-xs">Layanan / Item</th>
                <th className="px-6 py-4 text-xs">Waktu</th>
                <th className="px-6 py-4 text-xs">Status</th>
                <th className="px-6 py-4 text-xs text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {data.queue_list.length > 0 ? (
                data.queue_list.map((queue, i) => {
                  let statusBg = 'bg-slate-100 text-slate-700';
                  if (queue.status === 'Diproses') statusBg = 'bg-emerald-100 text-emerald-700';
                  else if (queue.status === 'Menunggu') statusBg = 'bg-orange-100 text-orange-700';
                  else if (queue.status === 'Selesai') statusBg = 'bg-blue-100 text-blue-700';

                  return (
                    <tr 
                      key={i} 
                      onClick={() => handleOpenDetail(queue)}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 font-medium text-blue-600">{queue.id}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{queue.name}</td>
                      <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{queue.items}</td>
                      <td className="px-6 py-4 text-slate-400 font-medium">{queue.time}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${statusBg}`}>
                          {queue.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        {queue.status === 'Selesai' ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenDetail(queue); }}
                            className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors inline-flex items-center"
                            title="Lihat Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => handleEdit(e, queue)}
                            className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors inline-flex items-center"
                            title="Proses Transaksi"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          onClick={handlePrint}
                          className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors inline-flex items-center"
                          title="Cetak Struk"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 font-medium bg-slate-50/30">
                    Belum ada antrean untuk hari ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <TransactionDetailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        data={selectedQueue} 
      />

    </div>
  );
};

export default CashierDashboard;