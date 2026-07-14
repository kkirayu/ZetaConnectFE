import React, { useState, useMemo } from 'react';
import { 
  Calendar, Clock, DollarSign, Wallet, QrCode, 
  Receipt, AlertTriangle, CheckCircle2, Printer, Lock, LogOut 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getShiftSummary, closeShift } from '../../../services/cashierDashboardService';

const ShiftClosing = () => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [actualCash, setActualCash] = useState('');
  const [isShiftClosed, setIsShiftClosed] = useState(false);
  const [todayTransactions, setTodayTransactions] = useState([]);
  const [startingCash, setStartingCash] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchShiftData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getShiftSummary();
      if (data) {
        setTodayTransactions(data.transactions || []);
        setStartingCash(data.starting_cash || 0);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal memuat data shift.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchShiftData();
  }, []);

  // --- PERHITUNGAN REKAPITULASI ---
  const summary = useMemo(() => {
    let totalRevenue = 0;
    let cashRevenue = 0;
    let qrisRevenue = 0;

    todayTransactions.forEach(trx => {
      totalRevenue += trx.total;
      if (trx.method === 'Tunai') cashRevenue += trx.total;
      if (trx.method === 'QRIS') qrisRevenue += trx.total;
    });

    return { totalRevenue, cashRevenue, qrisRevenue, count: todayTransactions.length };
  }, [todayTransactions]);

  const expectedCash = startingCash + summary.cashRevenue;
  const cashDifference = actualCash !== '' ? Number(actualCash) - expectedCash : null;

  // --- FORMATTER ---
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const handleCloseShift = async () => {
    if (actualCash === '') {
      alert('Silakan masukkan jumlah uang fisik di laci terlebih dahulu!');
      return;
    }
    
    const confirmMessage = cashDifference !== 0 
      ? `Terdapat selisih kas sebesar ${formatRupiah(cashDifference)}. Yakin ingin menutup shift?`
      : 'Uang kas sesuai. Yakin ingin menutup shift?';

    if (window.confirm(confirmMessage)) {
      setSubmitting(true);
      try {
        await closeShift({
          actual_cash: Number(actualCash),
          expected_cash: expectedCash,
          difference: cashDifference,
          total_revenue: summary.totalRevenue,
          cash_revenue: summary.cashRevenue,
          qris_revenue: summary.qrisRevenue
        });
        setIsShiftClosed(true);
        alert('Shift berhasil ditutup!');
      } catch (err) {
        console.error(err);
        alert(err.message || 'Gagal menutup shift. Silakan coba lagi.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleNewShift = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center gap-2 text-slate-500 min-h-[400px]">
        <span className="font-medium">Memuat Data Shift...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto my-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center shadow-sm">
          <div className="flex justify-center mb-3 text-red-500">
            <AlertTriangle size={40} />
          </div>
          <h3 className="text-lg font-bold text-red-800 mb-2">Gagal Memuat Data Shift</h3>
          <p className="text-sm text-red-600 mb-6">{error}</p>
          <button
            onClick={fetchShiftData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-sm text-sm font-semibold hover:bg-red-700 transition shadow-sm"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* ================== HEADER ================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tutup Kasir (Shift Closing)</h1>
          <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> 20 Mei 2026</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Shift Pagi (08:00 - 16:00)</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:shadow">
            <Printer className="h-4 w-4" /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* ================== KARTU RINGKASAN ================== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Pendapatan */}
        <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 transition-colors group-hover:text-blue-600">Total Pendapatan</p>
            <div className="rounded-md bg-blue-100 p-2 text-blue-600 transition-transform duration-300 group-hover:scale-110"><DollarSign className="h-5 w-5" /></div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800">{formatRupiah(summary.totalRevenue)}</h3>
          <p className="mt-1 text-sm text-slate-500">Dari {summary.count} transaksi</p>
        </div>

        {/* Pendapatan Tunai */}
        <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 transition-colors group-hover:text-emerald-600">Pendapatan Tunai</p>
            <div className="rounded-md bg-emerald-100 p-2 text-emerald-600 transition-transform duration-300 group-hover:scale-110"><Wallet className="h-5 w-5" /></div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800">{formatRupiah(summary.cashRevenue)}</h3>
          <p className="mt-1 text-sm text-slate-500">Masuk ke laci kasir</p>
        </div>

        {/* Pendapatan QRIS */}
        <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-300 hover:shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 transition-colors group-hover:text-purple-600">Pendapatan QRIS</p>
            <div className="rounded-md bg-purple-100 p-2 text-purple-600 transition-transform duration-300 group-hover:scale-110"><QrCode className="h-5 w-5" /></div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800">{formatRupiah(summary.qrisRevenue)}</h3>
          <p className="mt-1 text-sm text-slate-500">Masuk ke rekening</p>
        </div>

        {/* Modal Awal */}
        <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 transition-colors group-hover:text-amber-600">Modal Kasir (Pagi)</p>
            <div className="rounded-md bg-amber-100 p-2 text-amber-600 transition-transform duration-300 group-hover:scale-110"><Receipt className="h-5 w-5" /></div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800">{formatRupiah(startingCash)}</h3>
          <p className="mt-1 text-sm text-slate-500">Uang kembalian awal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* ================== TABEL TRANSAKSI (KOLOM KIRI) ================== */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-800">Rincian Transaksi Hari Ini</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Waktu</th>
                  <th className="px-5 py-3 font-medium">No. Invoice</th>
                  <th className="px-5 py-3 font-medium">Pelanggan</th>
                  <th className="px-5 py-3 font-medium">Metode</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayTransactions.length > 0 ? (
                  todayTransactions.map((trx) => (
                    <tr key={trx.id} className="transition-colors duration-200 hover:bg-slate-100">
                      <td className="px-5 py-3 text-slate-600">{trx.time}</td>
                      <td className="px-5 py-3 font-medium text-blue-600">{trx.invoice}</td>
                      <td className="px-5 py-3 text-slate-800">{trx.customer}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-200 ${
                          trx.method === 'QRIS' ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {trx.method}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-slate-800">{formatRupiah(trx.total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-5 py-8 text-center text-slate-500 font-medium">
                      Belum ada transaksi hari ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================== REKONSILIASI KAS (KOLOM KANAN) ================== */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-800">Rekonsiliasi Kas Laci</h2>
          
          <div className="mb-6 space-y-3 text-sm">
            <div className="flex justify-between text-slate-600 hover:text-slate-900 transition-colors">
              <span>Modal Awal</span>
              <span>{formatRupiah(startingCash)}</span>
            </div>
            <div className="flex justify-between text-slate-600 hover:text-slate-900 transition-colors">
              <span>Pendapatan Tunai (+)</span>
              <span>{formatRupiah(summary.cashRevenue)}</span>
            </div>
            <div className="flex justify-between border-t border-dashed border-slate-200 pt-3 text-base font-bold text-slate-800 hover:text-blue-600 transition-colors">
              <span>Kas Seharusnya</span>
              <span>{formatRupiah(expectedCash)}</span>
            </div>
          </div>

          <div className="mb-6 rounded-lg bg-slate-50 p-4 transition-colors hover:bg-slate-100">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Hitung Uang Fisik di Laci (Rp)
            </label>
            <input 
              type="number" 
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              disabled={isShiftClosed}
              placeholder="Masukkan total uang fisik..."
              className="w-full rounded-md border border-slate-300 bg-white px-4 py-2.5 text-lg font-bold shadow-inner outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 hover:border-blue-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:hover:border-slate-300"
            />

            {/* Indikator Selisih */}
            {actualCash !== '' && (
              <div className={`mt-3 flex items-start gap-2 rounded p-3 text-sm font-medium shadow-sm transition-all animate-in fade-in slide-in-from-top-2 ${
                cashDifference === 0 
                  ? 'bg-green-100 text-green-700' 
                  : cashDifference > 0 
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-red-100 text-red-700'
              }`}>
                {cashDifference === 0 ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                
                <div>
                  {cashDifference === 0 
                    ? 'Kas seimbang (Balance). Tidak ada selisih.' 
                    : cashDifference > 0
                      ? `Uang Lebih (Over): ${formatRupiah(cashDifference)}`
                      : `Uang Kurang (Short): ${formatRupiah(Math.abs(cashDifference))}`
                  }
                </div>
              </div>
            )}
          </div>

          {/* Tombol Tutup / Buka Shift */}
          <div className="mt-auto">
            {isShiftClosed ? (
              <div className="flex flex-col gap-3">
                <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-3 font-medium text-slate-500">
                  <Lock className="h-5 w-5" /> Laporan Terkunci
                </div>
                <button 
                  onClick={handleNewShift}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3.5 font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg active:translate-y-0"
                >
                  <LogOut className="h-5 w-5" /> Keluar & Buka Shift Baru
                </button>
              </div>
            ) : (
              <button 
                onClick={handleCloseShift}
                disabled={submitting}
                className="w-full rounded-lg bg-emerald-600 py-3.5 font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submitting ? 'Menyimpan...' : 'Simpan & Tutup Shift'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ShiftClosing;