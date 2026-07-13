import React, { useState, useEffect } from 'react';
import { getMyAppointments } from '../../../services/ownerService';
import { Loader2, AlertCircle } from 'lucide-react';

const AppointmentHistory = () => {
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const ownerId = storedUser.id;
        
        const res = await getMyAppointments({ owner_id: ownerId });
        let data = [];
        if (Array.isArray(res)) data = res;
        else if (Array.isArray(res?.data)) data = res.data;
        else if (Array.isArray(res?.data?.data)) data = res.data.data;
        
        setHistoryData(data);
      } catch (err) {
        console.error('Error fetching appointment history:', err);
        setError('Gagal memuat riwayat janji temu');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Fungsi untuk menentukan warna badge berdasarkan status
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Menunggu': return 'bg-yellow-100 text-yellow-800';
      case 'Disetujui': return 'bg-blue-100 text-blue-800';
      case 'Dalam Periksa': return 'bg-purple-100 text-purple-800';
      case 'Selesai': return 'bg-green-100 text-green-800';
      case 'Batal': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Riwayat Janji Temu</h2>
        <p className="text-sm text-slate-500">Daftar riwayat reservasi layanan untuk hewan peliharaan Anda.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
              <th className="p-4 rounded-tl-lg">ID</th>
              <th className="p-4">Hewan Peliharaan</th>
              <th className="p-4">Layanan</th>
              <th className="p-4">Tanggal & Waktu</th>
              <th className="p-4 rounded-tr-lg">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" className="p-8 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" />
                  <p className="mt-2 text-sm text-slate-500">Memuat data...</p>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-red-500">
                  <AlertCircle className="mx-auto h-6 w-6 mb-2" />
                  {error}
                </td>
              </tr>
            ) : (
              historyData.map((item, index) => {
                const petName = item.pet?.name || `Pet #${item.pet_id}`;
                const serviceName = item.service?.name || item.initial_complaint || '-';
                const dateStr = item.schedule_date 
                  ? new Date(item.schedule_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '-';
                const timeStr = item.schedule_time ? item.schedule_time.substring(0, 5) : '-';
                
                return (
                  <tr 
                    key={item.id ?? index} 
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-200 text-sm text-slate-700"
                  >
                    <td className="p-4 font-medium text-slate-900">#{item.id ?? index}</td>
                    <td className="p-4">{petName}</td>
                    <td className="p-4">{serviceName}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{dateStr}</span>
                        <span className="text-xs text-slate-500">{timeStr} WIB</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span 
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* State Kosong jika tidak ada data */}
        {!isLoading && !error && historyData.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            Belum ada riwayat janji temu.
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentHistory;