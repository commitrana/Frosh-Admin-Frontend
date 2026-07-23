import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const [status, setStatus] = useState({
    message: 'Checking connection...',
    type: 'loading'
  });

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await axios.get('https://frosh-app-backend.onrender.com/api/test');
        setStatus({
          message: `Backend operational • ${response.data.message}`,
          type: 'success'
        });
      } catch (error) {
        setStatus({
          message: 'Backend connection failed',
          type: 'error'
        });
        console.error('Connection error:', error);
      }
    };
    checkConnection();
  }, []);

  const statusConfig = {
    loading: {
      icon: '⏳',
      color: '#6B7280'
    },
    success: {
      icon: '✅',
      color: '#10B981'
    },
    error: {
      icon: '❌',
      color: '#EF4444'
    }
  };

  const currentStatus = statusConfig[status.type] || statusConfig.loading;

  return (
    <div style={styles.container}>
      {/* Background Decoration */}
      <div style={styles.bgDecoration1} />
      <div style={styles.bgDecoration2} />
      
      {/* Main Content */}
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <span style={styles.logoIcon}>🏛️</span>
          </div>
          <h1 style={styles.title}>
            Admin
            <span style={styles.titleHighlight}>Portal</span>
          </h1>
          <p style={styles.subtitle}>
            Streamlined society management & administration
          </p>
        </div>

        {/* Action Buttons */}
        <div style={styles.buttonContainer}>
          <Link to="/admin/login" style={styles.link}>
            <button style={styles.primaryBtn}>
              <span style={styles.btnIcon}>🛡️</span>
              <span>Access Admin Panel</span>
              <span style={styles.btnArrow}>→</span>
            </button>
          </Link>
        </div>

        {/* Credentials */}
        <div style={styles.credentialsContainer}>
          <div style={styles.credentialsCard}>
            <span style={styles.credentialsLabel}>🔑 Demo Credentials</span>
            <div style={styles.credentialsText}>
              <code style={styles.code}>
                username: <strong>admin</strong> &nbsp;|&nbsp; password: <strong>admin123</strong>
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* System Status - Bottom Left */}
      <div style={styles.statusContainer}>
        <div style={styles.statusWrapper}>
          <span style={styles.statusIcon}>{currentStatus.icon}</span>
          <span style={{ 
            ...styles.statusText,
            color: currentStatus.color
          }}>
            {status.message}
          </span>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .status-loading {
          animation: spin 1s linear infinite;
        }
        .status-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        .primary-btn:hover .btn-arrow {
          transform: translateX(4px);
        }
        .primary-btn:active {
          transform: scale(0.98);
        }
        .status-wrapper:hover {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    position: 'relative',
    overflow: 'hidden',
    padding: '20px',
    margin: 0
  },
  bgDecoration1: {
    position: 'absolute',
    top: '-100px',
    right: '-100px',
    width: '500px',
    height: '500px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '50%',
    pointerEvents: 'none'
  },
  bgDecoration2: {
    position: 'absolute',
    bottom: '-150px',
    left: '-150px',
    width: '600px',
    height: '600px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '50%',
    pointerEvents: 'none'
  },
  content: {
    maxWidth: '500px',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    padding: '48px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    position: 'relative',
    zIndex: 10,
    animation: 'slideUp 0.6s ease-out'
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px'
  },
  logoWrapper: {
    display: 'inline-flex',
    padding: '16px',
    backgroundColor: '#EEF2FF',
    borderRadius: '16px',
    marginBottom: '16px',
    fontSize: '32px'
  },
  logoIcon: {
    fontSize: '32px'
  },
  title: {
    fontSize: '40px',
    fontWeight: '700',
    color: '#1F2937',
    margin: '0 0 8px 0',
    letterSpacing: '-0.025em'
  },
  titleHighlight: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginLeft: '8px'
  },
  subtitle: {
    fontSize: '16px',
    color: '#6B7280',
    margin: '0',
    fontWeight: '400'
  },
  buttonContainer: {
    textAlign: 'center',
    marginBottom: '24px'
  },
  link: {
    textDecoration: 'none'
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)',
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  btnIcon: {
    fontSize: '20px'
  },
  btnArrow: {
    fontSize: '18px',
    transition: 'transform 0.2s ease'
  },
  credentialsContainer: {
    animation: 'fadeIn 0.5s ease-out 0.4s both'
  },
  credentialsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    padding: '12px 16px',
    border: '1px solid #E5E7EB'
  },
  credentialsLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#9CA3AF',
    marginBottom: '4px'
  },
  credentialsText: {
    fontSize: '13px',
    color: '#374151'
  },
  code: {
    fontFamily: 'monospace',
    fontSize: '13px',
    backgroundColor: '#F3F4F6',
    padding: '4px 8px',
    borderRadius: '4px'
  },
  // Status Container - Bottom Left
  statusContainer: {
    position: 'fixed',
    bottom: '24px',
    left: '24px',
    zIndex: 100,
    animation: 'fadeIn 0.8s ease-out 0.6s both'
  },
  statusWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(8px)',
    padding: '8px 16px',
    borderRadius: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    transition: 'all 0.3s ease',
    cursor: 'default'
  },
  statusIcon: {
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center'
  },
  statusText: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#4B5563',
    transition: 'color 0.3s ease'
  }
};

// Add hover effects for button
const styleElement = document.createElement('style');
styleElement.textContent = `
  .primary-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
  }
  .primary-btn:hover .btn-arrow {
    transform: translateX(4px);
  }
  .primary-btn:active {
    transform: scale(0.98);
  }
`;
document.head.appendChild(styleElement);

export default Home;