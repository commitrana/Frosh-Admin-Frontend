import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminLogout, getAdminData } from '../services/api';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const admin = getAdminData();

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.navbar}>
      <div style={styles.navContainer}>
        <div style={styles.navBrand}>
          <h2 style={styles.brandText}>🎓 Admin Panel</h2>
        </div>
        
        <div style={styles.navLinks}>
          <button
            onClick={() => navigate('/admin/dashboard')}
            style={{
              ...styles.navLink,
              ...(isActive('/admin/dashboard') ? styles.activeLink : {})
            }}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => navigate('/admin/students')}
            style={{
              ...styles.navLink,
              ...(isActive('/admin/students') ? styles.activeLink : {})
            }}
          >
            👨‍🎓 Student List
          </button>
          <button
            onClick={() => navigate('/admin/events')}
            style={{
              ...styles.navLink,
              ...(isActive('/admin/events') ? styles.activeLink : {})
            }}
          >
            🎉 Event List
          </button>
          <button
            onClick={() => navigate('/admin/bootcamp')}
            style={{
              ...styles.navLink,
              ...(isActive('/admin/bootcamp') ? styles.activeLink : {})
            }}
          >
            🏕️ Bootcamp
          </button>
        </div>
        <button
  onClick={() => navigate('/admin/faculty')}
  style={{
    ...styles.navLink,
    ...(isActive('/admin/faculty') ? styles.activeLink : {})
  }}
>
  👨‍🏫 Faculty
</button>
<button
  onClick={() => navigate('/admin/batches')}
  style={{
    ...styles.navLink,
    ...(isActive('/admin/batches') ? styles.activeLink : {})
  }}
>
  🏕️ Batches
</button>

        <div style={styles.navRight}>
          <span style={styles.adminName}>Welcome, {admin?.username || 'Admin'}!</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '0 20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  navContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1400px',
    margin: '0 auto',
    height: '70px',
  },
  navBrand: {
    display: 'flex',
    alignItems: 'center',
  },
  brandText: {
    margin: 0,
    fontSize: '22px',
    color: 'white',
  },
  navLinks: {
    display: 'flex',
    gap: '5px',
    alignItems: 'center',
  },
  navLink: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: 'rgba(255,255,255,0.8)',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.3s',
    fontWeight: '500',
  },
  activeLink: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: 'white',
    fontWeight: '600',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  adminName: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: '14px',
  },
  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background 0.3s',
  },
};

export default Navbar;