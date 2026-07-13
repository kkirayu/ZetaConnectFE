import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AdminLayout from '../layouts/AdminLayout';
import MainLayout from '../layouts/MainLayouts';
import Feedback from '../layouts/Feedback';
import InfoLayanan from '../layouts/ServiceInfo';
import TermsAndConditions from '../layouts/TermsAndConditions';
import PrivacyPolicy from '../layouts/PrivacyPolicy';
import Register from '../pages/auth/Register';
import Login from '../pages/auth/Login';
import OTPVerification from '../pages/auth/OTPVerification';
import ForgotPassword from '../pages/auth/ForgotPassword';
import AuthCallback from '../pages/auth/AuthCallback';
import ProtectedRoute from '../components/ProtectedRoute';

import AdminDashboard from '../pages/admin/Dashboard';
import StaffList from '../pages/admin/StaffManagement/StaffList';
import StaffForm from '../pages/admin/StaffManagement/StaffForm';
import ClinicSettings from '../pages/admin/ClinicSettings';
import ServiceRatesList from '../pages/admin/ServiceRates/ServiceRatesList';
import ServiceRatesForm from '../pages/admin/ServiceRates/ServiceRatesForm';
import CustomerManagement from '../pages/admin/CustomerManagement';
import AuditLog from '../pages/admin/AuditLog';

import FinancialReport from '../pages/admin/Reports/FinancialReport';
import VisitDemographics from '../pages/admin/Reports/VisitDemographics';
import TransactionLog from '../pages/admin/Reports/TransactionLog';
import InvoiceDetail from '../pages/admin/Reports/InvoiceDetail';
import StockMutationReport from '../pages/admin/Reports/StockMutationReport';
import ReportOverview from '../pages/admin/Reports/ReportOverview';

import OwnerDashboard from '../pages/owner/Dashboard';
import OwnerProfile from '../pages/owner/OwnerProfile';
import PetList from '../pages/owner/MyPets/PetList';
import PetForm from '../pages/owner/MyPets/PetForm';
import PetDetail from '../pages/owner/MyPets/PetDetail';
import MedicalHistory from '../pages/owner/MedicalHistory';
import AppointmentForm from '../pages/owner/Booking/AppointmentForm';
import AppointmentHistory from '../pages/owner/Booking/AppointmentHistory';
import QueueTicket from '../pages/owner/Booking/QueueTicket';
import Billing from '../pages/owner/Billing';

import DoctorDashboard from '../pages/doctor/Dashboard';
import DoctorSchedule from '../pages/doctor/Schedule';
import WaitingList from '../pages/doctor/WaitingList';
import DiagnosisReferenceList from '../pages/doctor/MasterData/DiagnosisReference';
import DiagnosisReferenceForm from '../pages/doctor/MasterData/DiagnosisReferenceForm';
import LabResultUpload from '../pages/doctor/MedicalRecord/LabResultUpload';
import PatientMedicalProfile from '../pages/doctor/MedicalRecord/PatientMedicalProfile';
import SOAPForm from '../pages/doctor/MedicalRecord/SOAPForm';
import EReceiptForm from '../pages/doctor/MedicalRecord/EReceiptForm';
import MedicalCertificate from '../pages/doctor/MedicalRecord/MedicalCertificate';
import SurgeryReport from '../pages/doctor/MedicalRecord/SurgeryReport';
import VaccinationBook from '../pages/doctor/MedicalRecord/VaccinationBook';

import PharmacyDashboard from '../pages/pharmacy-cashier/Dashboard';
import ProductCatalog from '../pages/pharmacy-cashier/Inventory/ProductCatalog';
import FormTambahProduct from '../pages/pharmacy-cashier/Inventory/FormTambahProduct';
import FormRestockBarang from '../pages/pharmacy-cashier/Inventory/RestockForm';
import StockMonitoring from '../pages/pharmacy-cashier/Inventory/StockMonitoring';
import SupplierList from '../pages/pharmacy-cashier/Supplier/SupplierList';
import PrescriptionQueue from '../pages/pharmacy-cashier/PrescriptionQueue';
import StockMutations from '../pages/pharmacy-cashier/Inventory/StockMutations';

import CashierDashboard from '../pages/pharmacy-cashier/Cashier/CashierDashboard';
import BillingQueue from '../pages/pharmacy-cashier/Cashier/BillingQueue';
import CheckoutPOS from '../pages/pharmacy-cashier/Cashier/CheckoutPOS';
import InvoiceTemplate from '../pages/pharmacy-cashier/Cashier/InvoiceTemplate';
import ShiftClosing from '../pages/pharmacy-cashier/Cashier/ShiftClosing';
import NewTransaction from '../pages/pharmacy-cashier/Cashier/NewTransaction';
import LogTransaction from '../pages/pharmacy-cashier/Cashier/LogTransaction';

