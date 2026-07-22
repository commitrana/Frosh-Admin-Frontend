import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FeedbackSection from '../components/FeedbackSection';
import axios from 'axios';

const FacultyList = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    phoneNo: '',
    photo: '',
    teacherNo: '',
    timetableImage: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const navigate = useNavigate();

  // ===== Schedule (Timetable Grid) state =====
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  // Same 20 codes as the Bootcamp batch system (routes/batches.js ALL_BATCHES)
  const BATCH_CODES = [
    'RedA', 'RedB', 'BlueA', 'BlueB', 'PinkA', 'PinkB', 'PurpleA', 'PurpleB',
    'YellowA', 'YellowB', 'GreenA', 'GreenB', 'OrangeA', 'OrangeB',
    'WhiteA', 'WhiteB', 'BrownA', 'BrownB', 'BlackA', 'BlackB'
  ];
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleFaculty, setScheduleFaculty] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]); // array of slot label strings, e.g. "10:00 - 11:00"
  const [scheduleData, setScheduleData] = useState({}); // { [day]: { [slot]: { subject, venue } } }
  const [newSlotStart, setNewSlotStart] = useState('');
  const [newSlotEnd, setNewSlotEnd] = useState('');
  const [editingCell, setEditingCell] = useState(null); // { day, slot }
  const [lectureForm, setLectureForm] = useState({ subject: '', venue: '', batches: [] });
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // ===== Completed class history (admin-only) =====
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyFaculty, setHistoryFaculty] = useState([]);
  const [selectedHistoryFaculty, setSelectedHistoryFaculty] = useState(null);
  const [historySessions, setHistorySessions] = useState([]);
  const [selectedHistorySession, setSelectedHistorySession] = useState(null);
  const [historyRoster, setHistoryRoster] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const API_URL = 'https://frosh-app-backend.onrender.com/api';

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        setError('❌ Please login as Admin first');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/faculty/admin/list`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.faculty) {
        setFaculty(response.data.faculty);
        setError('');
      } else {
        setFaculty([]);
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError('❌ Failed to fetch faculty');
      setFaculty([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const handleAddFaculty = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        setError('❌ Admin not logged in');
        setFormLoading(false);
        return;
      }

      await axios.post(`${API_URL}/faculty/admin/create`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setSuccess('✅ Faculty added successfully!');
      setFormData({
        name: '',
        email: '',
        password: '',
        department: '',
        phoneNo: '',
        photo: '',
        teacherNo: '',
        timetableImage: ''
      });
      
      await fetchFaculty();
      
      setTimeout(() => {
        setShowAddModal(false);
        setSuccess('');
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add faculty');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditClick = (faculty) => {
    setSelectedFaculty(faculty);
    setFormData({
      name: faculty.name,
      email: faculty.email,
      password: '',
      department: faculty.department,
      phoneNo: faculty.phoneNo,
      photo: faculty.photo || '',
      teacherNo: faculty.teacherNo || '',
      timetableImage: faculty.timetableImage || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateFaculty = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }
      
      await axios.put(`${API_URL}/faculty/admin/${selectedFaculty._id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('✅ Faculty updated successfully!');
      await fetchFaculty();
      
      setTimeout(() => {
        setShowEditModal(false);
        setSelectedFaculty(null);
        setFormData({
          name: '',
          email: '',
          password: '',
          department: '',
          phoneNo: '',
          photo: '',
          teacherNo: '',
          timetableImage: ''
        });
        setSuccess('');
      }, 1000);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update faculty');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete faculty member "${name}"?`)) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/faculty/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(`✅ ${name} deleted successfully!`);
      await fetchFaculty();
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      setError('Failed to delete faculty');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openClassHistory = async () => {
    setShowHistoryModal(true);
    setSelectedHistoryFaculty(null);
    setHistorySessions([]);
    setSelectedHistorySession(null);
    setHistoryRoster([]);
    setHistoryError('');
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/attendance/admin/history/faculty`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistoryFaculty(response.data.faculty || []);
    } catch (err) {
      setHistoryError('Could not load class history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const selectHistoryFaculty = async (member) => {
    setSelectedHistoryFaculty(member);
    setHistorySessions([]);
    setSelectedHistorySession(null);
    setHistoryRoster([]);
    setHistoryError('');
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/attendance/admin/history/faculty/${member._id}/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistorySessions(response.data.sessions || []);
    } catch (err) {
      setHistoryError('Could not load this faculty member\'s completed classes.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const selectHistorySession = async (session) => {
    setSelectedHistorySession(session);
    setHistoryRoster([]);
    setHistoryError('');
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/attendance/admin/history/session/${session._id}/roster`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistoryRoster(response.data.students || []);
    } catch (err) {
      setHistoryError('Could not load this class roster.');
    } finally {
      setHistoryLoading(false);
    }
  };

  // ===== Schedule (Timetable Grid) handlers =====

  const handleScheduleClick = async (f) => {
    // Open immediately with whatever we have, so the UI feels responsive —
    // but treat it as provisional until the fresh fetch below lands.
    setScheduleFaculty(f);
    setEditingCell(null);
    setScheduleMsg('');
    setShowScheduleModal(true);
    setScheduleLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      // This is the actual fix: re-fetch from the server right now instead
      // of reading `f.timetable`, which is only as fresh as whenever
      // fetchFaculty() last happened to run. If another edit session (a
      // second tab, or a background fetchFaculty() elsewhere in the app)
      // saved a newer schedule in between, `f` here would be stale and we'd
      // silently build the editor from outdated data — then overwrite the
      // newer save when "Save Schedule" is clicked.
      const response = await axios.get(`${API_URL}/faculty/admin/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const freshList = (response.data && response.data.faculty) || [];
      const fresh = freshList.find((x) => x._id === f._id) || f;

      // Sync the list-level state too, so any other view of this faculty
      // member (e.g. reopening Edit) also sees the latest data.
      setFaculty(freshList);
      setScheduleFaculty(fresh);

      const tt = fresh.timetable || {};
      const slots = Array.isArray(tt.timeSlots) && tt.timeSlots.length
        ? tt.timeSlots
        : ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00'];
      // Backend default is { schedule: [] } (array) — normalize to object map for the grid
      const data = (tt.schedule && typeof tt.schedule === 'object' && !Array.isArray(tt.schedule))
        ? tt.schedule
        : {};
      setTimeSlots(slots);
      setScheduleData(data);
    } catch (err) {
      console.error('❌ Failed to fetch fresh schedule:', err);
      setScheduleMsg('⚠️ Could not confirm latest schedule from server — showing last known data. Double-check before saving.');
      // Fall back to what we were passed so the modal isn't empty, but the
      // warning above stays up so the admin knows this may not be current.
      const tt = f.timetable || {};
      const slots = Array.isArray(tt.timeSlots) && tt.timeSlots.length
        ? tt.timeSlots
        : ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00'];
      const data = (tt.schedule && typeof tt.schedule === 'object' && !Array.isArray(tt.schedule))
        ? tt.schedule
        : {};
      setTimeSlots(slots);
      setScheduleData(data);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleAddTimeSlot = () => {
    if (!newSlotStart || !newSlotEnd) return;
    const label = `${newSlotStart} - ${newSlotEnd}`;
    if (timeSlots.includes(label)) {
      setScheduleMsg('⚠️ That time slot already exists');
      setTimeout(() => setScheduleMsg(''), 2000);
      return;
    }
    setTimeSlots([...timeSlots, label]);
    setNewSlotStart('');
    setNewSlotEnd('');
  };

  const handleRenameTimeSlot = (oldLabel) => {
    const newLabel = window.prompt('Edit time slot:', oldLabel);
    if (!newLabel || newLabel === oldLabel) return;
    if (timeSlots.includes(newLabel)) {
      alert('That time slot label already exists');
      return;
    }
    // Rename the slot everywhere it's used across all days
    setTimeSlots(timeSlots.map(s => (s === oldLabel ? newLabel : s)));
    const updated = {};
    Object.keys(scheduleData).forEach(day => {
      updated[day] = {};
      Object.keys(scheduleData[day]).forEach(slot => {
        const key = slot === oldLabel ? newLabel : slot;
        updated[day][key] = scheduleData[day][slot];
      });
    });
    setScheduleData(updated);
  };

  const handleRemoveTimeSlot = (label) => {
    if (!window.confirm(`Remove time slot "${label}"? Any lectures scheduled in this column will be deleted.`)) return;
    setTimeSlots(timeSlots.filter(s => s !== label));
    const updated = {};
    Object.keys(scheduleData).forEach(day => {
      updated[day] = {};
      Object.keys(scheduleData[day]).forEach(slot => {
        if (slot !== label) updated[day][slot] = scheduleData[day][slot];
      });
    });
    setScheduleData(updated);
  };

  const openLectureForm = (day, slot) => {
    const existing = scheduleData[day]?.[slot];
    setLectureForm({
      subject: existing?.subject || '',
      venue: existing?.venue || '',
      batches: Array.isArray(existing?.batches) ? existing.batches : []
    });
    setEditingCell({ day, slot });
  };

  const closeLectureForm = () => {
    setEditingCell(null);
    setLectureForm({ subject: '', venue: '', batches: [] });
  };

  const toggleLectureBatch = (code) => {
    setLectureForm((prev) => {
      const has = prev.batches.includes(code);
      return {
        ...prev,
        batches: has ? prev.batches.filter((b) => b !== code) : [...prev.batches, code]
      };
    });
  };

  const handleSaveLecture = () => {
    if (!editingCell) return;
    const { day, slot } = editingCell;
    if (!lectureForm.subject.trim()) {
      alert('Lecture / subject name is required');
      return;
    }
    setScheduleData({
      ...scheduleData,
      [day]: {
        ...scheduleData[day],
        [slot]: {
          subject: lectureForm.subject.trim(),
          venue: lectureForm.venue.trim(),
          batches: lectureForm.batches
        }
      }
    });
    closeLectureForm();
  };

  const handleRemoveLecture = () => {
    if (!editingCell) return;
    const { day, slot } = editingCell;
    const updatedDay = { ...scheduleData[day] };
    delete updatedDay[slot];
    setScheduleData({ ...scheduleData, [day]: updatedDay });
    closeLectureForm();
  };

  const handleSaveSchedule = async () => {
    if (!scheduleFaculty) return;
    setScheduleSaving(true);
    setScheduleMsg('');
    try {
      const token = localStorage.getItem('adminToken');
      const timetable = { timeSlots, days: DAYS, schedule: scheduleData };

      await axios.put(`${API_URL}/faculty/admin/${scheduleFaculty._id}`, { timetable }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setScheduleMsg('✅ Schedule saved successfully!');
      await fetchFaculty();
      setTimeout(() => {
        setShowScheduleModal(false);
        setScheduleFaculty(null);
        setScheduleMsg('');
      }, 1000);
    } catch (err) {
      setScheduleMsg('❌ Failed to save schedule');
    } finally {
      setScheduleSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.loading}>Loading faculty...</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>👨‍🏫 Faculty Management</h1>
            <p style={styles.subtitle}>Manage college faculty members</p>
          </div>
          <div style={styles.headerStats}>
            <span style={styles.statPill}>Total: {faculty.length}</span>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <FeedbackSection />

        <div style={styles.actions}>
          <button onClick={() => setShowAddModal(true)} style={styles.createBtn}>
            ➕ Add Faculty
          </button>
          <button onClick={openClassHistory} style={styles.historyBtn}>
            Class History
          </button>
          <button onClick={fetchFaculty} style={styles.refreshBtn}>
            🔄 Refresh
          </button>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Password</th>
                <th>Department</th>
                <th>Phone</th>
                <th>Teacher No.</th>
                <th>Timetable</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {faculty.length === 0 ? (
                <tr>
                  <td colSpan="9" style={styles.emptyState}>
                    No faculty members found. Click "Add Faculty" to get started! 📚
                  </td>
                </tr>
              ) : (
                faculty.map((f, index) => (
                  <tr key={f._id}>
                    <td>{index + 1}</td>
                    <td><strong>{f.name}</strong></td>
                    <td>{f.email}</td>
                    <td>
                      <span style={styles.passwordText}>{f.password}</span>
                    </td>
                    <td><span style={styles.departmentBadge}>{f.department}</span></td>
                    <td>{f.phoneNo}</td>
                    <td><strong>{f.teacherNo || '-'}</strong></td>
                    <td>
                      {f.timetableImage ? (
                        <img 
                          src={f.timetableImage} 
                          alt="Timetable" 
                          style={styles.timetableThumb}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/50x40/ff0000/FFFFFF?text=Error';
                          }}
                        />
                      ) : (
                        <span style={styles.noImage}>No image</span>
                      )}
                    </td>
                    <td>
                      <div style={styles.actionsCell}>
                        <button onClick={() => handleScheduleClick(f)} style={styles.scheduleBtn}>
                          🗓️ Schedule
                        </button>
                        <button onClick={() => handleEditClick(f)} style={styles.editBtn}>
                          ✏️ Edit
                        </button>
                        <button onClick={() => handleDelete(f._id, f.name)} style={styles.deleteBtn}>
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showHistoryModal && (
          <div style={styles.modalOverlay} onClick={() => setShowHistoryModal(false)}>
            <div style={styles.scheduleModal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3>Class History</h3>
                <button onClick={() => setShowHistoryModal(false)} style={styles.closeBtn}>×</button>
              </div>
              {historyError && <div style={styles.error}>{historyError}</div>}
              {historyLoading && <div style={styles.emptyGridMsg}>Loading...</div>}

              {!historyLoading && !selectedHistoryFaculty && (
                <div style={styles.historyList}>
                  {historyFaculty.map((member) => (
                    <button key={member._id} style={styles.historyItem} onClick={() => selectHistoryFaculty(member)}>
                      <strong>{member.name}</strong>
                      <span>{member.department || 'Faculty'} · {member.completedClasses} completed class{member.completedClasses === 1 ? '' : 'es'}</span>
                    </button>
                  ))}
                  {historyFaculty.length === 0 && <div style={styles.emptyGridMsg}>No faculty members found.</div>}
                </div>
              )}

              {!historyLoading && selectedHistoryFaculty && !selectedHistorySession && (
                <>
                  <button style={styles.backBtn} onClick={() => { setSelectedHistoryFaculty(null); setHistorySessions([]); }}>← All professors</button>
                  <h4>{selectedHistoryFaculty.name}'s completed classes</h4>
                  <div style={styles.historyList}>
                    {historySessions.map((session) => (
                      <button key={session._id} style={styles.historyItem} onClick={() => selectHistorySession(session)}>
                        <strong>{session.subject}</strong>
                        <span>{session.day || 'Class'} {session.slot ? `· ${session.slot}` : ''} {session.venue ? `· ${session.venue}` : ''}</span>
                        <span>Batch: {session.batches?.length ? session.batches.join(', ') : 'All batches'}</span>
                      </button>
                    ))}
                    {historySessions.length === 0 && <div style={styles.emptyGridMsg}>No completed classes for this professor yet.</div>}
                  </div>
                </>
              )}

              {!historyLoading && selectedHistorySession && (
                <>
                  <button style={styles.backBtn} onClick={() => { setSelectedHistorySession(null); setHistoryRoster([]); }}>← Back to classes</button>
                  <h4>{selectedHistorySession.subject} — attendance</h4>
                  <div style={styles.gridScroll}>
                    <table style={styles.scheduleTable}>
                      <thead><tr><th>Name</th><th>Roll No.</th><th>Batch</th><th>Status</th></tr></thead>
                      <tbody>
                        {historyRoster.map((student) => (
                          <tr key={student._id}>
                            <td>{student.name}</td><td>{student.rollNo || '—'}</td><td>{student.batch || '—'}</td>
                            <td><span style={student.status === 'present' ? styles.presentBadge : styles.absentBadge}>{student.status === 'present' ? 'Present' : 'Absent'}</span></td>
                          </tr>
                        ))}
                        {historyRoster.length === 0 && <tr><td colSpan="4" style={styles.emptyState}>No students found for this class's batch.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Add Faculty Modal */}
        {showAddModal && (
          <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3>➕ Add New Faculty</h3>
                <button onClick={() => setShowAddModal(false)} style={styles.closeBtn}>✕</button>
              </div>
              <form onSubmit={handleAddFaculty} style={styles.form}>
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={styles.formInput}
                  required
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={styles.formInput}
                  required
                />
                <input
                  type="password"
                  placeholder="Password (min 6 chars) *"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  style={styles.formInput}
                  required
                  minLength="6"
                />
                <input
                  type="text"
                  placeholder="Department *"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  style={styles.formInput}
                  required
                />
                <input
                  type="text"
                  placeholder="Phone Number *"
                  value={formData.phoneNo}
                  onChange={(e) => setFormData({...formData, phoneNo: e.target.value})}
                  style={styles.formInput}
                  required
                />
                <input
                  type="text"
                  placeholder="Teacher No. * (Unique)"
                  value={formData.teacherNo}
                  onChange={(e) => setFormData({...formData, teacherNo: e.target.value})}
                  style={styles.formInput}
                  required
                />
                <input
                  type="url"
                  placeholder="Timetable Image URL"
                  value={formData.timetableImage}
                  onChange={(e) => setFormData({...formData, timetableImage: e.target.value})}
                  style={styles.formInput}
                />
                {formData.timetableImage && (
                  <div style={styles.previewContainer}>
                    <img 
                      src={formData.timetableImage} 
                      alt="Timetable Preview" 
                      style={styles.previewImage}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/200x150/ff0000/FFFFFF?text=Invalid+URL';
                      }}
                    />
                  </div>
                )}
                <div style={styles.formButtons}>
                  <button type="button" onClick={() => setShowAddModal(false)} style={styles.cancelBtn}>
                    Cancel
                  </button>
                  <button type="submit" style={styles.submitBtn} disabled={formLoading}>
                    {formLoading ? 'Adding...' : '➕ Add Faculty'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Faculty Modal */}
        {showEditModal && selectedFaculty && (
          <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3>✏️ Edit Faculty</h3>
                <button onClick={() => setShowEditModal(false)} style={styles.closeBtn}>✕</button>
              </div>
              <form onSubmit={handleUpdateFaculty} style={styles.form}>
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={styles.formInput}
                  required
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={styles.formInput}
                  required
                />
                <input
                  type="password"
                  placeholder="New Password (leave blank to keep current)"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  style={styles.formInput}
                  minLength="6"
                />
                <input
                  type="text"
                  placeholder="Department *"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  style={styles.formInput}
                  required
                />
                <input
                  type="text"
                  placeholder="Phone Number *"
                  value={formData.phoneNo}
                  onChange={(e) => setFormData({...formData, phoneNo: e.target.value})}
                  style={styles.formInput}
                  required
                />
                <input
                  type="text"
                  placeholder="Teacher No. * (Unique)"
                  value={formData.teacherNo}
                  onChange={(e) => setFormData({...formData, teacherNo: e.target.value})}
                  style={styles.formInput}
                  required
                />
                <input
                  type="url"
                  placeholder="Timetable Image URL"
                  value={formData.timetableImage}
                  onChange={(e) => setFormData({...formData, timetableImage: e.target.value})}
                  style={styles.formInput}
                />
                {formData.timetableImage && (
                  <div style={styles.previewContainer}>
                    <img 
                      src={formData.timetableImage} 
                      alt="Timetable Preview" 
                      style={styles.previewImage}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/200x150/ff0000/FFFFFF?text=Invalid+URL';
                      }}
                    />
                  </div>
                )}
                <div style={styles.formButtons}>
                  <button type="button" onClick={() => setShowEditModal(false)} style={styles.cancelBtn}>
                    Cancel
                  </button>
                  <button type="submit" style={styles.submitBtn} disabled={formLoading}>
                    {formLoading ? 'Updating...' : '💾 Update Faculty'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Schedule (Timetable) Modal */}
        {showScheduleModal && scheduleFaculty && (
          <div style={styles.modalOverlay} onClick={() => setShowScheduleModal(false)}>
            <div style={styles.scheduleModal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3>🗓️ Class Schedule — {scheduleFaculty.name}</h3>
                <button onClick={() => setShowScheduleModal(false)} style={styles.closeBtn}>✕</button>
              </div>

              {scheduleMsg && (
                <div style={scheduleMsg.startsWith('✅') ? styles.success : styles.error}>
                  {scheduleMsg}
                </div>
              )}

              {scheduleLoading ? (
                <div style={styles.emptyGridMsg}>⏳ Loading latest schedule…</div>
              ) : (
              <>
              {/* Add new time slot row */}
              <div style={styles.addSlotRow}>
                <span style={styles.addSlotLabel}>Add time slot:</span>
                <input
                  type="time"
                  value={newSlotStart}
                  onChange={(e) => setNewSlotStart(e.target.value)}
                  style={styles.timeInput}
                />
                <span>to</span>
                <input
                  type="time"
                  value={newSlotEnd}
                  onChange={(e) => setNewSlotEnd(e.target.value)}
                  style={styles.timeInput}
                />
                <button onClick={handleAddTimeSlot} style={styles.addSlotBtn}>+ Add Slot</button>
                <span style={styles.hintText}>Click a slot header to rename it, click × to remove it.</span>
              </div>

              {/* The grid */}
              <div style={styles.gridScroll}>
                <table style={styles.scheduleTable}>
                  <thead>
                    <tr>
                      <th style={styles.cornerCell}>Day / Time</th>
                      {timeSlots.map((slot) => (
                        <th key={slot} style={styles.slotHeaderCell}>
                          <div style={styles.slotHeaderInner}>
                            <span
                              style={styles.slotHeaderText}
                              onClick={() => handleRenameTimeSlot(slot)}
                              title="Click to edit this time slot"
                            >
                              {slot}
                            </span>
                            <span
                              style={styles.removeSlotX}
                              onClick={() => handleRemoveTimeSlot(slot)}
                              title="Remove this time slot"
                            >
                              ×
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.length === 0 ? (
                      <tr>
                        <td style={styles.dayCell}>—</td>
                        <td style={styles.emptyGridMsg}>Add a time slot above to start building the schedule.</td>
                      </tr>
                    ) : (
                      DAYS.map((day) => (
                        <tr key={day}>
                          <td style={styles.dayCell}>{day}</td>
                          {timeSlots.map((slot) => {
                            const lecture = scheduleData[day]?.[slot];
                            return (
                              <td key={slot} style={styles.gridCell}>
                                {lecture ? (
                                  <div style={styles.lectureBlock} onClick={() => openLectureForm(day, slot)}>
                                    <div style={styles.lectureSubject}>{lecture.subject}</div>
                                    {lecture.venue && <div style={styles.lectureVenue}>📍 {lecture.venue}</div>}
                                    {Array.isArray(lecture.batches) && lecture.batches.length > 0 ? (
                                      <div style={styles.lectureBatches}>🎯 {lecture.batches.join(', ')}</div>
                                    ) : (
                                      <div style={styles.lectureBatchesAll}>🌐 All batches</div>
                                    )}
                                  </div>
                                ) : (
                                  <button style={styles.addLectureBtn} onClick={() => openLectureForm(day, slot)}>
                                    + Add Lecture
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              </>
              )}

              <div style={styles.formButtons}>
                <button type="button" onClick={() => setShowScheduleModal(false)} style={styles.cancelBtn}>
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  style={styles.submitBtn}
                  disabled={scheduleSaving || scheduleLoading}
                >
                  {scheduleSaving ? 'Saving...' : scheduleLoading ? 'Loading...' : '💾 Save Schedule'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add / Edit Lecture Mini Modal */}
        {editingCell && (
          <div style={styles.modalOverlay} onClick={closeLectureForm}>
            <div style={styles.lectureModal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3>📘 {editingCell.day} · {editingCell.slot}</h3>
                <button onClick={closeLectureForm} style={styles.closeBtn}>✕</button>
              </div>
              <div style={styles.form}>
                <input
                  type="text"
                  placeholder="Lecture / Subject Name *"
                  value={lectureForm.subject}
                  onChange={(e) => setLectureForm({ ...lectureForm, subject: e.target.value })}
                  style={styles.formInput}
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Venue / Room (optional)"
                  value={lectureForm.venue}
                  onChange={(e) => setLectureForm({ ...lectureForm, venue: e.target.value })}
                  style={styles.formInput}
                />

                <div style={styles.batchToggleLabel}>
                  Batches — {lectureForm.batches.length === 0
                    ? 'none selected = visible to ALL students'
                    : `${lectureForm.batches.length} selected`}
                </div>
                <div style={styles.batchToggleGrid}>
                  {BATCH_CODES.map((code) => {
                    const active = lectureForm.batches.includes(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => toggleLectureBatch(code)}
                        style={active ? styles.batchPillActive : styles.batchPill}
                      >
                        {code}
                      </button>
                    );
                  })}
                </div>

                <div style={styles.formButtons}>
                  {scheduleData[editingCell.day]?.[editingCell.slot] && (
                    <button type="button" onClick={handleRemoveLecture} style={styles.deleteBtn}>
                      🗑️ Remove
                    </button>
                  )}
                  <button type="button" onClick={closeLectureForm} style={styles.cancelBtn}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleSaveLecture} style={styles.submitBtn}>
                    💾 Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1300px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '1px solid #eee',
    marginTop: '20px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  title: {
    margin: 0,
    color: '#2c3e50',
  },
  subtitle: {
    margin: '5px 0 0',
    color: '#666',
    fontSize: '14px',
  },
  headerStats: {
    display: 'flex',
    gap: '10px',
  },
  statPill: {
    padding: '8px 16px',
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
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
  refreshBtn: {
    padding: '12px 24px',
    backgroundColor: '#9E9E9E',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  historyBtn: {
    padding: '12px 24px',
    backgroundColor: '#3f51b5',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  historyItem: {
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    padding: '14px',
    border: '1px solid #dce2f0',
    borderRadius: '8px',
    backgroundColor: '#f8faff',
    cursor: 'pointer',
    color: '#2c3e50',
    fontSize: '14px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#3f51b5',
    cursor: 'pointer',
    padding: '0 0 12px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  presentBadge: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '4px 10px',
    borderRadius: '12px',
    fontWeight: 'bold',
    fontSize: '12px',
  },
  absentBadge: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '4px 10px',
    borderRadius: '12px',
    fontWeight: 'bold',
    fontSize: '12px',
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
    minWidth: '1000px',
  },
  passwordText: {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#666',
  },
  departmentBadge: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  timetableThumb: {
    width: '50px',
    height: '40px',
    objectFit: 'cover',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  noImage: {
    color: '#999',
    fontSize: '12px',
  },
  actionsCell: {
    display: 'flex',
    gap: '5px',
    flexWrap: 'wrap',
  },
  editBtn: {
    padding: '4px 12px',
    backgroundColor: '#FF9800',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '12px',
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
  scheduleBtn: {
    padding: '4px 12px',
    backgroundColor: '#3f51b5',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  scheduleModal: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '10px',
    maxWidth: '95vw',
    width: '1100px',
    maxHeight: '92vh',
    overflow: 'auto',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },
  lectureModal: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '10px',
    maxWidth: '420px',
    width: '90%',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },
  addSlotRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#f5f6fa',
    borderRadius: '8px',
  },
  addSlotLabel: {
    fontWeight: 'bold',
    color: '#2c3e50',
    fontSize: '14px',
  },
  timeInput: {
    padding: '6px 8px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  addSlotBtn: {
    padding: '7px 14px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  hintText: {
    marginLeft: 'auto',
    fontSize: '12px',
    color: '#888',
    fontStyle: 'italic',
  },
  gridScroll: {
    overflow: 'auto',
    border: '1px solid #eee',
    borderRadius: '8px',
  },
  scheduleTable: {
    borderCollapse: 'collapse',
    width: '100%',
    minWidth: '700px',
  },
  cornerCell: {
    position: 'sticky',
    left: 0,
    zIndex: 2,
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '10px',
    minWidth: '110px',
    border: '1px solid #ddd',
  },
  slotHeaderCell: {
    backgroundColor: '#3f51b5',
    color: 'white',
    padding: '0',
    minWidth: '140px',
    border: '1px solid #ddd',
  },
  slotHeaderInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 8px',
    gap: '6px',
  },
  slotHeaderText: {
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  removeSlotX: {
    cursor: 'pointer',
    fontSize: '16px',
    lineHeight: '16px',
    opacity: 0.8,
    padding: '0 4px',
  },
  dayCell: {
    position: 'sticky',
    left: 0,
    zIndex: 1,
    backgroundColor: '#eef1fb',
    color: '#2c3e50',
    fontWeight: 'bold',
    padding: '10px',
    border: '1px solid #ddd',
    whiteSpace: 'nowrap',
  },
  gridCell: {
    border: '1px solid #eee',
    padding: '6px',
    textAlign: 'center',
    verticalAlign: 'middle',
    minWidth: '140px',
  },
  addLectureBtn: {
    width: '100%',
    padding: '10px 4px',
    backgroundColor: 'transparent',
    color: '#3f51b5',
    border: '1px dashed #c5cae9',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  lectureBlock: {
    backgroundColor: '#e8eaf6',
    border: '1px solid #c5cae9',
    borderRadius: '6px',
    padding: '8px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  lectureSubject: {
    fontWeight: 'bold',
    fontSize: '13px',
    color: '#283593',
  },
  lectureVenue: {
    fontSize: '11px',
    color: '#5c6bc0',
    marginTop: '2px',
  },
  lectureBatches: {
    fontSize: '10px',
    color: '#00695c',
    marginTop: '4px',
    fontWeight: 'bold',
  },
  lectureBatchesAll: {
    fontSize: '10px',
    color: '#888',
    marginTop: '4px',
    fontStyle: 'italic',
  },
  batchToggleLabel: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: '4px',
  },
  batchToggleGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  batchPill: {
    padding: '5px 10px',
    borderRadius: '14px',
    border: '1px solid #ddd',
    backgroundColor: '#f5f6fa',
    color: '#555',
    fontSize: '12px',
    cursor: 'pointer',
  },
  batchPillActive: {
    padding: '5px 10px',
    borderRadius: '14px',
    border: '1px solid #3f51b5',
    backgroundColor: '#3f51b5',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  emptyGridMsg: {
    padding: '20px',
    color: '#999',
    fontStyle: 'italic',
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
    maxWidth: '550px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
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
  previewContainer: {
    marginTop: '4px',
  },
  previewImage: {
    width: '100%',
    maxHeight: '150px',
    objectFit: 'contain',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px',
    borderRadius: '5px',
    marginBottom: '20px',
  },
  success: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '12px',
    borderRadius: '5px',
    marginBottom: '20px',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 'calc(100vh - 70px)',
    fontSize: '18px',
    color: '#666',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
    fontSize: '16px',
  },
};

export default FacultyList;
