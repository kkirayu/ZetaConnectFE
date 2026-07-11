import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, FileText, Printer, CheckCircle2, Clock, AlertCircle, ChevronRight, Eye, Loader2, X } from 'lucide-react';
import { getPendingBilling, createInvoice } from '../../../services/paymentService';

const BillingQueue = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const res = await getPendingBilling();
      const list = res?.data?.data || res?.data || [];
      setInvoices(list);
    } catch (err) {
      console.error('Fetch invoices error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const queueStats = [
    {
      title: 'Menunggu Pembayaran',
      value: invoices.length + ' Pasien',
      desc: 'Perlu konfirmasi kasir',
      icon: <Clock className="text-orange-600 h-5 w-5" />,
      bgIcon: 'bg-orange-100',
    }
  ];

  const getClientName = (inv) => inv?.patient?.owner_name ?? '—';
  const getPetName = (inv) => inv?.patient?.name ?? '—';
  const getPetType = (inv) => inv?.patient?.species ?? '—';
  const getDoctorName = (inv) => inv?.doctor_name ?? '—';

  const handleOpenModal = (bill) => {
    setSelectedBill(bill);
    setIsModalOpen(true);
  };

  const handleCreateInvoice = async () => {
    if (!selectedBill) return;
    setIsCreatingInvoice(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const items = [...(selectedBill.services || []), ...(selectedBill.products || [])];
      
      const payload = {
        appointment_id: selectedBill.appointment_id,
        owner_id: selectedBill.patient.owner_id,
        client_name: selectedBill.patient.owner_name,
        cashier_id: user.id || 1,
        discount: 0,
        payment_method: 'Tunai',
        items: items
      };
      
      const res = await createInvoice(payload);
      const invoiceId = res?.data?.id || res?.id;
      if (invoiceId) {
        setIsModalOpen(false);
        navigate(`/cashier/checkout?invoice_id=${invoiceId}`);
      } else {
        alert('Gagal mendapatkan ID invoice.');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Gagal memproses pembayaran. Cek log console.');
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">

      {/* HEADER PAGE */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Antrean Tagihan & Resep</h1>
          <p className="text-sm text-slate-400">Daftar pemeriksaan medis selesai yang siap diproses pembayarannya.</p>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {queueStats.map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-12 h-12 rounded-xl ${stat.bgIcon} flex items-center justify-center flex-shrink-0`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.title}</p>
              <h3 className="text-xl font-bold text-slate-800 mt-0.5">{stat.value}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{stat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-3 shadow-sm justify-between items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm"
            placeholder="Cari nama hewan atau pemilik..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE SECTION */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 tracking-wider">
                <th className="px-6 py-4 text-xs uppercase">No. Antrean</th>
                <th className="px-6 py-4 text-xs uppercase">Pasien & Pemilik</th>
                <th className="px-6 py-4 text-xs uppercase">Dokter Pemeriksa</th>
                <th className="px-6 py-4 text-xs uppercase">Rincian Layanan</th>
                <th className="px-6 py-4 text-xs uppercase">Total Estimasi</th>
                <th className="px-6 py-4 text-xs uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" />
                    <p className="mt-2 text-sm text-slate-500">Memuat data antrean...</p>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-sm text-slate-400">
                    Tidak ada tagihan tertunda ditemukan.
                  </td>
                </tr>
              ) : (
                invoices
                  .filter(item => {
                    const search = searchTerm.toLowerCase();
                    return getPetName(item).toLowerCase().includes(search) || 
                           getClientName(item).toLowerCase().includes(search);
                  })
                  .map((queue, i) => {
                    const services = queue.services || [];
                    const products = queue.products || [];
                    
                    return (
                      <tr key={queue.appointment_id || i} className="hover:bg-slate-50/50 transition-colors align-top">
                        <td className="px-6 py-4">
                          <span className="font-bold text-blue-600 block">{queue.queue_number || `#${queue.appointment_id}`}</span>
                          <span className="text-xs text-slate-400 font-medium block mt-0.5">
                            Tanggal: {new Date(queue.created_at).toLocaleDateString('id-ID')}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{getPetName(queue)} <span className="text-xs font-normal text-slate-500">({getPetType(queue)})</span></div>
                          <div className="text-xs text-slate-400 mt-0.5">Pmlk: {getClientName(queue)}</div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-slate-600 font-medium">{getDoctorName(queue)}</span>
                        </td>

                        <td className="px-6 py-4 max-w-xs">
                          <div className="space-y-1.5">
                            {services.length > 0 && (
                              <div>
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Tindakan/Layanan</span>
                                {services.map((t, idx) => (
                                  <div key={idx} className="text-xs text-slate-600 flex justify-between mt-0.5">
                                    <span>• {t.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {products.length > 0 && (
                              <div className="mt-1">
                                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Tebus Obat / Resep</span>
                                {products.map((p, idx) => (
                                  <div key={idx} className="text-xs text-slate-600 flex justify-between mt-0.5">
                                    <span>• {p.name} ({p.quantity}x)</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-800">Rp {(queue.total_estimation || 0).toLocaleString('id-ID')}</span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenModal(queue)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center justify-end gap-1.5 ml-auto"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>Proses</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL POPUP RINCIAN TAGIHAN */}
      {isModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Rincian Tagihan</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  Pasien: <span className="font-semibold text-slate-700">{selectedBill.patient?.name}</span>
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Seksi Layanan Medis */}
              {selectedBill.services && selectedBill.services.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    Jasa Medis / Tindakan
                  </h4>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-3">
                    {selectedBill.services.map((svc, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <div>
                          <p className="font-medium text-slate-700">{svc.name}</p>
                          <p className="text-xs text-slate-500">{svc.quantity}x @ Rp {svc.price.toLocaleString('id-ID')}</p>
                        </div>
                        <p className="font-semibold text-slate-800">Rp {svc.subtotal.toLocaleString('id-ID')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Seksi Resep Obat */}
              {selectedBill.products && selectedBill.products.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                    Resep Obat (E-Receipt)
                  </h4>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-3">
                    {selectedBill.products.map((prod, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <div>
                          <p className="font-medium text-slate-700">{prod.name}</p>
                          <p className="text-xs text-slate-500">{prod.quantity}x @ Rp {prod.price.toLocaleString('id-ID')}</p>
                        </div>
                        <p className="font-semibold text-slate-800">Rp {prod.subtotal.toLocaleString('id-ID')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!selectedBill.services?.length && !selectedBill.products?.length) && (
                <div className="text-center py-6 text-slate-500">
                  Tidak ada rincian tagihan ditemukan.
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="border-t border-slate-100 bg-white p-6 space-y-4">
              <div className="flex justify-between items-center px-2">
                <span className="text-slate-500 font-medium">Total Tagihan</span>
                <span className="text-2xl font-bold text-blue-600">
                  Rp {(selectedBill.total_estimation || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleCreateInvoice}
                  disabled={isCreatingInvoice}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
                >
                  {isCreatingInvoice ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Buat Invoice & Lanjut Bayar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BillingQueue;