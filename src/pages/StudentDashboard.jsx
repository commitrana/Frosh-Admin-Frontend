import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const [student, setStudent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if student is logged in
    const token = localStorage.getItem('studentToken');
    const studentData = localStorage.getItem('studentData');
    
    if (!token || !studentData) {
      navigate('/student/login');
      return;
    }
    
    setStudent(JSON.parse(studentData));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentData');
    navigate('/student/login');
  };

  if (!student) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>👨‍🎓 Student Dashboard</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      <div style={styles.card}>
        <h2>Welcome, {student.name}! 🎉</h2>
        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <strong>Email:</strong> {student.email}
          </div>
          <div style={styles.infoItem}>
            <strong>Branch:</strong> {student.branch}
          </div>
          <div style={styles.infoItem}>
            <strong>Roll No:</strong> {student.rollNo}
          </div>
          <div style={styles.infoItem}>
            <strong>Phone:</strong> {student.phoneNo}
          </div>
          <div style={styles.infoItem}>
            <strong>Father:</strong> {student.fatherName}
          </div>
          <div style={styles.infoItem}>
            <strong>Mother:</strong> {student.motherName}
          </div>
          <div style={styles.infoItem}>
            <strong>DOB:</strong> {new Date(student.dob).toLocaleDateString()}
          </div>
          <div style={styles.infoItem}>
            <strong>Slot:</strong> {student.slotNumber}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '1px solid #eee',
  },
  title: {
    margin: 0,
    color: '#2c3e50',
  },
  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  card: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginTop: '20px',
  },
  infoItem: {
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '5px',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
  },
};

export default StudentDashboard;