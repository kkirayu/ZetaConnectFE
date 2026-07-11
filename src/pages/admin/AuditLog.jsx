import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, Loader2, Search } from 'lucide-react';
import api from '../../services/api';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('Semua Role');
  const [filterSeverity, setFilterSeverity] = useState('Semua Tingkat');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
                  <th className="px-6 py-4">Endpoint API</th>
                  <th className="px-6 py-4">Respons</th>
                  <th className="px-6 py-4 text-center">Tingkat</th>
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
                      <td className="px-6 py-4 text-xs font-mono text-slate-500 max-w-[150px] truncate" title={log.endpoint || log.api || log.url || '-'}>
                        {log.endpoint || log.api || log.url || '-'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-[150px] truncate" title={typeof log.response === 'object' ? JSON.stringify(log.response) : log.response || '-'}>
                        {typeof log.response === 'object' ? JSON.stringify(log.response) : log.response || '-'}
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-slate-400">
                      Log aktivitas tidak ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLog;