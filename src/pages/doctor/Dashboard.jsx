import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  Clock, 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  UserCheck,
  ClipboardList,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const DoctorDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/doctor/dashboard');
        const resData = response.data?.data || response.data;
        setDashboardData(resData);
      } catch (error) {
        console.error("Gagal memuat data dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-blue-500">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 font-medium">Memuat Dashboard...</span>
      </div>
    );
  }

  const { stats: apiStats, surgerySchedule = [], topDiagnoses = [] } = dashboardData || {};

  const stats = [
    {
      title: 'Pasien Hari Ini',
      value: `${apiStats?.totalPasien || 0} Pasien`,
      subtitle: 'Total terdaftar hari ini',
      icon: <Users className="text-blue-600 h-6 w-6" />,
      bgIcon: 'bg-blue-100',
    },
    {
      title: 'Antrean Menunggu',
      value: `${apiStats?.antreanMenunggu || 0} Pasien`,
      subtitle: 'Perlu segera diperiksa',
      icon: <Clock className="text-amber-600 h-6 w-6" />,
      bgIcon: 'bg-amber-100',
    },
    {
      title: 'Selesai Diperiksa',
      value: `${apiStats?.selesaiDiperiksa || 0} Pasien`,
      subtitle: 'Sudah ditangani',
      icon: <UserCheck className="text-emerald-600 h-6 w-6" />,
      bgIcon: 'bg-emerald-100',
    },
    {
      title: 'Tindakan Operasi',
      value: `${apiStats?.tindakanOperasi || 0} Prosedur`,
      subtitle: 'Hari ini',
      icon: <Activity className="text-rose-600 h-6 w-6" />,
      bgIcon: 'bg-rose-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Dashboard */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Halo, {user.name || 'Dokter'}</h1>
          <p className="text-sm text-slate-500">Berikut adalah ikhtisar pelayanan pasien dan tindakan medis Anda hari ini.</p>
        </div>
        <div className="text-sm font-medium text-slate-500">Update terakhir: {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</div>
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
        
        {/* Jadwal Operasi / Tindakan Medis */}
        <div className="col-span-1 rounded-sm border border-slate-200 bg-white p-6 shadow-sm lg:col-span-8 flex flex-col justify-between">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-rose-500" />
                Jadwal Operasi & Tindakan Hari Ini
              </h3>
              <Link to="/doctor/waiting-list" className="text-sm font-semibold text-blue-600 hover:underline">
                Lihat Antrean Pasien
              </Link>
            </div>

            <div className="space-y-4">
              {surgerySchedule.length > 0 ? surgerySchedule.map((schedule, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded border border-slate-100 bg-slate-50 gap-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded bg-rose-50 text-rose-600 font-bold">
                      {schedule.petName?.[0] || '-'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900">{schedule.petName}</h4>
                        <span className="text-xs text-slate-500">({schedule.species})</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-700 mt-1">{schedule.procedure}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Waktu: {schedule.time}
                        </span>
                        <span className="font-medium text-slate-600">
                          Pemilik: {schedule.owner}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded border px-2.5 py-1 text-xs font-semibold ${schedule.statusColor} self-start sm:self-center`}>
                    {schedule.status}
                  </span>
                </div>
              )) : (
                <div className="text-center py-6 text-sm text-slate-500">Tidak ada jadwal operasi / tindakan untuk hari ini.</div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link 
              to="/doctor/soap" 
              className="inline-flex w-full items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Tulis Rekam Medis (SOAP) Baru
            </Link>
          </div>
        </div>

        {/* Kasus Penyakit Terbanyak */}
        <div className="col-span-1 rounded-sm border border-slate-200 bg-white p-6 shadow-sm lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="mb-6 text-lg font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-500" />
              Kasus Penyakit Terbanyak
            </h3>
            <div className="space-y-5">
              {topDiagnoses.length > 0 ? topDiagnoses.map((item, i) => (
                <div key={i}>
                  <div className="mb-1.5 flex justify-between text-sm font-medium">
                    <span className="text-slate-700 text-xs sm:text-sm">{item.label}</span>
                    <span className="text-slate-900 font-bold">{item.count} Kasus</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div 
                      className={`h-2 rounded-full ${item.color} transition-all duration-700`} 
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 text-sm text-slate-500">Belum ada data diagnosis.</div>
              )}
            </div>
          </div>

          <div className="mt-8 p-4 bg-slate-50 rounded-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2 text-slate-800">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-bold uppercase tracking-wider">Catatan Alur Kerja</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed italic">
              "Ingatlah untuk selalu memperbarui Kamus Penyakit apabila mendapati diagnosis baru yang belum terdaftar di sistem."
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DoctorDashboard;