import api, { handleServiceError } from './api';

export const getCashierDashboardStats = async () => {
  try {
    const response = await api.get('/cashier/dashboard');
    return response.data;
  } catch (error) {
    handleServiceError(error, 'Gagal mengambil data dashboard kasir.');
  }
};

export const getShiftSummary = async () => {
  try {
    const response = await api.get('/cashier/shift/summary');
    return response.data;
  } catch (error) {
    handleServiceError(error, 'Gagal mengambil ringkasan shift kasir.');
  }
};

export const closeShift = async (payload) => {
  try {
    const response = await api.post('/cashier/shift/close', payload);
    return response.data;
  } catch (error) {
    handleServiceError(error, 'Gagal menutup shift kasir.');
  }
};
