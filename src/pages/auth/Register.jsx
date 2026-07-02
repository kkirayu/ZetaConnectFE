// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Popup from '../../components/Popup';
import axios from 'axios';

const Register = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const [popup, setPopup] = useState({ isOpen: false, type: '', title: '', message: '', onConfirm: null });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone_number: '',
    role: 'Owner', 
    address: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.endsWith('@gmail.com')) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Gagal Mendaftar',
        message: 'Email harus berformat @gmail.com!',
        onConfirm: () => setPopup((prev) => ({ ...prev, isOpen: false }))
      });
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Gagal Mendaftar',
        message: 'Nama hanya boleh berisi huruf!',
        onConfirm: () => setPopup((prev) => ({ ...prev, isOpen: false }))
      });
      return;
    }

    if (!/^0\d{0,12}$/.test(formData.phone_number)) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Gagal Mendaftar',
        message: 'Nomor HP maksimal 13 digit angka dan harus dimulai dengan 0!',
        onConfirm: () => setPopup((prev) => ({ ...prev, isOpen: false }))
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Gagal Mendaftar',
        message: 'Kata sandi tidak cocok!',
        onConfirm: () => setPopup((prev) => ({ ...prev, isOpen: false }))
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone_number,
        role: formData.role,
        address: formData.address
      });
      
      const otpCode = response.data.otp_code; 
      console.log('OTP Code for testing:', otpCode);

      navigate('/otp-verification', { state: { email: formData.email } });
    } catch (error) {
      console.error(error);
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Pendaftaran Gagal',
        message: error.response?.data?.message || 'Terjadi kesalahan pada server.',
        onConfirm: () => setPopup((prev) => ({ ...prev, isOpen: false }))
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-600 flex flex-col">

      {/* Navbar */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled
            ? 'bg-white/90 backdrop-blur-md shadow-sm py-3'
            : 'bg-transparent py-5'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 cursor-pointer">
              <div className="bg-blue-600 text-white w-10 h-10 flex items-center justify-center rounded-xl">
                <i className="fa-solid fa-stethoscope text-xl"></i>
              </div>
              <span className="text-2xl font-bold text-blue-900">Zeta Connect</span>
            </Link>
            <Link to="/" className="text-slate-600 hover:text-blue-600 font-medium transition-colors flex items-center gap-2">
              <i className="fa-solid fa-arrow-left"></i> Kembali ke Beranda
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-32 pb-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-3xl w-full mx-auto">
          <div className="text-center mb-12">
            <span className="text-blue-600 font-bold tracking-wider uppercase text-sm mb-4 block">Pendaftaran Akun</span>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Bergabung dengan Zeta Connect</h1>
            <p className="text-slate-600 max-w-2xl mx-auto">Buat akun untuk mempermudah manajemen klinik atau pendaftaran layanan kesehatan untuk hewan peliharaan Anda.</p>
          </div>

          <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10"></div>
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Nama Lengkap */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Nama Lengkap</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <i className="fa-regular fa-user"></i>
                    </div>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => {
                        const lettersOnly = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                        setFormData({...formData, name: lettersOnly});
                      }}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                      placeholder="Masukkan nama lengkap Anda"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Email Valid</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <i className="fa-regular fa-envelope"></i>
                    </div>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                      placeholder="nama@email.com"
                    />
                  </div>
                </div>

                {/* Nomor HP */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-800 mb-2">Nomor HP</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <i className="fa-solid fa-phone"></i>
                    </div>
                    <input 
                      type="tel" 
                      required
                      value={formData.phone_number}
                      onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                      placeholder="Contoh: 08123456789"
                    />
                  </div>
                </div>

                {/* Alamat */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-800 mb-2">Alamat Lengkap</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 pt-3 flex items-start pointer-events-none text-slate-400">
                      <i className="fa-solid fa-location-dot mt-1"></i>
                    </div>
                    <textarea 
                      required
                      rows={3}
                      value={formData.address}
                      onChange={(e) => {
                        setFormData({...formData, address: e.target.value});
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all resize-none overflow-hidden min-h-[6rem]"
                      placeholder="Masukkan alamat lengkap..."
                    ></textarea>
                  </div>
                </div>

                {/* Kata Sandi */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Kata Sandi</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <i className="fa-solid fa-lock"></i>
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                      placeholder="Minimal 8 karakter"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-600 focus:outline-none transition-colors"
                    >
                      <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                {/* Konfirmasi Kata Sandi */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Konfirmasi Kata Sandi</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <i className="fa-solid fa-check-double"></i>
                    </div>
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      required
                      minLength={6}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className={`w-full pl-11 pr-12 py-3 bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 outline-none transition-all ${
                        formData.confirmPassword && formData.password !== formData.confirmPassword 
                          ? 'border-red-300 focus:ring-red-600/20 focus:border-red-500' 
                          : 'border-slate-200 focus:ring-blue-600/20 focus:border-blue-600'
                      }`}
                      placeholder="Ulangi kata sandi"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-600 focus:outline-none transition-colors"
                    >
                      <i className={`fa-regular ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1 font-medium">Kata sandi tidak cocok</p>
                  )}
                </div>
              </div>
              <div className="pt-2 md:pt-4">
                <button 
                  type="submit" 
                  disabled={isLoading || isGoogleLoading}
                  className={`w-full text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 ${isLoading || isGoogleLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {isLoading ? (
                    <><i className="fa-solid fa-spinner animate-spin"></i> Memproses...</>
                  ) : (
                    <><i className="fa-solid fa-user-plus"></i> Daftar Sekarang</>
                  )}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-500">Atau daftar dengan</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    setIsGoogleLoading(true);
                    try {
                      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://zeta-connect-api.vercel.app/api';
                      const res = await axios.get(`${apiUrl}/auth/google`);
                      if (res.data.url) {
                        window.location.href = res.data.url;
                      }
                    } catch (e) {
                      setIsGoogleLoading(false);
                      setPopup({
                        isOpen: true,
                        type: 'error',
                        title: 'Gagal',
                        message: 'Pendaftaran dengan Google sedang tidak tersedia.',
                        onConfirm: () => setPopup((prev) => ({ ...prev, isOpen: false }))
                      });
                    }
                  }}
                  disabled={isLoading || isGoogleLoading}
                  className={`w-full bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-3 shadow-sm mb-4 ${isLoading || isGoogleLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-50'}`}
                >
                  {isGoogleLoading ? (
                    <><i className="fa-solid fa-spinner animate-spin text-slate-500"></i> Memproses...</>
                  ) : (
                    <><img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" /> Google</>
                  )}
                </button>
                <p className="text-center text-sm text-slate-500 mt-6">
                  Sudah punya akun? <Link to="/login" className="text-blue-600 font-bold hover:underline">Masuk di sini</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm mt-auto">
        <p>&copy; {new Date().getFullYear()} Zeta Connect. All rights reserved.</p>
      </footer>

      <Popup 
        isOpen={popup.isOpen}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={popup.onConfirm}
      />
    </div>
  );
};

export default Register;
