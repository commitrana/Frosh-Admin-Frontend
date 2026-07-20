import axios from 'axios';

const API_URL = 'https://frosh-app-backend.onrender.com/api';
export const SERVER_URL = API_URL.replace('/api', '');

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Verify a member (admin)
export const verifyMember = async (memberId, verifiedBy = 'Admin') => {
  const token = localStorage.getItem('adminToken');
  const response = await axios.post(`${API_URL}/admin/verify-member/${memberId}`,
    { verifiedBy },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Decline a member (admin)
export const declineMember = async (memberId) => {
  const token = localStorage.getItem('adminToken');
  const response = await axios.post(`${API_URL}/admin/decline-member/${memberId}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// ============ ADMIN AUTH ============

export const adminLogin = async (username, password) => {
  const response = await api.post('/admin/login', { username, password });
  if (response.data.token) {
    localStorage.setItem('adminToken', response.data.token);
    localStorage.setItem('adminData', JSON.stringify(response.data.admin));
  }
  return response.data;
};

export const isAdminLoggedIn = () => {
  return !!localStorage.getItem('adminToken');
};

export const adminLogout = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminData');
};

export const getAdminData = () => {
  const data = localStorage.getItem('adminData');
  return data ? JSON.parse(data) : null;
};

// ============ SOCIETY MANAGEMENT ============

export const getSocieties = async () => {
  const response = await api.get('/admin/societies');
  return response.data;
};

export const createSociety = async (societyData) => {
  const response = await api.post('/admin/create-society', societyData);
  return response.data;
};

export const deleteSociety = async (id) => {
  const response = await api.delete(`/admin/delete-society/${id}`);
  return response.data;
};

export const updateSocietyPassword = async (id, password) => {
  const response = await api.put(`/admin/update-password/${id}`, { password });
  return response.data;
};

export const getSocietyMembers = async (societyId) => {
  try {
    const response = await api.get(`/admin/society-members/${societyId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching society members:', error.response?.data || error.message);
    throw error;
  }
};

export const getMemberById = async (memberId) => {
  try {
    const response = await api.get(`/admin/member/${memberId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching member:', error.response?.data || error.message);
    throw error;
  }
};

// ============ STUDENT MANAGEMENT ============

export const getStudents = async (page = 1, limit = 10, search = '', sortBy = 'name', sortOrder = 'asc') => {
  try {
    const response = await api.get('/admin/students', {
      params: { page, limit, search, sortBy, sortOrder }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching students:', error.response?.data || error.message);
    throw error;
  }
};

export const generateAllPasswords = async () => {
  try {
    const response = await api.post('/admin/students/generate-all-passwords');
    return response.data;
  } catch (error) {
    console.error('❌ Error generating all passwords:', error.response?.data || error.message);
    throw error;
  }
};

export const createStudent = async (studentData) => {
  try {
    const response = await api.post('/admin/students/create', studentData);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating student:', error.response?.data || error.message);
    throw error;
  }
};

export const getAllStudents = async () => {
  try {
    const response = await api.get('/admin/students/all');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching all students:', error.response?.data || error.message);
    throw error;
  }
};

export const updateStudent = async (studentId, data) => {
  try {
    const response = await api.put(`/admin/students/${studentId}`, data);
    return response.data;
  } catch (error) {
    console.error('❌ Error updating student:', error.response?.data || error.message);
    throw error;
  }
};

export const bulkUpdateStudents = async (studentIds, data) => {
  try {
    const response = await api.put('/admin/students/bulk', { studentIds, ...data });
    return response.data;
  } catch (error) {
    console.error('❌ Error bulk updating students:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteStudent = async (studentId) => {
  try {
    const response = await api.delete(`/admin/students/${studentId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error deleting student:', error.response?.data || error.message);
    throw error;
  }
};

export const bulkDeleteStudents = async (studentIds) => {
  try {
    const response = await api.delete('/admin/students/bulk', {
      data: { studentIds }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error bulk deleting students:', error.response?.data || error.message);
    throw error;
  }
};

export const exportStudents = async () => {
  try {
    const response = await api.get('/admin/students/export', {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error exporting students:', error.response?.data || error.message);
    throw error;
  }
};

export const importStudents = async (students) => {
  try {
    const response = await api.post('/admin/students/import', { students });
    return response.data;
  } catch (error) {
    console.error('❌ Error importing students:', error.response?.data || error.message);
    throw error;
  }
};

export const generateStudentPassword = async (studentId) => {
  try {
    const response = await api.post(`/admin/students/generate-password/${studentId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error generating password:', error.response?.data || error.message);
    throw error;
  }
};

// ============ EVENT MANAGEMENT ============

export const getEvents = async () => {
  try {
    const response = await api.get('/events/admin/all');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching events:', error.response?.data || error.message);
    throw error;
  }
};

export const createEvent = async (eventData) => {
  try {
    const response = await api.post('/events/admin/create', eventData);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating event:', error.response?.data || error.message);
    throw error;
  }
};

export const updateEvent = async (eventId, eventData) => {
  try {
    const response = await api.put(`/events/admin/${eventId}`, eventData);
    return response.data;
  } catch (error) {
    console.error('❌ Error updating event:', error.response?.data || error.message);
    throw error;
  }
};

export const updateEventStatus = async (eventId, status) => {
  try {
    const response = await api.put(`/events/admin/${eventId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('❌ Error updating event status:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteEvent = async (eventId) => {
  try {
    const response = await api.delete(`/events/admin/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error deleting event:', error.response?.data || error.message);
    throw error;
  }
};

export const uploadEventImage = async (eventId, file) => {
  const token = localStorage.getItem('adminToken');
  const formData = new FormData();
  formData.append('image', file);

  const response = await axios.post(
    `${API_URL}/events/admin/${eventId}/upload-image`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        // Do NOT set 'Content-Type': 'multipart/form-data' manually here —
        // that string is missing the required boundary parameter, which
        // silently breaks multer's parsing on the backend (req.file ends
        // up undefined). Leaving Content-Type unset lets the browser add
        // the header itself, WITH the correct boundary, automatically.
      },
    }
  );
  return response.data;
};

// ============ TICKETING (ADMIN) ============

export const scanTicket = async (qrToken) => {
  try {
    const response = await api.post('/tickets/scan', { qrToken });
    return response.data;
  } catch (error) {
    console.error('❌ Error scanning ticket:', error.response?.data || error.message);
    throw error;
  }
};

export const getTicketStats = async (eventId) => {
  try {
    const response = await api.get(`/tickets/stats/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching ticket stats:', error.response?.data || error.message);
    throw error;
  }
};

export const getEventRegistrations = async (eventId) => {
  try {
    const response = await api.get(`/tickets/event/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching event registrations:', error.response?.data || error.message);
    throw error;
  }
};

// ============ BOOTCAMP ============

export const getBootcampList = async () => {
  try {
    const response = await api.get('/bootcamp/admin/list');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching bootcamp list:', error.response?.data || error.message);
    throw error;
  }
};

export const importBootcampCSV = async (students) => {
  try {
    const response = await api.post('/bootcamp/admin/import', { students });
    return response.data;
  } catch (error) {
    console.error('❌ Error importing bootcamp CSV:', error.response?.data || error.message);
    throw error;
  }
};

export const shuffleBootcampBatches = async () => {
  try {
    const response = await api.post('/bootcamp/admin/shuffle');
    return response.data;
  } catch (error) {
    console.error('❌ Error shuffling batches:', error.response?.data || error.message);
    throw error;
  }
};

export const updateStudentBatch = async (id, batch) => {
  try {
    const response = await api.put(`/bootcamp/admin/${id}`, { batch });
    return response.data;
  } catch (error) {
    console.error('❌ Error updating batch:', error.response?.data || error.message);
    throw error;
  }
};

// ============ TEAM PHOTOS (Images tab) ============

// Add/upload a team member — expects a FormData with:
// category, name, branch?/designation? (depending on category), image (file)
export const uploadTeamMember = async (formData) => {
  const token = localStorage.getItem('adminToken');
  const response = await axios.post(`${API_URL}/admin/team/upload`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      // Same reasoning as uploadEventImage above — leave Content-Type unset
      // so the browser sets it with the correct multipart boundary.
    },
  });
  return response.data;
};

// Public — returns { faculty: [...], osc: [...], core: [...], mentor: [...] }
export const getTeamMembers = async () => {
  try {
    const response = await api.get('/team');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching team members:', error.response?.data || error.message);
    throw error;
  }
};

export const updateTeamMember = async (id, data) => {
  try {
    const response = await api.put(`/admin/team/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('❌ Error updating team member:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteTeamMember = async (id) => {
  try {
    const response = await api.delete(`/admin/team/${id}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error deleting team member:', error.response?.data || error.message);
    throw error;
  }
};

// ============ EXPORT DEFAULT ============

export default api;