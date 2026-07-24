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
  getSocietyMembers,
  getTeamMembers,
  uploadTeamMember,
  deleteTeamMember
} from '../services/api';

const TEAM_CATEGORIES = [
  { key: 'faculty', label: 'Faculty', icon: '👨‍🏫' },
  { key: 'osc', label: 'OSC', icon: '⚡' },
  { key: 'core', label: 'Core', icon: '⭐' },
  { key: 'mentor', label: 'Mentors', icon: '🎯' },
];

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

  // ---------- Top-level dashboard tab (Societies vs Images) ----------
  const [activeMainTab, setActiveMainTab] = useState('societies');

  // ---------- Images tab state ----------
  const [teamMembers, setTeamMembers] = useState({ faculty: [], osc: [], core: [], mentor: [] });
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamCategory, setTeamCategory] = useState('faculty');
  const [teamForm, setTeamForm] = useState({ name: '', branch: '', designation: '' });
  const [teamImageFile, setTeamImageFile] = useState(null);
  const [sortNamesByCategory, setSortNamesByCategory] = useState({ faculty: false, osc: false, core: false, mentor: false });
  const [teamImagePreview, setTeamImagePreview] = useState('');
  const [teamFormLoading, setTeamFormLoading] = useState(false);
  const [teamFormError, setTeamFormError] = useState('');
  const [teamFormSuccess, setTeamFormSuccess] = useState('');

  useEffect(() => {
    fetchSocieties();
  }, []);

  useEffect(() => {
    if (activeMainTab === 'images') {
      fetchTeamMembers();
    }
  }, [activeMainTab]);

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

  const handleDeleteSociety = async (id) => {
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

  // ---------- Images tab handlers ----------

  const fetchTeamMembers = async () => {
    try {
      setTeamLoading(true);
      const data = await getTeamMembers();
      setTeamMembers({
        faculty: data.faculty || [],
        osc: data.osc || [],
        core: data.core || [],
        mentor: data.mentor || [],
      });
    } catch (err) {
      console.error('Error fetching team members:', err);
    } finally {
      setTeamLoading(false);
    }
  };

  const handleTeamImageChange = (e) => {
    const file = e.target.files[0] || null;
    setTeamImageFile(file);
    setTeamImagePreview(file ? URL.createObjectURL(file) : '');
  };

  const resetTeamForm = () => {
    setTeamForm({ name: '', branch: '', designation: '' });
    setTeamImageFile(null);
    setTeamImagePreview('');
  };

  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    setTeamFormError('');
    setTeamFormSuccess('');

    if (!teamForm.name.trim()) {
      setTeamFormError('Name is required');
      return;
    }
    if (!teamImageFile) {
      setTeamFormError('Please select a photo');
      return;
    }

    setTeamFormLoading(true);
    try {
      const fd = new FormData();
      fd.append('category', teamCategory);
      fd.append('name', teamForm.name.trim());
      if (teamCategory === 'faculty') fd.append('designation', teamForm.designation.trim());
      if (teamCategory === 'osc' || teamCategory === 'core') fd.append('branch', teamForm.branch.trim());
      fd.append('image', teamImageFile);

      await uploadTeamMember(fd);
      setTeamFormSuccess('✅ Member added successfully!');
      resetTeamForm();
      fetchTeamMembers();
    } catch (err) {
      setTeamFormError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setTeamFormLoading(false);
      setTimeout(() => setTeamFormSuccess(''), 2500);
    }
  };

  const handleDeleteTeamMember = async (id) => {
    if (!window.confirm('Delete this team member?')) return;
    try {
      await deleteTeamMember(id);
      fetchTeamMembers();
    } catch (err) {
      alert('❌ Failed to delete member');
    }
  };

  // Show loading state with navbar visible
  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner} />
          <p style={styles.loadingText}>Loading dashboard...</p>
        </div>
      </>
    );
  }

  const secondaryFieldLabel = teamCategory === 'faculty' ? 'Designation' : 'Branch';
  const showSecondaryField = teamCategory !== 'mentor';
  const currentCategoryMembers = teamMembers[teamCategory] || [];
  const displayedTeamMembers = sortNamesByCategory[teamCategory]
    ? [...currentCategoryMembers].sort((a, b) => a.name.localeCompare(b.name))
    : currentCategoryMembers;

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        {/* Main Tabs */}
        <div style={styles.mainTabs}>
          <button
            onClick={() => setActiveMainTab('societies')}
            style={activeMainTab === 'societies' ? styles.mainTabActive : styles.mainTab}
          >
            <span style={styles.tabIcon}>🏢</span>
            Societies
          </button>
          <button
            onClick={() => setActiveMainTab('images')}
            style={activeMainTab === 'images' ? styles.mainTabActive : styles.mainTab}
          >
            <span style={styles.tabIcon}>🖼️</span>
            Images
          </button>
        </div>

        {activeMainTab === 'societies' && (
          <>
            {/* Stats */}
            <div style={styles.stats}>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>🏛️</div>
                <div style={styles.statContent}>
                  <h3 style={styles.statLabel}>Total Societies</h3>
                  <p style={styles.statNumber}>{societies.length}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={styles.actions}>
              <button onClick={() => setShowCreateForm(!showCreateForm)} style={styles.createBtn}>
                {showCreateForm ? '✕ Cancel' : '+ Create New Society'}
              </button>
              <button onClick={() => navigate('/admin/scanner')} style={styles.scannerBtn}>
                📷 Scan QR Code
              </button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
              <div style={styles.formContainer}>
                <h3 style={styles.formTitle}>Create New Society</h3>
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
                  <div style={styles.modalHeader}>
                    <h3 style={styles.modalTitle}>Change Password</h3>
                    <button 
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingSociety(null);
                        setFormData({ societyName: '', email: '', password: '' });
                      }} 
                      style={styles.closeBtn}
                    >
                      ✕
                    </button>
                  </div>
                  <p style={styles.formSubtitle}>Enter a new password for {editingSociety.societyName}</p>
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
            {showMembersModal && selectedSociety && (
              <div style={styles.modalOverlay}>
                <div style={styles.modalLarge}>
                  <div style={styles.modalHeader}>
                    <h3 style={styles.modalTitle}>👥 Members of {selectedSociety.societyName}</h3>
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
                                  backgroundColor: member.slotNumber === 1 ? '#10B981' : '#3B82F6'
                                }}>
                                  Slot {member.slotNumber}
                                </span>
                              </td>
                              <td>
                                <span style={{
                                  ...styles.statusBadge,
                                  backgroundColor: 
                                    member.status === 'verified' ? '#10B981' :
                                    member.status === 'rejected' ? '#EF4444' :
                                    '#F59E0B'
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

            {/* Societies Table */}
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
                              onClick={() => handleDeleteSociety(society._id)} 
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
          </>
        )}

        {activeMainTab === 'images' && (
          <>
            <div style={styles.categoryTabs}>
              {TEAM_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setTeamCategory(cat.key)}
                  style={teamCategory === cat.key ? styles.categoryTabActive : styles.categoryTab}
                >
                  {cat.icon} {cat.label} ({(teamMembers[cat.key] || []).length})
                </button>
              ))}
            </div>

            <div style={styles.formContainer}>
              <h3 style={styles.formTitle}>Add {TEAM_CATEGORIES.find((c) => c.key === teamCategory)?.label} Member</h3>
              <p style={styles.formSubtitle}>Photos are uploaded to cloud storage</p>
              {teamFormError && <div style={styles.error}>{teamFormError}</div>}
              {teamFormSuccess && <div style={styles.success}>{teamFormSuccess}</div>}
              <form onSubmit={handleTeamSubmit} style={styles.form}>
                <input
                  type="text"
                  placeholder="Name *"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  style={styles.formInput}
                  required
                />
                {showSecondaryField && (
                  <input
                    type="text"
                    placeholder={secondaryFieldLabel}
                    value={teamCategory === 'faculty' ? teamForm.designation : teamForm.branch}
                    onChange={(e) =>
                      setTeamForm({
                        ...teamForm,
                        [teamCategory === 'faculty' ? 'designation' : 'branch']: e.target.value,
                      })
                    }
                    style={styles.formInput}
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleTeamImageChange}
                  style={styles.fileInput}
                  required
                />
                {teamImagePreview && (
                  <div style={styles.previewContainer}>
                    <img src={teamImagePreview} alt="Preview" style={styles.imagePreview} />
                  </div>
                )}
                <div style={styles.formButtons}>
                  <button type="submit" style={styles.submitBtn} disabled={teamFormLoading}>
                    {teamFormLoading ? 'Uploading...' : 'Add Member'}
                  </button>
                </div>
              </form>
            </div>

            <div style={styles.tableContainer}>
              {teamLoading ? (
                <div style={styles.loadingSmall}>Loading team members...</div>
              ) : currentCategoryMembers.length === 0 ? (
                <div style={styles.emptyState}>
                  No {TEAM_CATEGORIES.find((c) => c.key === teamCategory)?.label} members added yet.
                </div>
              ) : (
                <>
                  <button
                    onClick={() =>
                      setSortNamesByCategory((prev) => ({ ...prev, [teamCategory]: !prev[teamCategory] }))
                    }
                    style={sortNamesByCategory[teamCategory] ? styles.sortBtnActive : styles.sortBtn}
                  >
                    {sortNamesByCategory[teamCategory] ? '✓ Sorted A–Z' : 'Sort Names A–Z'}
                  </button>
                  <div style={styles.teamGrid}>
                    {displayedTeamMembers.map((member) => (
                      <div key={member.id || member._id} style={styles.teamCard}>
                        <img src={member.imageUrl} alt={member.name} style={styles.teamThumb} />
                        <div style={styles.teamCardName}>{member.name}</div>
                        <div style={styles.teamCardSub}>
                          {teamCategory === 'faculty' ? member.designation : member.branch}
                        </div>
                        <button
                          onClick={() => handleDeleteTeamMember(member.id || member._id)}
                          style={styles.deleteBtn}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#F9FAFB',
    minHeight: 'calc(100vh - 64px)' // Subtract navbar height
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 64px)', // Subtract navbar height
    backgroundColor: '#F9FAFB',
    padding: '40px'
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(102, 126, 234, 0.2)',
    borderTop: '3px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  loadingText: {
    color: '#4B5563',
    marginTop: '16px',
    fontSize: '16px',
    fontWeight: '500'
  },
  mainTabs: {
    display: 'flex',
    gap: '8px',
    marginTop: '20px',
    marginBottom: '24px',
    backgroundColor: 'white',
    padding: '6px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #E5E7EB'
  },
  tabIcon: {
    marginRight: '8px'
  },
  mainTab: {
    padding: '10px 24px',
    border: 'none',
    background: 'none',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6B7280',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mainTabActive: {
    padding: '10px 24px',
    border: 'none',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    cursor: 'pointer',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  categoryTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  categoryTab: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid #E5E7EB',
    backgroundColor: 'white',
    color: '#6B7280',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s ease'
  },
  categoryTabActive: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid #667eea',
    backgroundColor: '#667eea',
    color: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #E5E7EB',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  statIcon: {
    fontSize: '32px'
  },
  statContent: {
    flex: 1
  },
  statLabel: {
    fontSize: '14px',
    color: '#6B7280',
    margin: '0 0 4px 0',
    fontWeight: '500'
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1F2937',
    margin: 0
  },
  actions: {
    marginBottom: '20px',
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  createBtn: {
    padding: '10px 24px',
    backgroundColor: '#10B981',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
  },
  scannerBtn: {
    padding: '10px 24px',
    backgroundColor: '#8B5CF6',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(139, 92, 246, 0.2)'
  },
  formContainer: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #E5E7EB',
    marginBottom: '20px'
  },
  formTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1F2937',
    margin: '0 0 4px 0'
  },
  formSubtitle: {
    color: '#6B7280',
    fontSize: '14px',
    marginBottom: '16px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '400px'
  },
  formInput: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid #E5E7EB',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    backgroundColor: '#FAFAFA'
  },
  fileInput: {
    padding: '8px',
    borderRadius: '10px',
    border: '1.5px solid #E5E7EB',
    fontSize: '14px',
    backgroundColor: '#FAFAFA'
  },
  previewContainer: {
    marginTop: '4px'
  },
  imagePreview: {
    width: '100px',
    height: '100px',
    objectFit: 'cover',
    borderRadius: '10px',
    border: '2px solid #E5E7EB'
  },
  formButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '4px'
  },
  submitBtn: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    flex: 1,
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#9CA3AF',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '16px',
    maxWidth: '450px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    animation: 'slideUp 0.3s ease-out'
  },
  modalLarge: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '16px',
    maxWidth: '900px',
    width: '95%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    animation: 'slideUp 0.3s ease-out'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '1px solid #E5E7EB'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1F2937',
    margin: 0
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '22px',
    cursor: 'pointer',
    color: '#6B7280',
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'all 0.2s ease'
  },
  modalFooter: {
    marginTop: '20px',
    paddingTop: '12px',
    borderTop: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'flex-end'
  },
  closeModalBtn: {
    padding: '8px 20px',
    backgroundColor: '#6B7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'auto',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #E5E7EB',
    marginBottom: '20px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '700px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#9CA3AF'
  },
  passwordContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  passwordText: {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#6B7280'
  },
  editPasswordBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background 0.2s ease'
  },
  viewMembersBtn: {
    padding: '4px 12px',
    backgroundColor: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500'
  },
  slotBadge: {
    padding: '2px 10px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '11px',
    fontWeight: '600'
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
    color: 'white'
  },
  actionsCell: {
    display: 'flex',
    gap: '5px',
    flexWrap: 'wrap'
  },
  deleteBtn: {
    padding: '4px 12px',
    backgroundColor: '#EF4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500'
  },
  sortBtn: {
    padding: '6px 14px',
    backgroundColor: 'white',
    color: '#3f51b5',
    border: '1px solid #3f51b5',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '12px'
  },
  sortBtnActive: {
    padding: '6px 14px',
    backgroundColor: '#3f51b5',
    color: 'white',
    border: '1px solid #3f51b5',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '12px'
  },
  loadingSmall: {
    textAlign: 'center',
    padding: '40px',
    color: '#6B7280'
  },
  error: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    padding: '10px 14px',
    borderRadius: '8px',
    marginBottom: '10px',
    border: '1px solid #FCA5A5'
  },
  success: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    padding: '10px 14px',
    borderRadius: '8px',
    marginBottom: '10px',
    border: '1px solid #A7F3D0'
  },
  teamGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '16px',
    padding: '20px'
  },
  teamCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '12px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
    border: '1px solid #E5E7EB',
    transition: 'all 0.2s ease'
  },
  teamThumb: {
    width: '100%',
    aspectRatio: '1',
    objectFit: 'cover',
    borderRadius: '8px',
    marginBottom: '8px'
  },
  teamCardName: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#1F2937'
  },
  teamCardSub: {
    fontSize: '12px',
    color: '#6B7280',
    marginBottom: '8px'
  }
};

// Add CSS animations
const styleElement = document.createElement('style');
styleElement.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  button:active {
    transform: scale(0.98);
  }
  .main-tab:hover {
    background-color: #F3F4F6;
  }
  .main-tab-active:hover {
    opacity: 0.9;
  }
  .create-btn:hover {
    background-color: #059669;
    transform: translateY(-1px);
  }
  .scanner-btn:hover {
    background-color: #7C3AED;
    transform: translateY(-1px);
  }
  .submit-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  .delete-btn:hover {
    background-color: #DC2626;
  }
  .view-members-btn:hover {
    background-color: #2563EB;
  }
  .close-btn:hover {
    background-color: #F3F4F6;
  }
  .category-tab:hover {
    border-color: #667eea;
    color: #667eea;
  }
  .team-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  .edit-password-btn:hover {
    background-color: #F3F4F6;
  }
  input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    background-color: white;
  }
`;
document.head.appendChild(styleElement);

export default AdminDashboard;