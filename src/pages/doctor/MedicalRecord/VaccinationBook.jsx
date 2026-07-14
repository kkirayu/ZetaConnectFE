import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Search, Loader2 } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { doctorService } from '../../../services/doctorService';

const VaccinationBook = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Menangkap transferan data context dari antrean konsultasi/vaksinasi di dashboard (jika ada)
  const { activeVaccination } = location.state || {};

  // State Data Master dari API
  const [petOptions, setPetOptions] = useState([]);
  
  // State UI & Loading
  const [isLoadingPets, setIsLoadingPets] = useState(!activeVaccination);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State disesuaikan 100% dengan properti yang dibutuhkan VaccinationResource
  const [formData, setFormData] = useState({
    pet_id: activeVaccination?.pet_id || '',
    vaccine_name: '',
    batch_number: '',
    next_due_date: ''
  });

  // Ambil daftar hewan riil dari API jika tidak dilempar dari dashboard
  useEffect(() => {
    if (activeVaccination) return;

    const fetchPetsData = async () => {
      try {
        setIsLoadingPets(true);
        const response = await doctorService.getPets();
        const petsData = response?.data?.data || response?.data || response;
        setPetOptions(Array.isArray(petsData) ? petsData : []);
      } catch (error) {
        console.error('Gagal memuat master data hewan untuk vaksin:', error);
      } finally {
        setIsLoadingPets(false);
      }
    };

    fetchPetsData();
  }, [activeVaccination]);

  // Mendapatkan info nama hewan untuk tampilan otomatis di kotak informasi pasien
  const getSelectedPetInfo = () => {
    if (activeVaccination) {
      return `${activeVaccination.pet_name || 'Pasien Aktif'} (${activeVaccination.pet_species || 'Hewan'})`;
    }
    
    const selected = petOptions.find(p => p.id === parseInt(formData.pet_id));
    if (selected) {
      return `${selected.name} (${selected.species || 'N/A'})`;
    }
    
    return "Silahkan pilih hewan peliharaan";
  };

  // Handler perubahan input form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Kirim payload data riil ke Backend Laravel
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.pet_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Pasien Belum Dipilih',
        text: 'Silakan tentukan hewan peliharaan yang akan divaksinasi.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    setIsSubmitting(true);

    // Payload tabel backend vaccinations
    const payload = {
      pet_id: parseInt(formData.pet_id),
      doctor_id: user.id || 1, // Mengambil ID dari user login
      vaccine_name: formData.vaccine_name,
      batch_number: formData.batch_number,
      next_due_date: formData.next_due_date || null // Mengantisipasi error jika dikosongkan
    };

    try {
      const response = await doctorService.submitVaccination(payload);
      
      await Swal.fire({
        icon: 'success',
        title: 'Buku Vaksin Diperbarui!',
        text: response?.message || 'Data imunisasi baru berhasil didokumentasikan.',
        confirmButtonColor: '#10b981' // Menyelaraskan aksen hijau tombol simpan
      });

      // Kembali ke dashboard
      navigate('/doctor');
    } catch (error) {
      console.error('Gagal menyimpan riwayat vaksinasi:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan Vaksin',
        text: error.response?.data?.message || 'Terjadi gangguan sistem di server. Cek validasi data.',
        confirmButtonColor: '#10b981'
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
          <h1 className="text-2xl font-bold text-slate-800">Form Buku Vaksin (Vaccine)</h1>
          <p className="text-sm text-slate-500">Pencatatan riwayat imunisasi hewan berdasarkan tabel vaccinations.</p>
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
          
          {/* Informasi Pasien (Otomatis) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-md border border-slate-100">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Nama Pasien</label>
              <p className="text-sm font-semibold text-slate-800">
                {getSelectedPetInfo()}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Dokter Pemeriksa</label>
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
                {activeVaccination ? (
                  <div className="w-full rounded border border-emerald-200 bg-emerald-50 py-2 px-4 text-sm font-semibold text-emerald-800">
                    {activeVaccination.pet_name} — Terkunci dari Antrean Dashboard
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
                      <option value="">-- Pilih Hewan --</option>
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

            {/* Nama Vaksin (Input Teks / Dropdown) */}
            <div>
              <label className="mb-2.5 block font-medium text-slate-800">
                Nama Vaksin <span className="text-xs text-slate-400 font-normal">(vaccine_name)</span>
              </label>
              <input
                type="text"
                list="vaccine_suggestions"
                name="vaccine_name"
                required
                placeholder="Contoh: Tricat, Tetracat, Eurican, Felocell, atau Rabies"
                value={formData.vaccine_name}
                onChange={handleChange}
                className="w-full rounded border border-slate-300 bg-white py-2 px-4 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
              <datalist id="vaccine_suggestions">
                <option value="Tricat (Feline Rhinotracheitis, Calicivirus, Panleukopenia)" />
                <option value="Tetracat (Tricat + Chlamydia)" />
                <option value="Rabies Vet" />
                <option value="Eurican 4" />
                <option value="Eurican 6" />
                <option value="Felocell 3" />
              </datalist>
            </div>

            {/* Nomor Batch (Input Teks) */}
            <div>
              <label className="mb-2.5 block font-medium text-slate-800">
                Nomor Batch <span className="text-xs text-slate-400 font-normal">(batch_number)</span>
              </label>
              <input
                type="text"
                name="batch_number"
                required
                placeholder="Masukkan nomor batch produksi vial vaksin (contoh: B9042A)..."
                value={formData.batch_number}
                onChange={handleChange}
                className="w-full rounded border border-slate-300 bg-white py-2 px-4 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Tanggal Vaksin Berikutnya (Date Picker) */}
            <div>
              <label className="mb-2.5 block font-medium text-slate-800">
                Tanggal Vaksin Berikutnya <span className="text-xs text-slate-400 font-normal">(next_due_date)</span>
              </label>
              <input
                type="date"
                name="next_due_date"
                required
                value={formData.next_due_date}
                onChange={handleChange}
                className="w-full rounded border border-slate-300 bg-white py-2 px-4 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Tombol Simpan */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || (!formData.pet_id && !activeVaccination)}
                className="inline-flex items-center justify-center gap-2 rounded bg-emerald-600 px-10 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan Buku Vaksin...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Simpan Buku Vaksin
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

export default VaccinationBook;