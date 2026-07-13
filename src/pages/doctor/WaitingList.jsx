import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Clock, CheckCircle, Search, Loader2, FileText, Activity, AlertTriangle, X } from 'lucide-react';
import api from '../../services/api';
import { showError } from '../../utils/alertUtils';

const WaitingList = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientForExam, setSelectedPatientForExam] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await api.get('/appointments');
        const resData = response.data;
        let data = [];
        if (Array.isArray(resData)) data = resData;
        else if (Array.isArray(resData?.data)) data = resData.data;
        else if (Array.isArray(resData?.data?.data)) data = resData.data.data;

        const mappedPatients = data
          .filter(appt => appt.status !== 'Menunggu' && appt.status !== 'Batal')
          .map((appt) => {
          return {
            id: appt.id,
            ownerName: appt.pet?.owner?.name || appt.owner?.name || 'Owner Tidak Diketahui',
            petId: appt.pet_id || appt.pet?.id,
            petName: appt.pet?.name || 'Hewan Tidak Diketahui',
            petType: appt.pet?.species || 'Spesies Tidak Diketahui',
            status: appt.status || 'Menunggu',
            time: appt.schedule_time || '00:00',
            date: appt.schedule_date || '-',
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.pet?.owner?.name || appt.owner?.name || 'U')}&background=random`
          };
        });

        setPatients(mappedPatients);
      } catch (error) {
        console.error("Gagal mengambil data dari API:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const filteredPatients = patients.filter(p =>
    p.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.petName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header Info */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Antrean Pasien</h2>
          <p className="text-sm text-slate-500">Daftar hewan peliharaan yang menunggu pemeriksaan hari ini.</p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Cari pasien atau owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:w-64"
          />
        </div>
      </div>

      {/* Tabel Data */}
      <div className="rounded-sm border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">No. Antrean</th>
                <th className="px-6 py-4 font-medium">Informasi Pasien</th>
                <th className="px-6 py-4 font-medium">Pemilik (Owner)</th>
                <th className="px-6 py-4 font-medium">Waktu</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center text-blue-500">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="mt-2 text-sm text-slate-500">Memuat data API...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPatients.length > 0 ? (
                filteredPatients.map((patient, index) => (
                  <tr key={patient.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-800">
                      #{String(index + 1).padStart(3, '0')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{patient.petName}</div>
                      <div className="text-xs text-slate-500">{patient.petType}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={patient.image} alt="owner" className="h-8 w-8 rounded-full bg-slate-200" />
                        <span className="font-medium">{patient.ownerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-slate-500">
                        <div className="font-semibold text-slate-700">{patient.date}</div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{patient.time}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                        patient.status === 'Sedang Diperiksa' ? 'bg-blue-100 text-blue-700'
                        : patient.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                        }`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/doctor/patient-profile/${patient.petId}`}
                          className="flex items-center gap-1 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
                          title="Lihat Profil & Rekam Medis"
                        >
                          <Activity className="h-3.5 w-3.5 text-slate-400" /> Profil
                        </Link>
                        {patient.status !== 'Selesai' && (
                          <button
                            onClick={() => {
                              const todayStr = new Date().toISOString().split('T')[0];
                              if (patient.date !== todayStr) {
                                showError('Belum Waktunya', 'Pemeriksaan hanya dapat dilakukan pada hari jadwal yang bersangkutan.');
                                return;
                              }
                              setSelectedPatientForExam(patient);
                            }}
                            className={`flex items-center gap-1 rounded px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors ${
                              patient.date === new Date().toISOString().split('T')[0]
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : 'bg-slate-400 hover:bg-slate-500 cursor-not-allowed'
                            }`}
                            title={patient.date === new Date().toISOString().split('T')[0] ? '' : 'Belum waktunya'}
                          >
                            <FileText className="h-3.5 w-3.5" /> 
                            {patient.status === 'Sedang Diperiksa' ? 'Lanjutkan' : 'Periksa'}
                          </button>
                        )}
                        {patient.status === 'Selesai' && (
                           <div className="flex items-center gap-1 rounded bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-400 cursor-not-allowed">
                             <CheckCircle className="h-3.5 w-3.5" /> Selesai
                           </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-500">
                    Tidak ada antrean pasien yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL KONFIRMASI PERIKSA --- */}
      {selectedPatientForExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedPatientForExam(null)}></div>
          
          <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" /> Konfirmasi Pemeriksaan
              </h3>
              <button onClick={() => setSelectedPatientForExam(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                Apakah Anda yakin ingin memulai pemeriksaan untuk antrean ini?
              </p>
              
              <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 mb-6 flex items-center gap-4">
                <img src={selectedPatientForExam.image} alt="owner" className="h-12 w-12 rounded-full bg-white shadow-sm border border-slate-200" />
                <div>
                  <p className="text-sm font-bold text-slate-800">{selectedPatientForExam.petName} <span className="text-xs font-medium text-slate-500">({selectedPatientForExam.petType})</span></p>
                  <p className="text-xs text-slate-500 mt-1">Pemilik: <span className="font-medium text-slate-700">{selectedPatientForExam.ownerName}</span></p>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
                <button 
                  onClick={() => setSelectedPatientForExam(null)}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={() => navigate('/doctor/soap', { 
                    state: { 
                      appointmentId: selectedPatientForExam.id, 
                      petId: selectedPatientForExam.petId,
                      doctorId: JSON.parse(localStorage.getItem('user') || '{}').id || '1'
                    } 
                  })}
                  className="w-full sm:w-auto flex justify-center items-center gap-2 rounded-md bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700 shadow-md transition-all"
                >
                  <FileText className="h-4 w-4" /> {selectedPatientForExam.status === 'Sedang Diperiksa' ? 'Lanjutkan Periksa' : 'Mulai Periksa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitingList;