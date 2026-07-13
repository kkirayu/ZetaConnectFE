import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  ArrowLeft,
  User,
  PawPrint,
  Stethoscope,
  Save,
  Calendar,
  Info,
  ChevronRight,
  AlertCircle,
  X
} from 'lucide-react';
import { showSuccess, showError } from '../../utils/alertUtils';

const WalkInRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ownerName: '',
    ownerPhone: '',
    ownerAddress: '',
    petName: '',
    species: '',
    service_id: '',
    doctor_id: '',
    schedule_date: '',
    schedule_time: '',
    initial_complaint: ''
  });

  const [services, setServices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [ownerPets, setOwnerPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState('');
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resSvc, resDoc] = await Promise.all([
          api.get('/services'),
          api.get('/doctors')
        ]);
        setServices(resSvc.data.data.data || []);
        setDoctors(Array.isArray(resDoc.data) ? resDoc.data : (resDoc.data.data || []));
      } catch (err) {
        console.error("Error fetching dependencies", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchAvailableSessions = async () => {
      if (!formData.schedule_date) {
        setAvailableSessions([]);
        return;
      }
      setIsLoadingSessions(true);
      try {
        const params = new URLSearchParams({ date: formData.schedule_date });
        if (formData.doctor_id) {
          params.append('doctor_id', formData.doctor_id);
        }
        if (formData.service_id) {
          params.append('service_id', formData.service_id);
        }
        const res = await api.get(`/available-sessions?${params.toString()}`);
        setAvailableSessions(res.data.data || []);
      } catch (err) {
        console.error("Error fetching available sessions", err);
        setAvailableSessions([]);
      } finally {
        setIsLoadingSessions(false);
      }
    };

    fetchAvailableSessions();
  }, [formData.schedule_date, formData.doctor_id, formData.service_id]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (searchQuery.trim().length < 3) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await api.get(`/users?role=Owner&search=${searchQuery}`);
        setSearchResults(res.data.data.data || []);
      } catch (err) {
        console.error("Error searching users", err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(() => fetchUsers(), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectOwner = async (owner) => {
    setSelectedOwner(owner);
    setSearchQuery('');
    setSearchResults([]);
    try {
      const res = await api.get(`/users/${owner.id}`);
      setOwnerPets(res.data.data.pets || []);
      if (res.data.data.pets && res.data.data.pets.length > 0) {
        setSelectedPetId(res.data.data.pets[0].id.toString());
      } else {
        setSelectedPetId('');
      }
    } catch (err) {
      console.error("Error fetching owner pets", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['ownerName', 'petName'].includes(name)) {
      setFormData(prev => ({ ...prev, [name]: value.replace(/[^a-zA-Z\s]/g, '') }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
        let ownerId, petId, petName, ownerName;
        
        if (isNewUser) {
            // 1. Create User
            const userPayload = {
                name: formData.ownerName,
                email: `walkin_${Date.now()}@zeta.com`,
                password: "password123",
                phone_number: formData.ownerPhone,
                role: "Owner",
                status: "Aktif",
                address: formData.ownerAddress || "Alamat tidak diisi"
            };
            const userRes = await api.post('/users', userPayload);
            ownerId = userRes.data.data.id;
            ownerName = formData.ownerName;

            // 2. Create Pet
            const petPayload = {
                owner_id: ownerId,
                name: formData.petName,
                species: formData.species,
                gender: "Jantan" // default
            };
            const petRes = await api.post('/pets', petPayload);
            petId = petRes.data.data.id;
            petName = formData.petName;
        } else {
            if (!selectedOwner) {
                setErrorMsg("Silakan pilih Pasien Lama terlebih dahulu.");
                setIsSubmitting(false);
                return;
            }
            if (!selectedPetId) {
                setErrorMsg("Pemilik ini belum memiliki hewan peliharaan terdaftar. Silakan gunakan mode Pasien Baru.");
                setIsSubmitting(false);
                return;
            }
            ownerId = selectedOwner.id;
            ownerName = selectedOwner.name;
            petId = selectedPetId;
            petName = ownerPets.find(p => p.id.toString() === selectedPetId)?.name || 'Hewan';
        }

        // 3. Create Appointment
        const appointmentPayload = {
            owner_id: ownerId,
            pet_id: petId,
            service_id: formData.service_id,
            doctor_id: formData.doctor_id || null,
            booking_type: "Walk-in",
            schedule_date: formData.schedule_date,
            schedule_time: formData.schedule_time,
            initial_complaint: formData.initial_complaint,
            status: "Disetujui"
        };
        const aptRes = await api.post('/appointments', appointmentPayload);
        const appointment = aptRes.data.data;

        setPrintData({
            queueNumber: appointment.queue_number,
            petName: petName,
            ownerName: ownerName,
            doctorName: formData.doctor_id ? doctors.find(d => d.doctor_id.toString() === formData.doctor_id)?.name : 'Umum (Tanpa Preferensi)',
            service: services.find(s => s.id.toString() === formData.service_id)?.name || '-',
            date: formData.schedule_date,
            time: formData.schedule_time
        });

    } catch (err) {
        console.error("Error creating appointment:", err.response?.data || err);
        const errMsg = err.response?.data?.message || JSON.stringify(err.response?.data) || err.message;
        setErrorMsg(errMsg);
    } finally {
        setIsSubmitting(false);
    }

    if (!/^[a-zA-Z\s]+$/.test(formData.ownerName)) {
      showError('Validasi Gagal', 'Nama pemilik hanya boleh berisi huruf!');
      return;
    }

    if (!/^0\d{0,12}$/.test(formData.ownerPhone)) {
      showError('Validasi Gagal', 'Nomor HP maksimal 13 digit angka dan harus dimulai dengan 0!');
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(formData.petName)) {
      showError('Validasi Gagal', 'Nama hewan hanya boleh berisi huruf!');
      return;
    }

    if (formData.initial_complaint) {
      const wordCount = formData.initial_complaint.trim().split(/\s+/).filter(word => word.length > 0).length;
      if (wordCount < 10 || wordCount > 200) {
        showError('Validasi Gagal', 'Keluhan awal minimal 10 kata dan maksimal 200 kata.');
        return;
      }
    }
    console.log('Form Submitted:', formData);
    await showSuccess('Berhasil!', 'Pendaftaran Berhasil!');
    navigate('/receptionist');
  };

  const handlePrint = () => {
    window.print();
    setTimeout(() => {
        navigate('/receptionist');
    }, 1000);
  };

  if (printData) {
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-8">
              <div className="w-full max-w-sm text-center border-2 border-dashed border-slate-300 p-8 rounded-lg shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">ZetaConnect Clinic</h2>
                  <p className="text-slate-500 mb-6 border-b border-slate-200 pb-4 text-sm">Nomor Antrian Walk-In</p>
                  
                  <div className="text-4xl md:text-5xl tracking-tight font-black text-blue-600 mb-6 break-words px-2">{printData.queueNumber}</div>
                  
                  <div className="text-left space-y-3 text-sm text-slate-700 border-t border-slate-100 pt-4">
                      <div className="flex justify-between"><span>Pasien:</span> <span className="font-bold text-right">{printData.petName}</span></div>
                      <div className="flex justify-between"><span>Pemilik:</span> <span className="font-bold text-right">{printData.ownerName}</span></div>
                      <div className="flex justify-between items-start gap-4">
                          <span>Dokter:</span> 
                          <span className="font-bold text-right line-clamp-2">{printData.doctorName}</span>
                      </div>
                      <div className="flex justify-between"><span>Layanan:</span> <span className="font-bold text-right">{printData.service}</span></div>
                      <div className="flex justify-between"><span>Jadwal:</span> <span className="font-bold text-right">{printData.date} {printData.time}</span></div>
                  </div>
                  
                  <div className="mt-8 border-t border-slate-200 pt-6">
                      <button 
                          onClick={handlePrint} 
                          className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-sm hover:bg-blue-700 transition-colors print:hidden shadow-sm"
                      >
                          Cetak Sekarang
                      </button>
                      <button 
                          onClick={() => navigate('/receptionist')} 
                          className="w-full mt-2 text-slate-500 font-semibold py-2 rounded-sm hover:bg-slate-50 transition-colors print:hidden"
                      >
                          Selesai & Kembali
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  const todayDateString = new Date().toISOString().split('T')[0];
  const isToday = formData.schedule_date === todayDateString;
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const filteredSessions = availableSessions.filter(item => {
      const timeStr = typeof item === 'string' ? item : item.time;
      if (!isToday) return true;
      const [hourStr, minuteStr] = timeStr.split(':');
      const sessionHour = parseInt(hourStr, 10);
      const sessionMinute = parseInt(minuteStr, 10);
      
      if (sessionHour < currentHour) return false;
      if (sessionHour === currentHour && sessionMinute <= currentMinute) return false;
      
      return true;
  });

  return (
    <div className="space-y-6 pb-10 relative">
      {/* Error Modal */}
      {errorMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setErrorMsg(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center text-center gap-4 pt-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Gagal Menyimpan Data</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {errorMsg}
                </p>
                <button
                  onClick={() => setErrorMsg(null)}
                  className="w-full rounded-sm bg-red-600 px-4 py-2.5 font-bold text-white transition-all hover:bg-red-700 active:scale-[0.98] shadow-sm"
                >
                  Tutup dan Perbaiki
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*  Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/receptionist')}
          className="flex h-10 w-10 items-center justify-center rounded-sm border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pendaftaran Walk-In</h1>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <span>Dashboard</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-blue-600">Pendaftaran Pasien Baru</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">

          {/* Toggle Type */}
          <div className="flex bg-slate-100 p-1 rounded-sm border border-slate-200">
            <button
              type="button"
              onClick={() => setIsNewUser(true)}
              className={`flex-1 py-2 text-sm font-bold transition-all rounded-sm ${isNewUser ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Pasien Baru
            </button>
            <button
              type="button"
              onClick={() => setIsNewUser(false)}
              className={`flex-1 py-2 text-sm font-bold transition-all rounded-sm ${!isNewUser ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Pasien Lama
            </button>
          </div>

          {!isNewUser ? (
            <div className="rounded-sm border border-slate-200 bg-white shadow-sm p-6 space-y-6">
              {!selectedOwner ? (
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-slate-700">Cari Pemilik (Nama/Email)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ketik minimal 3 huruf..."
                      className="w-full rounded-sm border border-slate-300 px-4 py-2 text-sm outline-none transition-all focus:border-blue-500"
                    />
                    {isSearching && <span className="absolute right-3 top-2.5 text-xs text-slate-400">Mencari...</span>}
                  </div>
                  {searchResults.length > 0 && (
                    <div className="border border-slate-200 rounded-sm divide-y max-h-48 overflow-y-auto">
                      {searchResults.map(user => (
                        <div 
                          key={user.id} 
                          className="p-3 hover:bg-slate-50 cursor-pointer flex flex-col"
                          onClick={() => handleSelectOwner(user)}
                        >
                          <span className="font-bold text-slate-800 text-sm">{user.name}</span>
                          <span className="text-xs text-slate-500">{user.email} - {user.phone_number}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
                     <div className="text-sm text-slate-500 p-2">Pemilik tidak ditemukan.</div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-100 rounded-sm">
                    <div>
                      <div className="font-bold text-slate-800">{selectedOwner.name}</div>
                      <div className="text-xs text-slate-500">{selectedOwner.phone_number}</div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setSelectedOwner(null)}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Ganti
                    </button>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Pilih Hewan Peliharaan <span className="text-red-500">*</span></label>
                    {ownerPets.length === 0 ? (
                       <div className="text-sm text-red-500 p-2 border border-red-200 bg-red-50 rounded-sm">Belum ada hewan terdaftar. Silakan gunakan mode Pasien Baru.</div>
                    ) : (
                      <select
                        value={selectedPetId}
                        onChange={(e) => setSelectedPetId(e.target.value)}
                        className="w-full rounded-sm border border-slate-300 px-4 py-2 text-sm outline-none transition-all focus:border-blue-500"
                      >
                        {ownerPets.map(pet => (
                          <option key={pet.id} value={pet.id}>{pet.name} ({pet.species})</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
          {/* Data Hewan */}
          <div className="rounded-sm border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <PawPrint className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Informasi Hewan Peliharaan</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Nama Hewan <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  name="petName"
                  value={formData.petName}
                  onChange={handleChange}
                  placeholder="Contoh: Milo"
                  className="w-full rounded-sm border border-slate-300 px-4 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Jenis Hewan <span className="text-red-500">*</span></label>
                <select
                  required
                  name="species"
                  value={formData.species}
                  onChange={handleChange}
                  className="w-full rounded-sm border border-slate-300 px-4 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Pilih Jenis</option>
                  <option value="Kucing">Kucing</option>
                  <option value="Anjing">Anjing</option>
                  <option value="Burung">Burung</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>
          </div>

          {/* Data Pemilik */}
          <div className="rounded-sm border border-slate-200 bg-white shadow-sm mt-6">
            <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                <User className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Informasi Pemilik</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Nama Pemilik <span className="text-red-500">*</span></label>
                <input
                  required={isNewUser}
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full rounded-sm border border-slate-300 px-4 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Nomor Telepon <span className="text-red-500">*</span></label>
                <input
                  required={isNewUser}
                  type="text"
                  name="ownerPhone"
                  value={formData.ownerPhone}
                  onChange={handleChange}
                  placeholder="Contoh: 08123456789"
                  className="w-full rounded-sm border border-slate-300 px-4 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Alamat</label>
                <textarea
                  name="ownerAddress"
                  value={formData.ownerAddress}
                  onChange={handleChange}
                  placeholder="Alamat lengkap (opsional)"
                  rows="2"
                  className="w-full rounded-sm border border-slate-300 px-4 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                ></textarea>
              </div>
            </div>
          </div>
          </>
          )}

        </div>

        <div className="space-y-6 lg:col-span-4">

          {/* Visit Details */}
          <div className="rounded-sm border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                <Stethoscope className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Detail Kunjungan</h3>
            </div>

            <div className="space-y-4 p-6">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Layanan <span className="text-red-500">*</span></label>
                <select
                  name="service_id" value={formData.service_id} onChange={handleChange}
                  className="w-full rounded-sm border border-slate-300 bg-transparent px-4 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="" disabled>Pilih layanan</option>
                  {services.map((svc) => (
                      <option key={svc.id} value={svc.id}>{svc.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Dokter (Opsional)</label>
                <select
                  name="doctor_id" value={formData.doctor_id} onChange={handleChange}
                  className="w-full rounded-sm border border-slate-300 bg-transparent px-4 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Tanpa Preferensi</option>
                  {doctors.map((doc) => (
                      <option key={doc.doctor_id} value={doc.doctor_id}>{doc.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Tanggal Jadwal <span className="text-red-500">*</span></label>
                <input
                  type="date" name="schedule_date" value={formData.schedule_date} onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-sm border border-slate-300 bg-transparent px-4 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Waktu Jadwal <span className="text-red-500">*</span></label>
                <select
                  name="schedule_time" value={formData.schedule_time} onChange={handleChange}
                  className="w-full rounded-sm border border-slate-300 bg-transparent px-4 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  required
                  disabled={isLoadingSessions || !formData.schedule_date || !formData.service_id || filteredSessions.length === 0}
                >
                  <option value="" disabled>
                    {!(formData.schedule_date && formData.service_id) ? 'Pilih layanan & tanggal dulu' : (isLoadingSessions ? 'Memuat jadwal...' : (filteredSessions.length === 0 ? 'Tidak ada jadwal tersedia / Sesi hari ini sudah lewat' : 'Pilih Sesi'))}
                  </option>
                  {filteredSessions.map((item, index) => {
                      const timeStr = typeof item === 'string' ? item : item.time;
                      const labelStr = typeof item === 'string' ? `${timeStr} WIB` : item.label;
                      return (
                          <option key={index} value={timeStr}>
                              {labelStr}
                          </option>
                      );
                  })}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Keluhan Awal / Catatan <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows="4"
                  name="initial_complaint"
                  value={formData.initial_complaint}
                  onChange={handleChange}
                  placeholder="Contoh: Kucing saya muntah-muntah sejak pagi..."
                  className="w-full rounded-sm border border-slate-300 px-4 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="rounded-sm bg-blue-50 p-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 flex-shrink-0 text-blue-600" />
                  <p className="text-xs leading-relaxed text-blue-700">
                    Pastikan semua data bertanda <span className="font-bold text-red-500">*</span> telah diisi dengan benar sebelum menyimpan pendaftaran.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-sm bg-blue-600 px-6 py-3 font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-[0.98] disabled:bg-blue-400"
            >
              <Save className="h-5 w-5" />
              {isSubmitting ? 'Memproses...' : 'Simpan & Cetak Antrian'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/receptionist')}
              className="w-full rounded-sm border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition-all hover:bg-slate-50"
            >
              Batalkan
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default WalkInRegistration;
