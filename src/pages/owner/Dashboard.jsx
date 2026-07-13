import React, { useState, useEffect } from 'react';
import {
  Dog,
  Calendar,
  Activity,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
const OWNER_ID = storedUser.id || 1;

const OwnerDashboard = () => {
  const [pets, setPets] = useState([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [petsError, setPetsError] = useState(false);



  // States for Summary Data
  const [summaryData, setSummaryData] = useState({
    total_pets: 0,
    active_appointments: 0,
    total_medical_records: 0,
    pending_billing_amount: 0
  });
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(false);

  // Fetch summary stats
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setSummaryLoading(true);
        setSummaryError(false);
        const res = await api.get('/owner/dashboard/summary');
        if (res.data?.success) {
          setSummaryData(res.data.data);
        }
      } catch (err) {
        console.error('Fetch summary error:', err);
        setSummaryError(true);
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchSummary();
  }, []);

  // Fetch hewan peliharaan (for names)
  useEffect(() => {
    const fetchPets = async () => {
      try {
        setPetsLoading(true);
        setPetsError(false);
        const res = await api.get('/pets', { params: { owner_id: OWNER_ID } });
        const petList = res.data?.data?.data ?? res.data?.data ?? [];
        setPets(petList);
      } catch (err) {
        console.error('Fetch pets error:', err);
        setPetsError(true);
      } finally {
        setPetsLoading(false);
      }
    };

    fetchPets();
  }, []);

  // Fetch janji temu terdekat
  const [allAppointments, setAllAppointments] = useState([]);
  const [allApptLoading, setAllApptLoading] = useState(true);

  useEffect(() => {
    const fetchAllAppointments = async () => {
      try {
        setAllApptLoading(true);
        const res = await api.get('/appointments', {
          params: { owner_id: OWNER_ID }
        });
        const list = res.data?.data?.data ?? res.data?.data ?? [];

        // Urutkan ascending: appointment_date dulu, lalu appointment_time
        const sorted = [...list].sort((a, b) => {
          const dtA = new Date(`${a.schedule_date || a.appointment_date}T${a.schedule_time || a.appointment_time || '00:00'}`);
          const dtB = new Date(`${b.schedule_date || b.appointment_date}T${b.schedule_time || b.appointment_time || '00:00'}`);
          return dtA - dtB;
        });

        setAllAppointments(sorted);
      } catch (err) {
        console.error('Fetch all appointments error:', err);
      } finally {
        setAllApptLoading(false);
      }
    };

    fetchAllAppointments();
  }, []);

  // Filter untuk janji temu aktif
  const confirmedAppointments = allAppointments.filter(a => ['Menunggu', 'Disetujui', 'Diperiksa'].includes(a.status));

  // Subtitle janji temu: tanggal appointment disetujui terdekat
  const apptSubtitle = () => {
    if (allApptLoading) return '...';
    if (confirmedAppointments.length === 0) return 'Tidak ada jadwal aktif';
    const nearest = confirmedAppointments[0]; // sudah diurutkan ascending
    const date = nearest?.appointment_date
      ? new Date(nearest.appointment_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : '—';
    return `Terdekat: ${date}`;
  };

  // Nama-nama hewan (maks 3 ditampilkan, sisanya "+N lagi")
  const petNames = () => {
    if (petsError) return 'Gagal memuat data';
    if (petsLoading) return '...';
    if (pets.length === 0) return 'Belum ada hewan';
    const names = pets.map(p => p.name);
    if (names.length <= 3) return names.join(', ');
    return `${names.slice(0, 3).join(', ')} +${names.length - 3} lagi`;
  };

  const stats = [
    {
      title: 'Hewan Peliharaanku',
      value: summaryLoading
        ? <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        : summaryError
          ? <span className="text-base text-red-500">Error</span>
          : `${summaryData.total_pets} Ekor`,
      subtitle: petNames(),
      icon: <Dog className="text-blue-600 h-6 w-6" />,
      bgIcon: 'bg-blue-100',
    },
    {
      title: 'Janji Temu Aktif',
      value: summaryLoading
        ? <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        : `${summaryData.active_appointments} Jadwal`,
      subtitle: apptSubtitle(),
      icon: <Calendar className="text-emerald-600 h-6 w-6" />,
      bgIcon: 'bg-emerald-100',
    },
    {
      title: 'Riwayat Rekam Medis',
      value: summaryLoading
        ? <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
        : `${summaryData.total_medical_records} Catatan`,
      subtitle: summaryData.total_medical_records > 0 
        ? `Riwayat kesehatan hewan Anda`
        : 'Tidak ada riwayat',
      icon: <FileText className="text-orange-600 h-6 w-6" />,
      bgIcon: 'bg-orange-100',
    },
    {
      title: 'Tagihan Tertunda',
      value: summaryLoading
        ? <Loader2 className="h-6 w-6 animate-spin text-rose-600" />
        : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
            summaryData.pending_billing_amount
          ),
      subtitle: summaryData.pending_billing_amount > 0 ? 'Harap selesaikan pembayaran' : 'Tidak ada tagihan tertunda',
      icon: <DollarSign className="text-rose-600 h-6 w-6" />,
      bgIcon: 'bg-rose-100',
    },
  ];

  // Ambil maks 3 jadwal terdekat untuk ditampilkan di dashboard
  const upcomingAppointments = allAppointments.slice(0, 3);

  // Helper format tanggal
  const formatScheduleDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  // Helper warna badge status
  const getStatusColor = (status) => {
    const map = {
      'Disetujui': 'text-emerald-600 bg-emerald-50 border-emerald-200',
      'Menunggu': 'text-amber-600 bg-amber-50 border-amber-200',
      'Dalam Periksa': 'text-purple-600 bg-purple-50 border-purple-200',
      'Selesai': 'text-blue-600 bg-blue-50 border-blue-200',
      'Batal': 'text-red-500 bg-red-50 border-red-200',
    };
    return map[status] ?? 'text-slate-600 bg-slate-50 border-slate-200';
  };

  const healthReminders = [
    {
      petName: 'Luna',
      title: 'Vaksinasi Rabies Tahunan',
      dueDate: '15 Juni 2026',
      type: 'Vaksinasi',
      status: 'Penting',
      statusColor: 'bg-rose-100 text-rose-800'
    },
    {
      petName: 'Bruno',
      title: 'Pemberian Obat Cacing Bulanan',
      dueDate: '10 Mei 2026',
      type: 'Pencegahan',
      status: 'Mendekati',
      statusColor: 'bg-amber-100 text-amber-800'
    },
    {
      petName: 'Milo',
      title: 'Check-up Telinga Pascainfeksi',
      dueDate: '24 Mei 2026',
      type: 'Kontrol',
      status: 'Rutin',
      statusColor: 'bg-blue-100 text-blue-800'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Dashboard */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Halo, Selamat Datang!</h1>
          <p className="text-sm text-slate-500">Berikut adalah ringkasan kesehatan peliharaan Anda.</p>
        </div>
        <div className="text-sm font-medium text-slate-500">
          Hari ini: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* 2. Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={index} className="flex flex-col justify-between rounded-sm border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-500">{stat.title}</span>
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.bgIcon}`}>
                {stat.icon}
              </div>
            </div>
            <div>
              <h4 className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</h4>
              <p className="text-xs text-slate-400 font-medium">{stat.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Main Content Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

        {/* Jadwal Janji Temu Terdekat */}
        <div className="col-span-1 rounded-sm border border-slate-200 bg-white p-6 shadow-sm lg:col-span-8 flex flex-col justify-between">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Jadwal Janji Temu Terdekat</h3>
              <Link to="/owner/booking/history" className="text-sm font-semibold text-blue-600 hover:underline">
                Lihat Semua Riwayat
              </Link>
            </div>

            <div className="space-y-4">
              {allApptLoading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Memuat jadwal...</span>
                </div>
              ) : upcomingAppointments.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400">
                  Tidak ada jadwal janji temu.
                </div>
              ) : (
                upcomingAppointments.map((appt, i) => {
                  const petName = appt.pet?.name ?? `Pet #${appt.pet_id}`;
                  const petSpecies = appt.pet?.species ?? '';
                  const serviceName = appt.service?.name ?? appt.initial_complaint ?? '-';
                  return (
                    <div key={appt.id ?? i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded border border-slate-100 bg-slate-50 gap-4">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded bg-blue-100 text-blue-600 font-bold">
                          {petName[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900">{petName}</h4>
                            {petSpecies && <span className="text-xs text-slate-500">({petSpecies})</span>}
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{serviceName}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatScheduleDate(appt.appointment_date)} @ {appt.appointment_time} WIB
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center rounded border px-2.5 py-1 text-xs font-semibold ${getStatusColor(appt.status)} self-start sm:self-center`}>
                        {appt.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              to="/owner/booking"
              className="inline-flex w-full items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <Calendar className="h-4 w-4" />
              Buat Janji Temu Baru
            </Link>
          </div>
        </div>

        {/* Reminders & Edukasi */}
        <div className="col-span-1 rounded-sm border border-slate-200 bg-white p-6 shadow-sm lg:col-span-4">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Pengingat & Vaksinasi</h3>
          <div className="space-y-4">
            {healthReminders.map((reminder, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-md border border-slate-100 bg-slate-50">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">{reminder.type}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${reminder.statusColor}`}>
                      {reminder.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mt-1">{reminder.title}</h4>
                  <p className="text-xs text-slate-600 mt-1">Hewan: <span className="font-semibold">{reminder.petName}</span></p>
                  <p className="text-xs text-slate-400 mt-1">Jatuh Tempo: {reminder.dueDate}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-sm border border-blue-100">
            <div className="flex items-center gap-2 mb-2 text-blue-900">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-bold uppercase tracking-wider">Layanan Darurat</span>
            </div>
            <p className="text-xs text-blue-700 leading-relaxed">
              Klinik beroperasi 24 Jam untuk kondisi darurat. Hubungi Call Center di <span className="font-bold text-blue-900">0812-999-888</span> untuk ambulans hewan.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OwnerDashboard;

