import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import { getPets, getServices, createAppointment, getAvailableSessions } from '../../../services/ownerService';
import { showSuccess, showConfirm } from '../../../utils/alertUtils';

const AppointmentForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const OWNER_ID = storedUser.id || 1;

    const [formData, setFormData] = useState({
        pet_id: '',
        service_id: '',
        booking_type: 'Online',
        schedule_date: '',
        schedule_time: '',
        initial_complaint: '',
    });

    const [petsData, setPetsData] = useState([]);
    const [servicesData, setServicesData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [availableTimes, setAvailableTimes] = useState([]);
    const [isLoadingTimes, setIsLoadingTimes] = useState(false);

    // Handles flat array, { data: [] }, or paginated { data: { data: [] } }
    const extractArray = (res) => {
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.data?.data)) return res.data.data;
        return [];
    };

    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                setIsLoading(true);

                // Fetch pets for logged in owner
                let petsArray = [];
                try {
                    const res = await getPets({ owner_id: OWNER_ID });
                    petsArray = extractArray(res);
                } catch (e) {
                    console.warn('Gagal memuat pets:', e?.response?.status);
                }
                setPetsData(petsArray);

                // Fetch services
                try {
                    const res = await getServices();
                    setServicesData(extractArray(res));
                } catch (e) {
                    console.warn('Gagal memuat services:', e?.response?.status);
                }

            } catch (error) {
                console.error('Gagal memuat data dropdown:', error);
                setErrorMessage('Gagal memuat data. Silakan refresh halaman.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDropdownData();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        if (formData.schedule_date && formData.service_id) {
            const fetchTimes = async () => {
                setIsLoadingTimes(true);
                setAvailableTimes([]);
                setFormData(prev => ({ ...prev, schedule_time: '' }));
                try {
                    const res = await getAvailableSessions(formData.schedule_date, formData.service_id);
                    const timesArray = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
                    setAvailableTimes(timesArray);
                } catch (e) {
                    console.error("Gagal memuat jam tersedia", e);
                } finally {
                    setIsLoadingTimes(false);
                }
            };
            fetchTimes();
        } else {
            setAvailableTimes([]);
        }
    }, [formData.schedule_date, formData.service_id]);

    // Harga layanan yang dipilih
    const selectedService = servicesData.find(s => String(s.id) === String(formData.service_id)) ?? null;

    const formatRupiah = (number) => {
        if (number == null) return '-';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0
        }).format(number);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.initial_complaint) {
            const wordCount = formData.initial_complaint.trim().split(/\s+/).filter(word => word.length > 0).length;
            if (wordCount < 10 || wordCount > 200) {
                setErrorMessage('Keluhan awal minimal 10 kata dan maksimal 200 kata.');
                return;
            }
        }

        const isConfirmed = await showConfirm(
            'Konfirmasi Janji Temu',
            'Apakah Anda yakin ingin mengajukan janji temu ini?',
            'Ya, Ajukan'
        );

        if (!isConfirmed) return;

        setIsSubmitting(true);
        setErrorMessage('');

        try {
            const payload = {
                owner_id: OWNER_ID,
                pet_id: Number(formData.pet_id),
                service_id: Number(formData.service_id),
                booking_type: formData.booking_type,
                schedule_date: formData.schedule_date,
                schedule_time: formData.schedule_time,
                initial_complaint: formData.initial_complaint,
            };

            console.log('[AppointmentForm] Payload:', payload);

            const response = await createAppointment(payload);
            console.log('[AppointmentForm] Raw Response:', response);

            // Normalisasi: handle { owner_id: ... } atau { success, data: { owner_id: ... } }
            const appointmentData = response?.owner_id
                ? response
                : response?.data?.owner_id
                    ? response.data
                    : response?.data ?? response;

            console.log('[AppointmentForm] Appointment Data:', appointmentData);

            await showSuccess('Berhasil!', 'Janji temu berhasil diajukan.');
            navigate('/owner/booking/ticket', { state: { appointment: appointmentData } });
        } catch (error) {
            console.error('[AppointmentForm] Error:', error?.response ?? error);

            const errData = error?.response?.data;
            let msg = 'Terjadi kesalahan. Silakan coba lagi.';
            if (errData) {
                if (typeof errData === 'string') {
                    msg = errData;
                } else if (errData.message) {
                    msg = errData.message;
                } else if (errData.detail) {
                    msg = typeof errData.detail === 'string'
                        ? errData.detail
                        : JSON.stringify(errData.detail);
                } else if (errData.errors) {
                    // Laravel validation errors: { errors: { field: ["msg"] } }
                    msg = Object.entries(errData.errors)
                        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                        .join(' | ');
                } else {
                    msg = JSON.stringify(errData);
                }
            } else if (error?.message) {
                msg = error.message;
            }

            setErrorMessage(msg);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        {isEditMode ? 'Edit Data Janji Temu' : 'Buat Janji Temu'}
                    </h1>
                    <p className="mt-0.5 text-sm text-slate-500">
                        {isEditMode
                            ? 'Perbarui informasi janji temu Anda.'
                            : 'Buat janji temu untuk mengamankan jadwal Anda.'}
                    </p>
                </div>
            </div>

            {errorMessage && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 sm:p-8">
                        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">

                            {/* Pet */}
                            <div>
                                <label className="mb-2.5 block text-sm font-semibold text-slate-800">
                                    Pilih Pet <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="pet_id"
                                    value={formData.pet_id}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    className="w-full rounded-md border border-slate-300 bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-400"
                                    required
                                >
                                    <option value="" disabled>
                                        {isLoading ? 'Memuat data pets...' : petsData.length === 0 ? 'Tidak ada pet tersedia' : 'Pilih pet'}
                                    </option>
                                    {petsData.map((pet) => (
                                        <option key={pet.id} value={pet.id}>
                                            {pet.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Service */}
                            <div>
                                <label className="mb-2.5 block text-sm font-semibold text-slate-800">
                                    Layanan <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="service_id"
                                    value={formData.service_id}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    className="w-full rounded-md border border-slate-300 bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-400"
                                    required
                                >
                                    <option value="" disabled>
                                        {isLoading ? 'Memuat layanan...' : servicesData.length === 0 ? 'Tidak ada layanan tersedia' : 'Pilih layanan'}
                                    </option>
                                    {servicesData.map((service) => (
                                        <option key={service.id} value={service.id}>
                                            {service.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Harga Layanan (read-only, selalu muncul) */}
                            <div>
                                <label className="mb-2.5 block text-sm font-semibold text-slate-800">
                                    Harga Layanan
                                </label>
                                <div className="flex items-center w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-blue-700 cursor-not-allowed select-none">
                                    {selectedService ? formatRupiah(selectedService.price) : '-'}
                                </div>
                                <p className="mt-1 text-xs text-slate-400">
                                    {selectedService?.estimated_sessions ? `Estimasi waktu: ${selectedService.estimated_sessions} Sesi.` : 'Pilih layanan untuk melihat estimasi waktu.'}
                                </p>
                            </div>

                            {/* Booking Type */}
                            <div className="hidden">
                                <label className="mb-2.5 block text-sm font-semibold text-slate-800">
                                    Tipe Booking <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="booking_type"
                                    value={formData.booking_type}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-slate-300 bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                    required
                                >
                                    <option value="Online">Online</option>
                                    <option value="Walk-in">Walk-in</option>
                                </select>
                            </div>

                            {/* Schedule Date */}
                            <div>
                                <label className="mb-2.5 block text-sm font-semibold text-slate-800">
                                    Tanggal Jadwal <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="schedule_date"
                                    value={formData.schedule_date}
                                    onChange={handleChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full rounded-md border border-slate-300 bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                    required
                                />
                            </div>

                            {/* Schedule Time */}
                            <div>
                                <label className="mb-2.5 block text-sm font-semibold text-slate-800">
                                    Waktu Jadwal <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="schedule_time"
                                    value={formData.schedule_time}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-slate-300 bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-400"
                                    required
                                    disabled={!formData.schedule_date || !formData.service_id || isLoadingTimes}
                                >
                                    <option value="" disabled>
                                        {isLoadingTimes ? 'Memuat jadwal...' : (!(formData.schedule_date && formData.service_id) ? 'Pilih layanan & tanggal dulu' : 'Pilih Sesi')}
                                    </option>
                                    {availableTimes.length > 0 ? (
                                        availableTimes.map((item, idx) => (
                                            <option key={idx} value={typeof item === 'string' ? item : item.time}>
                                                {typeof item === 'string' ? `${item} WIB` : item.label}
                                            </option>
                                        ))
                                    ) : (
                                        formData.schedule_date && formData.service_id && !isLoadingTimes && (
                                            <option value="" disabled>Sesi penuh / tidak tersedia</option>
                                        )
                                    )}
                                </select>
                            </div>

                            {/* Initial Complaint */}
                            <div className="sm:col-span-2">
                                <label className="mb-2.5 block text-sm font-semibold text-slate-800">
                                    Keluhan Awal / Catatan <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="initial_complaint"
                                    value={formData.initial_complaint}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Contoh: Kucing saya muntah-muntah sejak pagi..."
                                    required
                                    className="w-full rounded-md border border-slate-300 bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                />
                            </div>

                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:px-8">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="rounded-md px-6 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-900"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || isLoading}
                            className="flex items-center gap-2 rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-70"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    {isEditMode ? 'Simpan Perubahan' : 'Ajukan Janji Temu'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AppointmentForm;