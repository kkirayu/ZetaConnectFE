import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Box, Search, LogOut, ChevronDown } from 'lucide-react'; 

import { roleMenus } from '../utils/menuConfig'; 

const AdminLayout = ({ userRole = 'admin' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const currentMenus = roleMenus[userRole] || [];

  const bestMatch = currentMenus.reduce((best, menu) => {
    if (location.pathname === menu.path || location.pathname.startsWith(`${menu.path}/`)) {
      if (!best || menu.path.length > best.path.length) {
        return menu;
      }
    }
    return best;
  }, null);

  const isActive = (path) => bestMatch && bestMatch.path === path;

  const displayNames = {
    admin: 'Admin Sistem',
    doctor: 'Drh. Bunga',
    owner: 'Cita Nurcahyani',
    pharmacy: 'Apoteker',
    cashier: 'Kasir',
    receptionist: 'Resepsionis'
  };

  const [userData, setUserData] = useState(() => {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch(e) {
      return null;
    }
  });

  useEffect(() => {
    const handleUserUpdate = () => {
      const userStr = localStorage.getItem('user');
      try {
        setUserData(userStr ? JSON.parse(userStr) : null);
      } catch(e) {
        setUserData(null);
      }
    };

    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, []);

  const currentName = userData?.name || displayNames[userRole] || 'User';
  const displayRole = userData?.role || userRole;

  const getAvatarUrl = () => {
    if (userData?.photo) {
      if (userData.photo.startsWith('http')) return userData.photo;
      const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
      return `${baseUrl}/${userData.photo}`;
    }
    return `https://ui-avatars.com/api/?name=${currentName.split(' ').join('+')}&background=3b82f6&color=fff&bold=true`;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F1F5F9] font-sans text-slate-600">
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#1C2434] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-6">
          <Link to={`/${userRole}`} className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-blue-600">
              <Box className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">Zeta Connect</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white lg:hidden">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Menu List */}
        <div className="no-scrollbar mt-4 flex flex-col overflow-y-auto px-4 py-4 lg:px-6">
          <h3 className="mb-4 ml-4 text-xs font-semibold uppercase tracking-widest text-[#8A99AF]">MENU UTAMA</h3>
          <ul className="mb-6 flex flex-col gap-1.5">
            
            {currentMenus.map((menu, index) => {
              const Icon = menu.icon;
              const isMenuSelected = isActive(menu.path);
              
              return (
                <li key={index}>
                  <Link 
                    to={menu.path} 
                    className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2.5 font-medium transition-all duration-300 ease-in-out hover:bg-[#333A48] hover:text-white ${
                      isMenuSelected ? 'bg-[#333A48] text-white' : 'text-[#DEE4EE]'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {menu.title}
                  </Link>
                </li>
              ); 
            })}
          </ul>
        </div>
      </aside>

      {/* ================== MAIN AREA ================== */}
      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        
        {/* Header */}
        <header className="sticky top-0 z-40 flex w-full border-b border-slate-200 bg-white shadow-sm">
          <div className="flex flex-grow items-center justify-between px-4 py-4 md:px-6 2xl:px-11">
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)} 
                className="flex items-center justify-center rounded-md border border-slate-200 bg-white p-1.5 shadow-sm lg:hidden"
              >
                <Menu className="h-5 w-5 text-black" />
              </button>
              
              <div className="hidden sm:block">
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="h-5 w-5" />
                  </span>
                  <input 
                    type="text" 
                    placeholder="Ketik untuk mencari..." 
                    className="w-72 bg-transparent pl-9 pr-4 text-sm font-medium outline-none xl:w-125" 
                  />
                </div>
              </div>
            </div>

            {/* Profil User */}
            <div className="flex items-center gap-4">
              <div className="hidden rounded bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-600 sm:block">
                Role: {displayRole}
              </div>
              <div className="relative">
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-3 border-l border-slate-200 pl-4 hover:opacity-80 transition-opacity"
                >
                  <div className="hidden text-right lg:block">
                    <p className="text-sm font-bold leading-tight text-black">{currentName}</p>
                    <p className="text-xs font-medium text-slate-500 capitalize">{displayRole}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full border border-slate-200 p-0.5 flex items-center justify-center overflow-hidden">
                    <img src={getAvatarUrl()} alt="User" className="h-full w-full rounded-full object-cover" />
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setProfileDropdownOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-3 w-48 rounded-xl border border-slate-200 bg-white py-2 shadow-lg z-50">
                      <button 
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Keluar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </header>

        {/* Konten Halaman */}
        <div className="flex flex-grow flex-col">
          <main className="w-full flex-grow p-4 md:p-6 2xl:p-10">
            <Outlet />
          </main>

          {/* Footer */}
          <footer className="w-full border-t border-slate-200 bg-white px-4 py-6 md:px-10">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-sm font-medium text-slate-500">
                &copy; {new Date().getFullYear()} <span className="font-bold text-slate-800">Zeta Connect</span>. All rights reserved.
              </p>
            </div>
          </footer>
        </div>

      </div>
    </div>
  );
};

export default AdminLayout;