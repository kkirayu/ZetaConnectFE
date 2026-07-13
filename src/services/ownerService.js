import api from './api';

// --- Owner / User Profile ---
export const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data; // { success: true, data: { ... } }
};

export const getOwnerProfile = async () => {
  const response = await api.get('/user');
  return response.data; // Returns user object directly or wrapped in data depending on backend
};

export const updateUser = async (id, userData) => {
  if (userData instanceof FormData) {
    userData.append('_method', 'PUT');
    const response = await api.post(`/users/${id}`, userData);
    return response.data;
  }
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

export const updateOwnerProfile = async (profileData) => {
  const response = await api.post('/user/profile', profileData);
  return response.data;
};

export const getPets = async (params = {}) => {
  const response = await api.get('/pets', { params });
  return response.data;
};

export const getPetById = async (id) => {
  const response = await api.get(`/pets/${id}`);
  return response.data;
};

export const getPetMedicalHistory = async (id) => {
  try {
    const response = await api.get('/medical-records', { params: { pet_id: id } });
    return response.data;
  } catch (error) {
    console.warn("Could not fetch medical records:", error);
    return { data: [] }; // Fallback if endpoint doesn't exist
  }
};

export const getAllMedicalHistory = async (ownerId) => {
  try {
    const response = await api.get('/medical-records', { params: { owner_id: ownerId } });
    return response.data;
  } catch (error) {
    console.warn("Could not fetch all medical records:", error);
    return { data: [] };
  }
};

export const createPet = async (petData) => {
  const response = await api.post('/pets', petData);
  return response.data;
};

export const updatePet = async (id, petData) => {
  if (petData instanceof FormData) {
    petData.append('_method', 'PUT');
    // Axios must set the Content-Type automatically for FormData to include the boundary
    const response = await api.post(`/pets/${id}`, petData);
    return response.data;
  }
  const response = await api.put(`/pets/${id}`, petData);
  return response.data;
};

export const deletePet = async (id) => {
  const response = await api.delete(`/pets/${id}`);
  return response.data;
};

export const getServices = async () => {
  const response = await api.get('/services');
  return response.data;
};

export const createAppointment = async (appointmentData) => {
  const response = await api.post('/appointments', appointmentData);
  return response.data;
};

export const getAvailableSessions = async (date) => {
  const response = await api.get('/available-sessions', { params: { date } });
  return response.data;
};

export const getMyAppointments = async (params = {}) => {
  const response = await api.get('/appointments', { params });
  return response.data;
};

export const getAppointmentById = async (id) => {
  const response = await api.get(`/appointments/${id}`);
  return response.data;
};

export const updateAppointment = async (id, appointmentData) => {
  const response = await api.put(`/appointments/${id}`, appointmentData);
  return response.data;
};

export const cancelAppointment = async (id) => {
  const response = await api.delete(`/appointments/${id}`);
  return response.data;
};
