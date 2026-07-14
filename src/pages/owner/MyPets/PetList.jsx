import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPets, deletePet } from '../../../services/ownerService';
import { showConfirm, showError } from '../../../utils/alertUtils';

const PetList = () => {
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const ownerId = storedUser.id || 1;

  const [petsData, setPetsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('');

  const fetchPets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getPets({ owner_id: ownerId });

      // API returns: { success, data: { current_page, data: [...] } }
      // Axios wraps response in res, so actual payload is res
      let pets = [];
      if (Array.isArray(res)) {
        pets = res;
      } else if (Array.isArray(res.data)) {
        pets = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        pets = res.data.data;  // paginated: { data: { data: [...] } }
      } else if (Array.isArray(res.data?.data?.data)) {
        pets = res.data.data.data;
      }

      // Filter hanya hewan milik user yang sedang login
      pets = pets.filter(p => 
        parseInt(p.owner_id) === parseInt(ownerId) || 
        (p.owner && parseInt(p.owner.id) === parseInt(ownerId))
      );

      setPetsData(pets);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data pets. Pastikan server berjalan.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const handleDelete = async (id, name) => {
    const isConfirmed = await showConfirm(
      'Hapus Pet?',
      `Apakah Anda yakin ingin menghapus pet ${name}?`,
      'Ya, Hapus',
      true
    );
    if (isConfirmed) {
      try {
        await deletePet(id);
        const updatedPets = petsData.filter(pet => pet.id !== id);
        setPetsData(updatedPets);
      } catch (err) {
        console.error(err);
        showError('Gagal', 'Gagal menghapus data pet. Silakan coba lagi.');
      }
    }
  };

  // Collect unique species from data for filter dropdown
  const speciesOptions = [...new Set(petsData.map(p => p.species).filter(Boolean))];

  const filteredPets = petsData.filter(pet => {
    const matchesSearch =
      (pet.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pet.breed ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecies = filterSpecies === '' || pet.species === filterSpecies;
    return matchesSearch && matchesSpecies;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Pets</h1>
          <p className="text-sm text-slate-500">Kelola Data Pets Anda</p>
        </div>

        <Link
          to="/owner/pets/add"
          className="inline-flex items-center justify-center gap-2 rounded bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-opacity-90 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Tambah Pets Baru
        </Link>
      </div>

      <div className="rounded-sm border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between bg-white">
          <div className="relative w-full max-w-md">
            <button className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama pet atau jenis..."
              className="w-full rounded border border-slate-300 bg-transparent py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <select
            value={filterSpecies}
            onChange={(e) => setFilterSpecies(e.target.value)}
            className="w-full rounded border border-slate-300 bg-transparent px-4 py-2 text-sm outline-none focus:border-blue-600 sm:w-auto"
          >
            <option value="">Semua Spesies</option>
            {speciesOptions.map(sp => (
              <option key={sp} value={sp}>{sp}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto text-left">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-100">
                <th className="px-6 py-4">Nama Pet</th>
                <th className="px-6 py-4">Species</th>
                <th className="px-6 py-4">Gender &amp; Lahir</th>
                <th className="px-6 py-4 text-center">Color</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center text-blue-500">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="mt-2 text-sm text-slate-500">Memuat data pets...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center">
                    <div className="flex flex-col items-center gap-2 text-red-500">
                      <AlertCircle className="h-8 w-8" />
                      <span className="text-sm">{error}</span>
                      <button
                        onClick={fetchPets}
                        className="mt-1 text-xs font-medium text-blue-600 underline hover:text-blue-800"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredPets.length > 0 ? (
                filteredPets.map((pet) => (
                  <tr key={pet.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{pet.name}</div>
                      {pet.distinctive_traits && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px]" title={pet.distinctive_traits}>
                          {pet.distinctive_traits}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700">{pet.breed}</span>
                      <div className="text-xs text-slate-400">{pet.species}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <span>{pet.gender}</span>
                        <span className="text-slate-300">|</span>
                        <span>{pet.dob ? pet.dob.split('T')[0] : '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600">
                      {pet.color}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/owner/pets/detail/${pet.id}`}
                          className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>

                        <Link
                          to={`/owner/pets/edit/${pet.id}`}
                          className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Data"
                        >
                          <Edit className="h-5 w-5" />
                        </Link>

                        <button
                          onClick={() => handleDelete(pet.id, pet.name)}
                          className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                          title="Hapus Data"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-500">
                    Tidak ada data yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 p-4 text-right text-xs font-medium text-slate-400">
          Total: {filteredPets.length} data pet.
        </div>
      </div>
    </div>
  );
};

export default PetList;