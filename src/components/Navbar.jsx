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

  const navItems = [
    { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/admin/students', icon: '👨‍🎓', label: 'Students' },
    { path: '/admin/events', icon: '🎉', label: 'Events' },
    { path: '/admin/bootcamp', icon: '🏕️', label: 'Bootcamp' },
    { path: '/admin/faculty', icon: '👨‍🏫', label: 'Faculty' },
    { path: '/admin/batches', icon: '📚', label: 'Batches' },
  ];

  return (
    <nav style={styles.navbar}>
      <div style={styles.navContainer}>
        <div style={styles.navBrand}>
          <div style={styles.logoWrapper}>
            <span style={styles.logoIcon}>🏛️</span>
          </div>
          <h2 style={styles.brandText}>
            Admin<span style={styles.brandHighlight}>Panel</span>
          </h2>
        </div>
        
        <div style={styles.navLinks}>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                ...styles.navLink,
                ...(isActive(item.path) ? styles.activeLink : {})
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div style={styles.navRight}>
          <div style={styles.adminInfo}>
            <span style={styles.adminAvatar}>👤</span>
            <span style={styles.adminName}>{admin?.username || 'Admin'}</span>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <span style={styles.logoutIcon}>🚪</span>
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Menu Toggle - Optional */}
      <style>{`
        @media (max-width: 1024px) {
          .nav-links {
            display: none;
          }
          .nav-right {
            gap: 10px;
          }
          .admin-name {
            display: none;
          }
        }
        @media (max-width: 768px) {
          .brand-text {
            font-size: 18px !important;
          }
          .nav-link {
            padding: 8px 12px !important;
            font-size: 13px !important;
          }
          .nav-link span {
            margin-right: 4px;
          }
          .logout-btn {
            padding: 6px 12px !important;
            font-size: 12px !important;
          }
          .logout-btn span {
            margin-right: 4px;
          }
        }
        .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
        }
        .logout-btn:hover {
          background-color: #DC2626;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }
        .logout-btn:active {
          transform: scale(0.95);
        }
        .nav-link:active {
          transform: scale(0.95);
        }
        .admin-info:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </nav>
  );
};

const styles = {
  navbar: {
    backgroundColor: 'rgba(31, 41, 55, 0.95)',
    backdropFilter: 'blur(10px)',
    color: 'white',
    padding: '0 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  navContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1400px',
    margin: '0 auto',
    height: '64px',
    gap: '16px'
  },
  navBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0
  },
  logoWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderRadius: '8px'
  },
  logoIcon: {
    fontSize: '20px'
  },
  brandText: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '700',
    color: 'white',
    letterSpacing: '-0.025em'
  },
  brandHighlight: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginLeft: '2px'
  },
  navLinks: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    overflowX: 'auto',
    padding: '0 8px'
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: 'rgba(255,255,255,0.7)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit'
  },
  navIcon: {
    fontSize: '16px'
  },
  activeLink: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    color: 'white',
    fontWeight: '600',
    boxShadow: '0 1px 3px rgba(102, 126, 234, 0.2)'
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0
  },
  adminInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    cursor: 'default'
  },
  adminAvatar: {
    fontSize: '18px'
  },
  adminName: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: '14px',
    fontWeight: '500'
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: '#EF4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
    fontFamily: 'inherit'
  },
  logoutIcon: {
    fontSize: '16px'
  }
};

export default Navbar;