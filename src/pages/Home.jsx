import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const [status, setStatus] = useState('Checking connection...');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await axios.get('https://frosh-app-backend.onrender.com/api/test');
        setStatus(`✅ Backend is running: ${response.data.message}`);
      } catch (error) {
        setStatus('❌ Backend not running. Start the server with "npm run dev" in backend folder');
        console.error('Connection error:', error);
      }
    };
    checkConnection();
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🎓 Society Portal</h1>
      
      <div style={styles.statusCard}>
        <h3>Backend Status</h3>
        <p style={{ 
          color: status.includes('✅') ? 'green' : 'red',
          fontWeight: 'bold'
        }}>
          {status}
        </p>
      </div>

      <div style={styles.buttonContainer}>
        <Link to="/admin/login">
          <button style={{ ...styles.btn, backgroundColor: '#FF5722' }}>
            Admin Panel
          </button>
        </Link>
        
        
      </div>

      <p style={styles.footer}>
        Admin Credentials: <strong>admin</strong> / <strong>admin123</strong>
      </p>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '50px auto',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
    padding: '0 20px'
  },
  title: {
    fontSize: '48px',
    color: '#333',
    marginBottom: '30px'
  },
  statusCard: {
    backgroundColor: '#f5f5f5',
    padding: '20px',
    borderRadius: '10px',
    margin: '20px 0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  buttonContainer: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    marginTop: '30px',
    flexWrap: 'wrap'
  },
  btn: {
    padding: '14px 28px',
    fontSize: '16px',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    minWidth: '150px'
  },
  footer: {
    marginTop: '40px',
    color: '#666',
    fontSize: '14px'
  }
};

export default Home;