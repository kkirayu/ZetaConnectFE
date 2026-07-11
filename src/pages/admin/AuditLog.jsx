import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, Loader2, Search, X, Eye } from 'lucide-react';
import api from '../../services/api';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('Semua Role');
  const [filterSeverity, setFilterSeverity] = useState('Semua Tingkat');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenDetail = (log) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const handleCloseDetail = () => {
    setSelectedLog(null);
    setIsModalOpen(false);
  };

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const response = await api.get('/audit-logs');
        setLogs(response.data.data);
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    // Hide owner activity from admin
    const isNotOwner = !log.role || log.role.toLowerCase() !== 'owner';
    if (!isNotOwner) return false;

    // Role filter
    if (filterRole !== 'Semua Role' && log.role.toLowerCase() !== filterRole.toLowerCase()) {
      return false;
    }

    // Severity filter
    if (filterSeverity !== 'Semua Tingkat' && log.severity.toLowerCase() !== filterSeverity.toLowerCase()) {
      return false;
    }

    // Date range filter
    if (startDate || endDate) {
      const datePart = log.timestamp.split(',')[0];
      const logDate = new Date(datePart);

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (logDate < start) return false;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (logDate > end) return false;
      }
    }

    // Search filter
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.action.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Audit Log Sistem</h1>
        <p className="text-sm text-slate-500 font-medium">Catatan riwayat aktivitas seluruh staf dan perubahan krusial pada sistem klinik.</p>
      </div>

      <div className="flex flex-col gap-4 border border-slate-200 rounded-sm p-4 bg-white shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-center">
          
          <div className="relative w-full lg:col-span-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="h-5 w-5" />
            </span>
            <input
              type="text"
              placeholder="Cari pelaku atau tindakan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded border border-slate-300 bg-transparent py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="lg:col-span-1">
            <select 
              value={filterRole} 
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full rounded border border-slate-300 bg-transparent py-2 px-3 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              <option value="Semua Role">Semua Role</option>
              <option value="Admin">Admin</option>
              <option value="Dokter">Dokter</option>
              <option value="Resepsionis">Resepsionis</option>
              <option value="Apoteker">Apoteker</option>
              <option value="Kasir">Kasir</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <select 
              value={filterSeverity} 
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full rounded border border-slate-300 bg-transparent py-2 px-3 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              <option value="Semua Tingkat">Semua Tingkat</option>
              <option value="Normal">Normal</option>
              <option value="Tinggi">Tinggi</option>
            </select>
          </div>

          <div className="flex gap-2 lg:col-span-2">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Tanggal Mulai"
              className="w-full rounded border border-slate-300 bg-transparent py-2 px-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
            <span className="self-center text-slate-500 text-sm">-</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="Tanggal Akhir"
              className="w-full rounded border border-slate-300 bg-transparent py-2 px-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      <div className="rounded-sm border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-2" />
              <p className="text-sm font-medium">Memuat log aktivitas...</p>
            </div>
          ) : (
            <table className="w-full table-auto text-left">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Pengguna</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Aktivitas / Tindakan</th>
                  <th className="px-6 py-4 text-center">Tingkat</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-600">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{log.timestamp}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {log.user}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {log.role}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          log.severity === 'Tinggi'
                            ? 'bg-rose-50 text-rose-700 border border-rose-100'
                            : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}>
                          <AlertCircle className="h-3 w-3" />
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleOpenDetail(log)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-400">
                      Log aktivitas tidak ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {isModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">Detail API Log</h2>
              <button onClick={handleCloseDetail} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase">Method</span>
                  <div className="mt-1 font-mono font-medium text-slate-800">
                    {selectedLog.method || selectedLog.api_method || '-'}
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase">Endpoint</span>
                  <div className="mt-1 font-mono text-blue-600 break-all">
                    {selectedLog.endpoint || selectedLog.api || selectedLog.url || '-'}
                  </div>
                </div>
              </div>
              
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase mb-2">Payload (Request)</span>
                <div className="bg-slate-50 p-3 rounded-md border border-slate-200 overflow-x-auto">
                  <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap">
                    {selectedLog.payload || selectedLog.request_body 
                      ? (typeof (selectedLog.payload || selectedLog.request_body) === 'object' 
                          ? JSON.stringify(selectedLog.payload || selectedLog.request_body, null, 2) 
                          : selectedLog.payload || selectedLog.request_body) 
                      : 'Tidak ada payload'}
                  </pre>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase mb-2">Respons</span>
                <div className="bg-slate-50 p-3 rounded-md border border-slate-200 overflow-x-auto">
                  <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap">
                    {selectedLog.response || selectedLog.api_response
                      ? (typeof (selectedLog.response || selectedLog.api_response) === 'object'
                          ? JSON.stringify(selectedLog.response || selectedLog.api_response, null, 2)
                          : selectedLog.response || selectedLog.api_response)
                      : 'Tidak ada respons'}
                  </pre>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button 
                onClick={handleCloseDetail}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors text-sm font-medium"
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

export default AuditLog;