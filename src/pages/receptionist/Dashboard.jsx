// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  Activity, 
  Search, 
  Filter, 
  Plus,
  Loader2
} from 'lucide-react';

const ReceptionistDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [approvedBooking, setApprovedBooking] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(null);
  const [detailModal, setDetailModal] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const [pendingRes, dayRes] = await Promise.all([
          api.get('/appointments?status=Menunggu'),
          api.get(`/appointments?date=${selectedDate}`)
        ]);
        
        const pending = pendingRes.data.data.data || [];
        const dayList = dayRes.data.data.data || [];
        
        const mergedMap = new Map();
        pending.forEach(a => mergedMap.set(a.id, a));
        dayList.forEach(a => mergedMap.set(a.id, a));
        
        setAppointments(Array.from(mergedMap.values()));
      } catch (err) {
        console.error("Error fetching appointments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [selectedDate]);

  const handleAcceptBooking = async (req) => {
    try {
      setLoadingAction({ id: req.rawId, action: 'accept' });
      await api.put(`/appointments/${req.rawId}`, { status: 'Disetujui' });
      setAppointments(appointments.map(a => a.id === req.rawId ? { ...a, status: 'Disetujui' } : a));
      setApprovedBooking(req);
      setTimeout(() => {
        setApprovedBooking(null);
      }, 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRejectBooking = async (id) => {
    try {
      setLoadingAction({ id, action: 'reject' });
      await api.put(`/appointments/${id}`, { status: 'Batal' });
      setAppointments(appointments.map(a => a.id === id ? { ...a, status: 'Batal' } : a));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCallPatient = async (id) => {
    try {
      setLoadingAction({ id, action: 'call' });
      await api.put(`/appointments/${id}`, { status: 'Dalam Periksa' });
      setAppointments(appointments.map(a => a.id === id ? { ...a, status: 'Dalam Periksa' } : a));
    } catch (err) {
      console.error("Error calling patient:", err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCallSession = async (sessionTime) => {
    try {
      setLoading(true);
      const patientsToCall = queueData.filter(item => item.time === sessionTime && item.status === 'Disetujui');
      
      await Promise.all(patientsToCall.map(item => 
        api.put(`/appointments/${item.rawId}`, { status: 'Dalam Periksa' })
      ));

      setAppointments(appointments.map(a => {
        if (patientsToCall.find(p => p.rawId === a.id)) {
          return { ...a, status: 'Dalam Periksa' };
        }
        return a;
      }));
    } catch (err) {
      console.error("Error calling session:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishPatient = async (id) => {
    try {
      setLoadingAction({ id, action: 'finish' });
      await api.put(`/appointments/${id}`, { status: 'Selesai' });
      setAppointments(appointments.map(a => a.id === id ? { ...a, status: 'Selesai' } : a));
    } catch (err) {
      console.error("Error finishing patient:", err);
    } finally {
      setLoadingAction(null);
    }
  };

  const bookingRequests = appointments
    .filter(a => a.status === 'Menunggu' && a.booking_type === 'Online')
    .map(a => ({
      rawId: a.id,
      id: a.queue_number,
      petName: a.pet?.name || '-',
      species: a.pet?.species || '-',
      ownerName: a.owner?.name || '-',
      service: a.service?.name || '-',
      date: a.schedule_date,
      time: a.schedule_time?.slice(0,5) || '-',
      status: 'Menunggu Konfirmasi'
    }));

  const queueData = appointments
    .filter(a => a.schedule_date === selectedDate && !(a.status === 'Menunggu' && a.booking_type === 'Online') && a.status !== 'Batal')
    .map(a => ({
      rawId: a.id,
      id: a.queue_number,
      petName: a.pet?.name || '-',
      species: a.pet?.species || '-',
      ownerName: a.owner?.name || '-',
      doctor: a.doctor?.name || '-',
      status: (a.status === 'Dalam Periksa') ? 'Sedang Diperiksa' : a.status,
      time: a.schedule_time?.slice(0,5) || '-',
      date: a.schedule_date || '-',
      type: a.service?.name || '-',
      complaint: a.complaint || '-'
    }));

  const stats = [
    {
      title: 'Total Antrian',
      value: queueData.length + bookingRequests.filter(r => r.date === selectedDate).length,
      icon: <Users className="text-blue-600 h-6 w-6" />,
      bgIcon: 'bg-blue-100',
    },
    {
      title: 'Sedang Menunggu',
      value: queueData.filter(q => q.status === 'Menunggu').length,
      icon: <Clock className="text-orange-600 h-6 w-6" />,
      bgIcon: 'bg-orange-100',
    },
    {
      title: 'Sedang Diperiksa',
      value: queueData.filter(q => q.status === 'Sedang Diperiksa').length,
      icon: <Activity className="text-purple-600 h-6 w-6" />,
      bgIcon: 'bg-purple-100',
    },
    {
      title: 'Selesai',
      value: queueData.filter(q => q.status === 'Selesai').length,
      icon: <CheckCircle className="text-emerald-600 h-6 w-6" />,
      bgIcon: 'bg-emerald-100',
    },
  ];

  const filteredQueue = queueData.filter(item => {
    const matchesSearch = 
      item.petName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeSessions = [...new Set(queueData.filter(q => q.status === 'Disetujui').map(q => q.time))].sort();

  const getStatusColor = (status) => {
    switch (status) {
      case 'Sedang Diperiksa':
        return 'bg-purple-100 text-purple-700';
      case 'Selesai':
        return 'bg-emerald-100 text-emerald-700';
      case 'Menunggu':
        return 'bg-orange-100 text-orange-700';
      case 'Disetujui':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Resepsionis</h1>
          <div className="text-sm font-medium text-slate-500">Kelola antrian dan pendaftaran pasien klinik</div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link 
            to="/receptionist/walk-in-registration" 
            className="flex items-center justify-center gap-2 rounded-sm bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Tambah Pasien
          </Link>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={index} className="flex flex-col rounded-sm border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-slate-500">{stat.title}</span>
                <h4 className="mt-2 text-2xl font-bold text-black sm:text-xl md:text-2xl">{stat.value}</h4>
              </div>
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${stat.bgIcon}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Requests Section */}
      {bookingRequests.length > 0 && (
        <div className="rounded-sm border border-orange-200 bg-white shadow-sm overflow-hidden mb-6">
          <div className="border-b border-orange-100 bg-orange-50 p-4">
            <h3 className="text-sm font-bold text-orange-800 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
              Permintaan Janji Temu Online Baru ({bookingRequests.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 font-semibold">ID Request</th>
                  <th className="px-6 py-3 font-semibold">Pasien & Pemilik</th>
                  <th className="px-6 py-3 font-semibold">Layanan</th>
                  <th className="px-6 py-3 font-semibold">Jadwal Pengajuan</th>
                  <th className="px-6 py-3 font-semibold text-right">Aksi Konfirmasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookingRequests.map((req, idx) => (
                  <tr key={`${req.rawId}-${idx}`} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{req.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{req.petName} <span className="text-xs font-normal text-slate-500">({req.species})</span></div>
                      <div className="text-xs text-slate-500 mt-0.5">Pemilik: {req.ownerName}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{req.service}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{req.date}</div>
                      <div className="text-xs text-slate-500">{req.time}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleAcceptBooking(req)}
                          disabled={loadingAction?.id === req.rawId}
                          className="flex h-7 min-w-[72px] items-center justify-center gap-1.5 rounded bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {loadingAction?.id === req.rawId && loadingAction?.action === 'accept' ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            'Setujui'
                          )}
                        </button>
                        <button 
                          onClick={() => handleRejectBooking(req.rawId)}
                          disabled={loadingAction?.id === req.rawId}
                          className="flex h-7 min-w-[72px] items-center justify-center gap-1.5 rounded border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {loadingAction?.id === req.rawId && loadingAction?.action === 'reject' ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            'Tolak'
                          )}
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

      {/* Pasien List & Filters */}
      <div className="rounded-sm border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-bold text-black">
              Daftar Antrian {selectedDate === new Date().toISOString().split('T')[0] ? 'Hari Ini' : selectedDate}
            </h3>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {activeSessions.length > 0 && (
                <div className="flex items-center gap-2 mr-4 border-r pr-4 border-slate-200">
                  <select 
                    id="sessionToCall" 
                    className="rounded-sm border border-slate-300 py-1.5 px-3 text-sm outline-none focus:border-teal-500"
                  >
                    {activeSessions.map(session => (
                       <option key={session} value={session}>Sesi {session}</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => {
                      const sel = document.getElementById('sessionToCall').value;
                      if(sel) handleCallSession(sel);
                    }}
                    className="rounded-sm bg-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition-colors"
                  >
                    Panggil Semua
                  </button>
                </div>
              )}
              <input 
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="rounded-sm border border-slate-300 py-2 px-3 text-sm outline-none focus:border-blue-500"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari pasien / pemilik..." 
                  className="w-full rounded-sm border border-slate-300 py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 sm:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative flex items-center">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select 
                  className="w-full appearance-none rounded-sm border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm outline-none focus:border-blue-500 sm:w-auto"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Menunggu">Menunggu</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Sedang Diperiksa">Sedang Diperiksa</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-semibold">No. Antrian</th>
                <th className="px-6 py-4 font-semibold">Nama Pasien (Pet)</th>
                <th className="px-6 py-4 font-semibold">Pemilik</th>
                <th className="px-6 py-4 font-semibold">Dokter</th>
                <th className="px-6 py-4 font-semibold">Jam</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredQueue.length > 0 ? (
                filteredQueue.map((item, index) => (
                  <tr key={index} className="transition-all hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-black">{item.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{item.petName}</div>
                      <div className="text-xs text-slate-500">{item.species}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{item.ownerName}</td>
                    <td className="px-6 py-4 text-slate-600">{item.doctor}</td>
                    <td className="px-6 py-4 text-slate-600">{item.time}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      {item.status === 'Disetujui' && (
                        <button 
                          onClick={() => handleCallPatient(item.rawId)}
                          disabled={loadingAction?.id === item.rawId}
                          className="flex h-7 min-w-[70px] items-center justify-center gap-1.5 rounded bg-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {loadingAction?.id === item.rawId && loadingAction?.action === 'call' ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            'Panggil'
                          )}
                        </button>
                      )}
                      {item.status === 'Sedang Diperiksa' && (
                        <button 
                          onClick={() => handleFinishPatient(item.rawId)}
                          disabled={loadingAction?.id === item.rawId}
                          className="flex h-7 min-w-[70px] items-center justify-center gap-1.5 rounded bg-slate-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {loadingAction?.id === item.rawId && loadingAction?.action === 'finish' ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            'Selesai'
                          )}
                        </button>
                      )}
                      <button 
                        onClick={() => setDetailModal(item)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm py-1.5"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                    Tidak ada data antrian yang sesuai dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {approvedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setApprovedBooking(null)}></div>
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Jadwal Disetujui!</h3>
            <p className="text-sm text-slate-500 mb-6">
              Permintaan janji temu untuk pasien <strong className="text-slate-700">{approvedBooking.petName}</strong> telah berhasil dikonfirmasi dan dimasukkan ke daftar antrean klinik hari ini.
            </p>
            <button
              onClick={() => setApprovedBooking(null)}
              className="w-full rounded-lg bg-slate-800 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-900"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDetailModal(null)}></div>
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-3">Detail Antrean</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Antrean</span>
                <span className="font-semibold text-slate-800">{detailModal.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Pasien</span>
                <span className="font-semibold text-slate-800">{detailModal.petName} ({detailModal.species})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pemilik</span>
                <span className="font-semibold text-slate-800">{detailModal.ownerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dokter</span>
                <span className="font-semibold text-slate-800">{detailModal.doctor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Layanan</span>
                <span className="font-semibold text-slate-800">{detailModal.type || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jadwal</span>
                <span className="font-semibold text-slate-800">{detailModal.date} - {detailModal.time} WIB</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-slate-500">Keluhan Awal</span>
                <span className="font-medium text-slate-800 text-right w-1/2">{detailModal.complaint || '-'}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-slate-500">Status Saat Ini</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(detailModal.status)}`}>
                  {detailModal.status}
                </span>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={() => setDetailModal(null)}
                className="w-full rounded-lg bg-slate-100 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistDashboard;
