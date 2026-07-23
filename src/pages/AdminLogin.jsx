import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../services/api';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await adminLogin(username, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Background Decoration */}
      <div style={styles.bgDecoration1} />
      <div style={styles.bgDecoration2} />
      
      {/* Login Card */}
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <span style={styles.logoIcon}>🔐</span>
          </div>
          <h1 style={styles.title}>
            Admin
            <span style={styles.titleHighlight}>Login</span>
          </h1>
          <p style={styles.subtitle}>Access the society management dashboard</p>
        </div>
        
        {error && (
          <div style={styles.errorContainer}>
            <span style={styles.errorIcon}>⚠️</span>
            <span style={styles.errorText}>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <span style={styles.labelIcon}>👤</span>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              placeholder="Enter admin username"
              required
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <span style={styles.labelIcon}>🔑</span>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Enter admin password"
              required
            />
          </div>
          
          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span style={styles.loadingSpinner} />
                Logging in...
              </>
            ) : (
              <>
                <span>Login</span>
                <span style={styles.btnArrow}>→</span>
              </>
            )}
          </button>
        </form>

        {/* Back to Home Link */}
        <div style={styles.backLink}>
          <a href="/" style={styles.backLinkText}>
            ← Back to Home
          </a>
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
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .slide-up {
          animation: slideUp 0.6s ease-out forwards;
        }
        .fade-in {
          animation: fadeIn 0.5s ease-out 0.3s both;
        }
        .shake {
          animation: shake 0.4s ease-in-out;
        }
        .loading-spinner {
          animation: spin 0.8s linear infinite;
        }
        .input-focus:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .btn-arrow {
          transition: transform 0.2s ease;
        }
        .login-btn:hover .btn-arrow {
          transform: translateX(4px);
        }
        .login-btn:active {
          transform: scale(0.98);
        }
        .back-link:hover {
          color: #4F46E5;
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
  card: {
    maxWidth: '420px',
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
    marginBottom: '32px'
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
    fontSize: '28px'
  },
  title: {
    fontSize: '32px',
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
    fontSize: '14px',
    color: '#6B7280',
    margin: '0',
    fontWeight: '400'
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FCA5A5',
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '20px',
    animation: 'shake 0.4s ease-in-out'
  },
  errorIcon: {
    fontSize: '18px'
  },
  errorText: {
    color: '#DC2626',
    fontSize: '14px',
    fontWeight: '500'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  labelIcon: {
    fontSize: '16px'
  },
  input: {
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1.5px solid #E5E7EB',
    fontSize: '15px',
    color: '#1F2937',
    transition: 'all 0.2s ease',
    backgroundColor: '#FAFAFA',
    fontFamily: 'inherit'
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '14px 28px',
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
    marginTop: '4px',
    position: 'relative'
  },
  btnArrow: {
    fontSize: '18px',
    transition: 'transform 0.2s ease'
  },
  loadingSpinner: {
    display: 'inline-block',
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  backLink: {
    textAlign: 'center',
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #F3F4F6'
  },
  backLinkText: {
    color: '#6B7280',
    fontSize: '14px',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
    cursor: 'pointer'
  }
};

// Add hover effects with JavaScript
const styleElement = document.createElement('style');
styleElement.textContent = `
  .login-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
  }
  .login-btn:hover .btn-arrow {
    transform: translateX(4px);
  }
  .login-btn:active {
    transform: scale(0.98);
  }
  input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    background-color: white;
  }
  .back-link-text:hover {
    color: #4F46E5;
  }
`;
document.head.appendChild(styleElement);

export default AdminLogin;