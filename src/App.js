import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import AdminQRScanner from './pages/AdminQRScanner';
import StudentList from './pages/StudentList';
import EventList from './pages/EventList';
import Bootcamp from './pages/Bootcamp';
import StudentLogin from './pages/StudentLogin';
import StudentDashboard from './pages/StudentDashboard';
import { isAdminLoggedIn } from './services/api';
import FacultyList from './pages/FacultyList';
import BatchList from './pages/BatchList';

// Protected Route for Admin
const ProtectedAdminRoute = ({ children }) => {
  if (!isAdminLoggedIn()) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

// Protected Route for Student
const ProtectedStudentRoute = ({ children }) => {
  const token = localStorage.getItem('studentToken');
  if (!token) {
    return <Navigate to="/student/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/student/login" element={<StudentLogin />} />
        
        {/* Admin Protected Routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedAdminRoute>
            <AdminDashboard />
          </ProtectedAdminRoute>
        } />
        <Route path="/admin/scanner" element={
          <ProtectedAdminRoute>
            <AdminQRScanner />
          </ProtectedAdminRoute>
        } />
        <Route path="/admin/students" element={
          <ProtectedAdminRoute>
            <StudentList />
          </ProtectedAdminRoute>
        } />
        <Route path="/admin/events" element={
          <ProtectedAdminRoute>
            <EventList />
          </ProtectedAdminRoute>
        } />
        <Route path="/admin/batches" element={
  <ProtectedAdminRoute>
    <BatchList />
  </ProtectedAdminRoute>
} />
        <Route path="/admin/bootcamp" element={
          <ProtectedAdminRoute>
            <Bootcamp />
          </ProtectedAdminRoute>
        } />
        <Route path="/admin/faculty" element={
  <ProtectedAdminRoute>
    <FacultyList />
  </ProtectedAdminRoute>
} />
        
        {/* Student Protected Routes */}
        <Route path="/student/dashboard" element={
          <ProtectedStudentRoute>
            <StudentDashboard />
          </ProtectedStudentRoute>
        } />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;