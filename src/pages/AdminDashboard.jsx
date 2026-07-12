import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { 
  getSocieties, 
  adminLogout, 
  getAdminData, 
  deleteSociety,
  createSociety,
  updateSocietyPassword,
  getSocietyMembers
} from '../services/api';

const AdminDashboard = () => {
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedSociety, setSelectedSociety] = useState(null);
  const [societyMembers, setSocietyMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [editingSociety, setEditingSociety] = useState(null);
  const [formData, setFormData] = useState({ societyName: '', email: '', password: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const navigate = useNavigate();
  const admin = getAdminData();

  useEffect(() => {
    fetchSocieties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSocieties = async () => {
    try {
      setLoading(true);
      const data = await getSocieties();
      setSocieties(data.societies || []);
    } catch (err) {
      setError('Failed to fetch societies');
      if (err.response?.status === 401) {
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSocietyMembers = async (societyId) => {
    try {
      setMembersLoading(true);
      const data = await getSocietyMembers(societyId);
      setSocietyMembers(data.members || []);
    } catch (err) {
      console.error('Error fetching members:', err);
      setSocietyMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleViewMembers = async (society) => {
    setSelectedSociety(society);
    setShowMembersModal(true);
    await fetchSocietyMembers(society._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this society?')) return;
    try {
      await deleteSociety(id);
      alert('✅ Society deleted successfully!');
      fetchSocieties();
    } catch (err) {
      alert('❌ Failed to delete society');
    }
  };

  const handleCreateSociety = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    try {
      await createSociety(formData);
      
      setFormSuccess('✅ Society created successfully!');
      setFormData({ societyName: '', email: '', password: '' });
      
      setTimeout(() => {
        setShowCreateForm(false);
        fetchSocieties();
      }, 1500);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create society');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditClick = (society) => {
    setEditingSociety(society);
    setFormData({
      societyName: society.societyName,
      email: society.email,
      password: ''
    });
    setShowEditForm(true);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    try {
      await updateSocietyPassword(editingSociety._id, formData.password);
      
      setFormSuccess('✅ Password updated successfully!');
      
      setTimeout(() => {
        setShowEditForm(false);
        setEditingSociety(null);
        setFormData({ societyName: '', email: '', password: '' });
        fetchSocieties();
      }, 1500);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to update password');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <Navbar />

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <h3>Total Societies</h3>
          <p style={styles.statNumber}>{societies.length}</p>
        </div>
      </div>

      <div style={styles.actions}>
        <button onClick={() => setShowCreateForm(!showCreateForm)} style={styles.createBtn}>
          {showCreateForm ? '✕ Cancel' : '+ Create New Society'}
        </button>
        <button onClick={() => navigate('/admin/scanner')} style={styles.scannerBtn}>
          📷 Scan QR Code
        </button>
      </div>

      {showCreateForm && (
        <div style={styles.formContainer}>
          <h3>Create New Society</h3>
          <p style={styles.formSubtitle}>The society will receive these credentials to login</p>
          {formError && <div style={styles.error}>{formError}</div>}
          {formSuccess && <div style={styles.success}>{formSuccess}</div>}
          <form onSubmit={handleCreateSociety} style={styles.form}>
            <input
              type="text"
              placeholder="Society Name *"
              value={formData.societyName}
              onChange={(e) => setFormData({ ...formData, societyName: e.target.value })}
              style={styles.formInput}
              required
            />
            <input
              type="email"
              placeholder="Email Address *"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={styles.formInput}
              required
            />
            <input
              type="password"
              placeholder="Password (min 6 characters) *"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={styles.formInput}
              required
              minLength="6"
            />
            <div style={styles.formButtons}>
              <button 
                type="button" 
                onClick={() => setShowCreateForm(false)} 
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button type="submit" style={styles.submitBtn} disabled={formLoading}>
                {formLoading ? 'Creating...' : 'Create Society'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Password Modal */}
      {showEditForm && editingSociety && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3>Change Password for {editingSociety.societyName}</h3>
            <p style={styles.formSubtitle}>Enter a new password for this society</p>
            {formError && <div style={styles.error}>{formError}</div>}
            {formSuccess && <div style={styles.success}>{formSuccess}</div>}
            <form onSubmit={handleUpdatePassword} style={styles.form}>
              <input
                type="text"
                placeholder="Society Name"
                value={formData.societyName}
                style={{ ...styles.formInput, backgroundColor: '#f5f5f5' }}
                disabled
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                style={{ ...styles.formInput, backgroundColor: '#f5f5f5' }}
                disabled
              />
              <input
                type="password"
                placeholder="New Password (min 6 characters) *"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={styles.formInput}
                required
                minLength="6"
              />
              <div style={styles.formButtons}>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingSociety(null);
                    setFormData({ societyName: '', email: '', password: '' });
                  }} 
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn} disabled={formLoading}>
                  {formLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Members Modal */}
      {/* View Members Modal */}
{/* View Members Modal */}
{showMembersModal && selectedSociety && (
  <div style={styles.modalOverlay}>
    <div style={styles.modalLarge}>
      <div style={styles.modalHeader}>
        <h2>👥 Members of {selectedSociety.societyName}</h2>
        <button 
          onClick={() => {
            setShowMembersModal(false);
            setSelectedSociety(null);
            setSocietyMembers([]);
          }} 
          style={styles.closeBtn}
        >
          ✕
        </button>
      </div>
      
      {membersLoading ? (
        <div style={styles.loadingSmall}>Loading members...</div>
      ) : societyMembers.length === 0 ? (
        <div style={styles.emptyState}>No members added yet for this society.</div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Branch</th>
                <th>Roll No</th>
                <th>Email</th>
                <th>Slot</th>
                <th>Status</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {societyMembers.map((member, index) => (
                <tr key={member._id || index}>
                  <td>{index + 1}</td>
                  <td><strong>{member.name}</strong></td>
                  <td>{member.branch}</td>
                  <td>{member.rollNo}</td>
                  <td>{member.email}</td>
                  <td>
                    <span style={{
                      ...styles.slotBadge,
                      backgroundColor: member.slotNumber === 1 ? '#4CAF50' : '#2196F3'
                    }}>
                      Slot {member.slotNumber}
                    </span>
                  </td>
                  <td>
  <span style={{
    ...styles.statusBadge,
    backgroundColor: 
      member.status === 'verified' ? '#4CAF50' :
      member.status === 'rejected' ? '#f44336' :
      '#FF9800',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'inline-block'
  }}>
    {member.status === 'verified' ? '✅ Verified' :
     member.status === 'rejected' ? '❌ Rejected' :
     '⏳ Pending'}
  </span>
</td>
                  <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div style={styles.modalFooter}>
        <button 
          onClick={() => {
            setShowMembersModal(false);
            setSelectedSociety(null);
            setSocietyMembers([]);
          }} 
          style={styles.closeModalBtn}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Society Name</th>
              <th>Email</th>
              <th>Password</th>
              <th>Members</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {societies.length === 0 ? (
              <tr>
                <td colSpan="7" style={styles.emptyState}>No societies found. Create one above!</td>
              </tr>
            ) : (
              societies.map((society, index) => (
                <tr key={society._id}>
                  <td>{index + 1}</td>
                  <td><strong>{society.societyName}</strong></td>
                  <td>{society.email}</td>
                  <td>
                    <div style={styles.passwordContainer}>
                      <span style={styles.passwordText}>••••••••</span>
                      <button 
                        onClick={() => handleEditClick(society)} 
                        style={styles.editPasswordBtn}
                        title="Change Password"
                      >
                        🔑
                      </button>
                    </div>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleViewMembers(society)} 
                      style={styles.viewMembersBtn}
                    >
                      👥 View Members
                    </button>
                  </td>
                  <td>{new Date(society.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={styles.actionsCell}>
                      <button 
                        onClick={() => handleDelete(society._id)} 
                        style={styles.deleteBtn}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
    marginTop: '20px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#2196F3',
    margin: '10px 0 0',
  },
  actions: {
    marginBottom: '20px',
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  createBtn: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  scannerBtn: {
    padding: '12px 24px',
    backgroundColor: '#FF5722',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  formContainer: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  statusBadge: {
  padding: '4px 10px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 'bold',
  display: 'inline-block',
},
  formSubtitle: {
    color: '#666',
    fontSize: '14px',
    marginBottom: '15px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: '400px',
  },
  formInput: {
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  formButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '5px',
  },
  submitBtn: {
    padding: '10px 20px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    flex: 1,
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#9e9e9e',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    maxWidth: '450px',
    width: '100%',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },
  modalLarge: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    maxWidth: '900px',
    width: '95%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },
  statusBadge: {
  padding: '4px 10px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 'bold',
  display: 'inline-block',
},
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '1px solid #eee',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
  },
  modalFooter: {
    marginTop: '20px',
    paddingTop: '10px',
    borderTop: '1px solid #eee',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  closeModalBtn: {
    padding: '8px 20px',
    backgroundColor: '#666',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '10px',
    overflow: 'auto',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '700px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
  },
  passwordContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  passwordText: {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#666',
  },
  editPasswordBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background 0.2s',
  },
  viewMembersBtn: {
    padding: '4px 12px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  slotBadge: {
    padding: '2px 10px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  actionsCell: {
    display: 'flex',
    gap: '5px',
    flexWrap: 'wrap',
  },
  deleteBtn: {
    padding: '4px 12px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
  },
  loadingSmall: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '10px',
  },
  success: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '10px',
  },
};

export default AdminDashboard;