import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Search, Loader2 } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { doctorService } from '../../../services/doctorService';

const SurgeryReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Menangkap transferan data antrean operasi dari dashboard utama (jika ada)
  const { activeSurgery } = location.state || {};

  // State Data Master dari API
  const [petOptions, setPetOptions] = useState([]);
  
  // State UI & Loading
  const [isLoadingPets, setIsLoadingPets] = useState(!activeSurgery);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    pet_id: activeSurgery?.pet_id || '',
    surgery_type: activeSurgery?.surgery_type || activeSurgery?.action_name || '',
    anesthesia_notes: '',
    post_op_instructions: ''
  });

  // Ambil daftar hewan riil dari API jika tidak dilempar dari dashboard
  useEffect(() => {
    if (activeSurgery) return;

    const fetchPetsData = async () => {
      try {
        setIsLoadingPets(true);
        const response = await doctorService.getPets();
        const petsData = response?.data?.data || response?.data || response;
        setPetOptions(Array.isArray(petsData) ? petsData : []);
      } catch (error) {
        console.error('Gagal memuat master data hewan:', error);
      } finally {
        setIsLoadingPets(false);
      }
    };

    fetchPetsData();
  }, [activeSurgery]);

  // Mendapatkan info nama hewan untuk tampilan otomatis di kotak informasi
  const getSelectedPetInfo = () => {
    if (activeSurgery) {
      return `${activeSurgery.pet_name || 'Pasien Aktif'} (${activeSurgery.pet_species || 'Hewan'})`;
    }
    
    const selected = petOptions.find(p => p.id === parseInt(formData.pet_id));
    if (selected) {
      return `${selected.name} (${selected.species || 'N/A'})`;
    }
    
    return "Silahkan pilih hewan di bawah";
  };

  // Handler perubahan input form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Kirim data riil ke Backend Laravel
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.pet_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Pasien Belum Dipilih',
        text: 'Silakan tentukan pasien hewan yang dioperasi.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    setIsSubmitting(true);

    // Payload diketatkan presisi mengikuti model & SurgeryResource backend
    const payload = {
      pet_id: parseInt(formData.pet_id),
      doctor_id: user.id || 1, // Mengambil ID dari user login
      surgery_type: formData.surgery_type,
      anesthesia_notes: formData.anesthesia_notes,
      post_op_instructions: formData.post_op_instructions
    };

    try {
      const response = await doctorService.submitSurgeryReport(payload);
      
      await Swal.fire({
        icon: 'success',
        title: 'Data Bedah Disimpan!',
        text: response?.message || 'Laporan tindakan operasi berhasil didokumentasikan ke rekam medis.',
        confirmButtonColor: '#ef4444'
      });

      navigate('/doctor');
    } catch (error) {
      console.error('Gagal menyimpan data bedah:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan Laporan',
        text: error.response?.data?.message || 'Terjadi galat pada server. Periksa kembali kecocokan tipe data.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Form Tindakan Bedah (Surgery)</h1>
          <p className="text-sm text-slate-500">Pencatatan detail operasi dan instruksi pasca-bedah.</p>
        </div>
        
        <Link 
          to="/doctor" 
          className="inline-flex items-center justify-center gap-2 rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
      </div>

      {/* 2. Form Area Utama */}
      <div className="rounded-sm border border-slate-200 bg-white shadow-sm">
        <div className="p-6 space-y-6">
          
          {/* Informasi Pasien (Otomatis berdasarkan pilihan) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-md border border-slate-100">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Nama Pasien (Otomatis)</label>
              <p className="text-sm font-semibold text-slate-800">
                {getSelectedPetInfo()}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Dokter Bedah</label>
              <p className="text-sm font-semibold text-slate-800">{user.name || 'Dokter'}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Pilih Hewan */}
            <div>
              <label className="mb-2.5 block font-medium text-slate-800">
                Pilih Hewan <span className="text-xs text-slate-400 font-normal">(pet_id)</span>
              </label>
              <div className="relative">
                {activeSurgery ? (
                  <div className="w-full rounded border border-emerald-200 bg-emerald-50 py-2 px-4 text-sm font-semibold text-emerald-800">
                    {activeSurgery.pet_name} — Terkunci dari Antrean Operasi Dashboard
                  </div>
                ) : isLoadingPets ? (
                  <div className="flex h-10 items-center justify-center rounded border border-slate-200 bg-slate-50 text-xs text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-500" /> Memuat Master Data Pasien...
                  </div>
                ) : (
                  <>
                    <select
                      name="pet_id"
                      required
                      value={formData.pet_id}
                      onChange={handleChange}
                      className="w-full appearance-none rounded border border-slate-300 bg-white py-2 pl-4 pr-10 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="">-- Pilih Hewan yang Dioperasi --</option>
                      {petOptions.map(pet => (
                        <option key={pet.id} value={pet.id}>
                          {pet.name} ({pet.species || 'N/A'}) {pet.owner ? `- Owner: ${pet.owner.name}` : ''}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Search className="h-4 w-4 text-slate-400" />
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Jenis Operasi (Input Teks) */}
            <div>
              <label className="mb-2.5 block font-medium text-slate-800">
                Jenis Operasi <span className="text-xs text-slate-400 font-normal">(surgery_type)</span>
              </label>
              <input
                type="text"
                name="surgery_type"
                required
                placeholder="Contoh: Sterilisasi, Pengangkatan Tumor, Abses Drainage"
                value={formData.surgery_type}
                onChange={handleChange}
                className="w-full rounded border border-slate-300 bg-transparent py-2 px-4 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
              />
            </div>

            {/* Catatan Anestesi (Text Area) */}
            <div>
              <label className="mb-2.5 block font-medium text-slate-800">
                Catatan Anestesi <span className="text-xs text-slate-400 font-normal">(anesthesia_notes)</span>
              </label>
              <textarea
                rows="3"
                name="anesthesia_notes"
                required
                placeholder="Detail jenis obat bius, dosis premedikasi, dan reaksi vital pasien selama dibius..."
                value={formData.anesthesia_notes}
                onChange={handleChange}
                className="w-full rounded border border-slate-300 bg-transparent py-2 px-4 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
              ></textarea>
            </div>

            {/* Instruksi Pasca-Operasi (Text Area) */}
            <div>
              <label className="mb-2.5 block font-medium text-slate-800">
                Instruksi Pasca-Operasi <span className="text-xs text-slate-400 font-normal">(post_op_instructions)</span>
              </label>
              <textarea
                rows="4"
                name="post_op_instructions"
                required
                placeholder="Catatan perawatan luka jahit, pantangan makan/aktivitas, atau instruksi pemakaian e-collar di rumah..."
                value={formData.post_op_instructions}
                onChange={handleChange}
                className="w-full rounded border border-slate-300 bg-transparent py-2 px-4 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
              ></textarea>
            </div>

            {/* Tombol Simpan */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || (!formData.pet_id && !activeSurgery)}
                className="inline-flex items-center justify-center gap-2 rounded bg-red-600 px-10 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-all shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan Laporan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Simpan Data Bedah
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SurgeryReport;