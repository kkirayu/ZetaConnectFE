import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Save, Loader2, Plus, Trash2, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { showSuccess, showError } from '../../utils/alertUtils';
import { useNavigate } from 'react-router-dom';

const DoctorSchedule = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [doctorId, setDoctorId] = useState(null);
    const [doctorData, setDoctorData] = useState(null);

    const [schedules, setSchedules] = useState([]);

    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const sessions = [
        { id: 'Sesi 1', time: '08:00 - 09:00' },
        { id: 'Sesi 2', time: '09:00 - 10:00' },
        { id: 'Sesi 3', time: '10:00 - 11:00' },
        { id: 'Sesi 4', time: '11:00 - 12:00' },
        { id: 'Sesi 5', time: '12:00 - 13:00' },
        { id: 'Sesi 6', time: '13:00 - 14:00' },
        { id: 'Sesi 7', time: '14:00 - 15:00' },
        { id: 'Sesi 8', time: '15:00 - 16:00' },
    ];

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        const fetchDoctorInfo = async () => {
            try {
                const response = await api.get('/doctors');
                const docs = response.data?.data || response.data;
                const me = docs.find(d => d.user_id === user.id);
                
                if (me) {
                    setDoctorId(me.doctor_id);
                    setDoctorData(me);
                    setSchedules(me.schedules || []);
                } else {
                    showError('Gagal', 'Profil dokter tidak ditemukan. Pastikan admin sudah mendaftarkan profil Anda.');
                }
            } catch (error) {
                console.error('Error fetching doctor info:', error);
                showError('Error', 'Gagal memuat jadwal dokter.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDoctorInfo();
    }, [user.id]);

    const handleAddSchedule = () => {
        setSchedules([...schedules, { hari_praktik: 'Senin', sesi_praktik: 'Sesi 1' }]);
    };

    const handleRemoveSchedule = (index) => {
        const newSchedules = [...schedules];
        newSchedules.splice(index, 1);
        setSchedules(newSchedules);
    };

    const handleChange = (index, field, value) => {
        const newSchedules = [...schedules];
        newSchedules[index][field] = value;
        setSchedules(newSchedules);
    };

    const handleSave = async () => {
        if (!doctorId) return;
        setIsSaving(true);
        try {
            const payload = {
                name: doctorData.name,
                user_id: doctorData.user_id,
                schedules: schedules.map(s => ({
                    hari_praktik: s.hari_praktik,
                    sesi_praktik: s.sesi_praktik
                }))
            };
            
            await api.put(`/doctors/${doctorId}`, payload);
            await showSuccess('Berhasil', 'Jadwal praktik berhasil diperbarui!');
        } catch (error) {
            console.error('Error saving schedule:', error);
            showError('Gagal', 'Gagal menyimpan jadwal praktik.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64 text-blue-500">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2 font-medium">Memuat Jadwal...</span>
            </div>
        );
    }

    if (!doctorId) {
        return (
            <div className="text-center py-10 bg-white rounded-lg border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800">Profil Dokter Belum Dibuat</h2>
                <p className="text-slate-500 mt-2">Silakan hubungi administrator untuk menghubungkan akun Anda dengan profil dokter.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Atur Jadwal Praktik</h1>
                    <p className="mt-0.5 text-sm text-slate-500">Sesuaikan hari dan sesi praktik Anda.</p>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            Daftar Sesi Praktik
                        </h2>
                        <button
                            onClick={handleAddSchedule}
                            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Tambah Sesi
                        </button>
                    </div>

                    {schedules.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                            <p className="text-slate-500 text-sm">Belum ada sesi praktik yang ditambahkan.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {schedules.map((schedule, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Hari</label>
                                        <select 
                                            value={schedule.hari_praktik} 
                                            onChange={(e) => handleChange(idx, 'hari_praktik', e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        >
                                            {days.map(day => (
                                                <option key={day} value={day}>{day}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Sesi / Jam</label>
                                        <select 
                                            value={schedule.sesi_praktik} 
                                            onChange={(e) => handleChange(idx, 'sesi_praktik', e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        >
                                            {sessions.map(s => (
                                                <option key={s.id} value={s.id}>{s.id} ({s.time})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="sm:mt-5 self-end sm:self-auto w-full sm:w-auto">
                                        <button 
                                            onClick={() => handleRemoveSchedule(idx)}
                                            className="w-full sm:w-auto flex justify-center items-center text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors"
                                            title="Hapus Sesi"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 border-t border-slate-200 p-6 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Simpan Jadwal
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DoctorSchedule;
