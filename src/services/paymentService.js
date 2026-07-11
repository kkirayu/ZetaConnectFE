import api, { handleServiceError } from './api';

/**
 * Memproses pembayaran POS
 * @param {Object} paymentData - Data pembayaran
 */
export const processPayment = async (paymentData) => {
  try {
    const response = await api.post('/payments', paymentData);
    return response.data;
  } catch (error) {
    handleServiceError(error, 'Gagal memproses pembayaran.');
  }
};

/**
 * 
 * Membuat Invoice baru
 * @param {Object} invoiceData - Data invoice
 */
export const createInvoice = async (invoiceData) => {
  try {
    const response = await api.post('/invoices', invoiceData);
    return response.data;
  } catch (error) {
    handleServiceError(error, 'Gagal membuat invoice.');
  }
};

/**
 * Mengambil daftar invoice
 * @param {Object} params - Parameter query (page, status, date, dll)
 */
export const getInvoices = async (params = {}) => {
  try {
    const response = await api.get('/invoices', { params });
    return response.data;
  } catch (error) {
    handleServiceError(error, 'Gagal memuat daftar invoice.');
  }
};

/**
 * Mengambil daftar tagihan tertunda (Appointment Selesai yang belum ada invoice)
 */
export const getPendingBilling = async () => {
  try {
    const response = await api.get('/cashier/pending-billing');
    return response.data;
  } catch (error) {
    handleServiceError(error, 'Gagal memuat daftar tagihan tertunda.');
  }
};

/**
 * Mengambil detail invoice berdasarkan ID
 * @param {string} id - ID invoice
 */
export const getInvoiceById = async (id) => {
  try {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  } catch (error) {
    handleServiceError(error, 'Gagal memuat detail invoice.');
  }
};

/**
 * Memperbarui invoice (diskon, items, dll)
 * @param {string} id - ID invoice
 * @param {Object} data - Data pembaruan
 */
export const updateInvoice = async (id, data) => {
  try {
    const response = await api.put(`/invoices/${id}`, data);
    return response.data;
  } catch (error) {
    handleServiceError(error, 'Gagal memperbarui invoice.');
  }
};
