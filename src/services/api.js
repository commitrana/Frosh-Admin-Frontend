import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

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

// Admin Login
export const adminLogin = async (username, password) => {
  const response = await api.post('/admin/login', { username, password });
  if (response.data.token) {
    localStorage.setItem('adminToken', response.data.token);
    localStorage.setItem('adminData', JSON.stringify(response.data.admin));
  }
  return response.data;
};

// Check if admin is logged in
export const isAdminLoggedIn = () => {
  return !!localStorage.getItem('adminToken');
};

// Logout
export const adminLogout = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminData');
};

// Get admin data
export const getAdminData = () => {
  const data = localStorage.getItem('adminData');
  return data ? JSON.parse(data) : null;
};

// ============ SOCIETY MANAGEMENT ============

// Get all societies
export const getSocieties = async () => {
  const response = await api.get('/admin/societies');
  return response.data;
};

// Create society
export const createSociety = async (societyData) => {
  const response = await api.post('/admin/create-society', societyData);
  return response.data;
};

// Delete society
export const deleteSociety = async (id) => {
  const response = await api.delete(`/admin/delete-society/${id}`);
  return response.data;
};

// Update society password
export const updateSocietyPassword = async (id, password) => {
  const response = await api.put(`/admin/update-password/${id}`, { password });
  return response.data;
};

// Get members of a specific society (for admin)
export const getSocietyMembers = async (societyId) => {
  try {
    const response = await api.get(`/admin/society-members/${societyId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching society members:', error.response?.data || error.message);
    throw error;
  }
};

// Get member by ID (for QR scanning)
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

// Get all students with pagination and filtering
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
// Generate passwords for all students
export const generateAllPasswords = async () => {
  try {
    const response = await api.post('/admin/students/generate-all-passwords');
    return response.data;
  } catch (error) {
    console.error('❌ Error generating all passwords:', error.response?.data || error.message);
    throw error;
  }
};
// Create a single student
export const createStudent = async (studentData) => {
  try {
    const response = await api.post('/admin/students/create', studentData);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating student:', error.response?.data || error.message);
    throw error;
  }
};

// Get all students (no pagination - for export)

export const getAllStudents = async () => {
  try {
    const response = await api.get('/admin/students/all');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching all students:', error.response?.data || error.message);
    throw error;
  }
};

// Update a student
export const updateStudent = async (studentId, data) => {
  try {
    const response = await api.put(`/admin/students/${studentId}`, data);
    return response.data;
  } catch (error) {
    console.error('❌ Error updating student:', error.response?.data || error.message);
    throw error;
  }
};

// Bulk update students
export const bulkUpdateStudents = async (studentIds, data) => {
  try {
    const response = await api.put('/admin/students/bulk', { studentIds, ...data });
    return response.data;
  } catch (error) {
    console.error('❌ Error bulk updating students:', error.response?.data || error.message);
    throw error;
  }
};

// Delete a student
export const deleteStudent = async (studentId) => {
  try {
    const response = await api.delete(`/admin/students/${studentId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error deleting student:', error.response?.data || error.message);
    throw error;
  }
};

// Bulk delete students
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

// Export students as CSV
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

// Import students from CSV
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

// Get all events (admin table view)
export const getEvents = async () => {
  try {
    const response = await api.get('/events/admin/all');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching events:', error.response?.data || error.message);
    throw error;
  }
};

// Create a new event
export const createEvent = async (eventData) => {
  try {
    const response = await api.post('/events/admin/create', eventData);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating event:', error.response?.data || error.message);
    throw error;
  }
};

// Update event details (name, date, time, venue, club, status)
export const updateEvent = async (eventId, eventData) => {
  try {
    const response = await api.put(`/events/admin/${eventId}`, eventData);
    return response.data;
  } catch (error) {
    console.error('❌ Error updating event:', error.response?.data || error.message);
    throw error;
  }
};

// Update ONLY the event status (the live/upcoming/past toggle)
export const updateEventStatus = async (eventId, status) => {
  try {
    const response = await api.put(`/events/admin/${eventId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('❌ Error updating event status:', error.response?.data || error.message);
    throw error;
  }
};

// Delete an event
export const deleteEvent = async (eventId) => {
  try {
    const response = await api.delete(`/events/admin/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error deleting event:', error.response?.data || error.message);
    throw error;
  }
};

// ============ TICKETING (ADMIN) ============

// Scan a student's ticket QR code (marks it as used, once only)
export const scanTicket = async (qrToken) => {
  try {
    const response = await api.post('/tickets/scan', { qrToken });
    return response.data;
  } catch (error) {
    console.error('❌ Error scanning ticket:', error.response?.data || error.message);
    throw error;
  }
};

// Get ticket stats for an event: { totalTickets, issued, scanned }
export const getTicketStats = async (eventId) => {
  try {
    const response = await api.get(`/tickets/stats/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching ticket stats:', error.response?.data || error.message);
    throw error;
  }
};

// Get the full registration (ticket) list for an event
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

// Get the full bootcamp roster (each row includes a "verified" flag —
// whether that email also exists in the main Student list)
export const getBootcampList = async () => {
  try {
    const response = await api.get('/bootcamp/admin/list');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching bootcamp list:', error.response?.data || error.message);
    throw error;
  }
};

// Bulk import the bootcamp roster from a parsed CSV: [{ name, email, phoneNo, batch }]
export const importBootcampCSV = async (students) => {
  try {
    const response = await api.post('/bootcamp/admin/import', { students });
    return response.data;
  } catch (error) {
    console.error('❌ Error importing bootcamp CSV:', error.response?.data || error.message);
    throw error;
  }
};

// Randomly redistribute everyone currently in the roster across the 20 batches
export const shuffleBootcampBatches = async () => {
  try {
    const response = await api.post('/bootcamp/admin/shuffle');
    return response.data;
  } catch (error) {
    console.error('❌ Error shuffling batches:', error.response?.data || error.message);
    throw error;
  }
};

// Edit a single bootcamp student's batch assignment
export const updateStudentBatch = async (id, batch) => {
  try {
    const response = await api.put(`/bootcamp/admin/${id}`, { batch });
    return response.data;
  } catch (error) {
    console.error('❌ Error updating batch:', error.response?.data || error.message);
    throw error;
  }
};

// ============ EXPORT DEFAULT ============

export default api;