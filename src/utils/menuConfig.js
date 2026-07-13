import {
  LayoutDashboard,
  Users,
  User,
  Box,
  FileText,
  Activity,
  Pill,
  Monitor,
  History,
  ClipboardList,
  FileSpreadsheet,
  FileCheck,
  ShieldAlert,
  Syringe,
  Settings,
  Calendar
} from 'lucide-react';

export const roleMenus = {
  admin: [
    { title: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { title: 'Manajemen Staf', path: '/admin/staff', icon: Users },
    { title: 'Manajemen Pelanggan', path: '/admin/customers', icon: User },
    { title: 'Audit Log Sistem', path: '/admin/audit-logs', icon: ClipboardList },
    { title: 'Layanan & Tarif', path: '/admin/services', icon: Box },
    { title: 'Laporan Klinik', path: '/admin/reports', icon: FileText },
    { title: 'Pengaturan', path: '/admin/settings', icon: Monitor },
  ],
  doctor: [
    { title: 'Dashboard', path: '/doctor', icon: LayoutDashboard },
    { title: 'Atur Jadwal Praktik', path: '/doctor/schedule', icon: Calendar },
    { title: 'Antrean Pasien', path: '/doctor/waiting-list', icon: Users },
    { title: 'Kamus Penyakit', path: '/doctor/diagnosis', icon: FileText },
    { title: 'Hasil Lab', path: '/doctor/lab-results', icon: Activity },
    { title: 'E-Resep', path: '/doctor/e-receipt', icon: Pill },
    { title: 'Surat Keterangan Medis', path: '/doctor/certificate', icon: FileSpreadsheet },
    { title: 'Laporan Operasi', path: '/doctor/surgery-report', icon: ShieldAlert },
    { title: 'Buku Vaksinasi', path: '/doctor/vaccination', icon: Syringe },
  ],
  owner: [
    { title: 'Dashboard', path: '/owner', icon: LayoutDashboard },
    { title: 'Profil Saya', path: '/owner/profile', icon: User },
    { title: 'Hewan Peliharaanku', path: '/owner/pets', icon: User },
    { title: 'Buat Janji Temu', path: '/owner/booking', icon: FileText },
    { title: 'Tiket Antrean', path: '/owner/booking/ticket', icon: Activity },
    { title: 'Riwayat Medis', path: '/owner/medical-history', icon: History },
    { title: 'Tagihan & Pembayaran', path: '/owner/billing', icon: Activity },
  ],
  pharmacy: [
    { title: 'Dashboard Apotek', path: '/pharmacy', icon: LayoutDashboard },
    { title: 'Antrean Resep', path: '/pharmacy/prescriptions', icon: ClipboardList },
    { title: 'Katalog Obat', path: '/pharmacy/inventory', icon: Pill },
    { title: 'Monitoring Stok', path: '/pharmacy/inventory/monitoring', icon: FileCheck },
    { title: 'Mutasi Stok', path: '/pharmacy/stock-mutations', icon: Activity },
    { title: 'Restock Barang', path: '/pharmacy/restock', icon: Box },
    { title: 'Data Supplier', path: '/pharmacy/supplier', icon: Users },
  ],
  cashier: [
    { title: 'Dashboard Kasir', path: '/cashier', icon: LayoutDashboard },
    { title: 'Antrean Pembayaran', path: '/cashier/queue', icon: Users },
    { title: 'Shift Closing', path: '/cashier/closing', icon: FileText },
  ],
  receptionist: [
    { title: 'List Pasien', path: '/receptionist', icon: Users },
    { title: 'Riwayat Selesai', path: '/receptionist/history', icon: History },
    { title: 'Monitor', path: '/receptionist/queue-monitor', icon: Monitor },
  ]
};