import ReceptionistDashboard from '../pages/receptionist/Dashboard';
import WalkInRegistration from '../pages/receptionist/WalkInRegistration';
import QueueMonitor from '../pages/receptionist/QueueMonitor';
import ReceptionistHistory from '../pages/receptionist/History';
import ApiDocs from '../pages/ApiDocs';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/api" element={<ApiDocs />} />
        <Route path="/" element={<MainLayout />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/info-layanan" element={<InfoLayanan />} />
        <Route path="/syarat-dan-ketentuan" element={<TermsAndConditions />} />
        <Route path="/kebijakan-privasi" element={<PrivacyPolicy />} />

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/otp-verification" element={<OTPVerification />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout userRole="admin" />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="staff" element={<StaffList />} />
          <Route path="staff/add" element={<StaffForm />} />
          <Route path="staff/edit/:id" element={<StaffForm />} />
          <Route path="customers" element={<CustomerManagement />} />
          <Route path="audit-logs" element={<AuditLog />} />
          <Route path="settings" element={<ClinicSettings />} />
          <Route path="services" element={<ServiceRatesList />} />
          <Route path="services/add" element={<ServiceRatesForm />} />
          <Route path="services/edit/:id" element={<ServiceRatesForm />} />

          <Route path="reports">
            <Route index element={<ReportOverview />} />
            <Route path="financial" element={<FinancialReport />} />
            <Route path="demographics" element={<VisitDemographics />} />
            <Route path="transactions" element={<TransactionLog />} />
            <Route path="invoice/:id" element={<InvoiceDetail />} />
            <Route path="stock-mutation" element={<StockMutationReport />} />
          </Route>
        </Route>

        <Route path="/owner" element={
          <ProtectedRoute allowedRoles={['owner', 'pemilik hewan']}>
            <AdminLayout userRole="owner" />
          </ProtectedRoute>
        }>
          <Route index element={<OwnerDashboard />} />
          <Route path="profile" element={<OwnerProfile />} />
          <Route path="pets" element={<PetList />} />
          <Route path="pets/add" element={<PetForm />} />
          <Route path="pets/edit/:id" element={<PetForm />} />
          <Route path="pets/detail/:id" element={<PetDetail />} />
          <Route path="booking" element={<AppointmentForm />} />
          <Route path="booking/history" element={<AppointmentHistory />} />
          <Route path="booking/ticket" element={<QueueTicket />} />
          <Route path="medical-history" element={<MedicalHistory />} />
          <Route path="billing" element={<Billing />} />
        </Route>

        <Route path="/doctor" element={<AdminLayout userRole="doctor" />}>
          <Route index element={<DoctorDashboard />} />
          <Route path="schedule" element={<DoctorSchedule />} />
          <Route path="waiting-list" element={<WaitingList />} />
          <Route path="soap" element={<SOAPForm />} />

          <Route path="diagnosis" element={<DiagnosisReferenceList />} />
          <Route path="diagnosis/add" element={<DiagnosisReferenceForm />} />
          <Route path="diagnosis/edit/:id" element={<DiagnosisReferenceForm />} />

          <Route path="lab-results" element={<LabResultUpload />} />
          <Route path="lab-results/add" element={<LabResultUpload />} />
          <Route path="patient-profile/:id" element={<PatientMedicalProfile />} />
          <Route path="e-receipt" element={<EReceiptForm />} />
          <Route path="certificate" element={<MedicalCertificate />} />
          <Route path="surgery-report" element={<SurgeryReport />} />
          <Route path="vaccination" element={<VaccinationBook />} />
        </Route>

        <Route path="/pharmacy" element={
          <ProtectedRoute allowedRoles={['farmasi', 'apoteker']}>
            <AdminLayout userRole="pharmacy" />
          </ProtectedRoute>
        }>
          <Route index element={<PharmacyDashboard />} />
          <Route path="prescriptions" element={<PrescriptionQueue />} />
          <Route path="inventory" element={<ProductCatalog />} />
          <Route path="inventory/add" element={<FormTambahProduct />} />
          <Route path="inventory/monitoring" element={<StockMonitoring />} />
          <Route path="restock" element={<FormRestockBarang />} />
          <Route path="supplier" element={<SupplierList />} />
          <Route path="stock-mutations" element={<StockMutations />} />
        </Route>

        <Route path="/cashier" element={
          <ProtectedRoute allowedRoles={['kasir']}>
            <AdminLayout userRole="cashier" />
          </ProtectedRoute>
        }>
          <Route index element={<CashierDashboard />} />
          <Route path="queue" element={<BillingQueue />} />
          <Route path="checkout" element={<CheckoutPOS />} />
          <Route path="invoice" element={<InvoiceTemplate />} />
          <Route path="closing" element={<ShiftClosing />} />
          <Route path="new-transaction" element={<NewTransaction />} />
          <Route path="log-transaction" element={<LogTransaction />} />
        </Route>

        <Route path="/receptionist" element={<AdminLayout userRole="receptionist" />}>
          <Route index element={<ReceptionistDashboard />} />
          <Route path="walk-in-registration" element={<WalkInRegistration />} />
          <Route path="queue-monitor" element={<QueueMonitor />} />
          <Route path="history" element={<ReceptionistHistory />} />
        </Route>

        <Route path="*" element={
          <div className="flex h-screen items-center justify-center bg-slate-50">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-slate-800">404</h1>
              <p className="text-slate-500">Halaman tidak ditemukan.</p>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
