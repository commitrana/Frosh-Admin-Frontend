import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getFacultyList } from '../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// "09:00 - 10:00" -> 540 (minutes since midnight), used purely for sorting
// the union of every faculty member's time slots into chronological order.
const parseStartMinutes = (label) => {
  const match = /^(\d{1,2}):(\d{2})/.exec((label || '').trim());
  if (!match) return Number.MAX_SAFE_INTEGER;
  const [, h, m] = match;
  return parseInt(h, 10) * 60 + parseInt(m, 10);
};

const AdminMasterTimetable = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeDay, setActiveDay] = useState('all'); // 'all' or one of DAYS
  const navigate = useNavigate();

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      setError('');
      const data = await getFacultyList();
      setFaculty(data.faculty || []);
    } catch (err) {
      console.error('❌ Error fetching faculty schedules:', err);
      setError('Failed to load the timetable. Pull to refresh or try again.');
      if (err.response?.status === 401) {
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFaculty();
  };

  // Union of every time slot label used by any faculty member, sorted by start time.
  // Different faculty can define their own slot labels, so this is a best-effort
  // merge of whatever labels actually exist in the data.
  const timeSlots = useMemo(() => {
    const set = new Set();
    faculty.forEach((f) => {
      const slots = f.timetable?.timeSlots;
      if (Array.isArray(slots)) slots.forEach((s) => s && set.add(s));
    });
    return Array.from(set).sort((a, b) => parseStartMinutes(a) - parseStartMinutes(b));
  }, [faculty]);

  // sessions[day][slot] = [{ facultyName, subject, venue, batches }, ...]
  const sessions = useMemo(() => {
    const map = {};
    DAYS.forEach((d) => { map[d] = {}; });
    faculty.forEach((f) => {
      const schedule = f.timetable?.schedule;
      if (!schedule || typeof schedule !== 'object' || Array.isArray(schedule)) return;
      Object.keys(schedule).forEach((day) => {
        if (!map[day]) map[day] = {};
        const daySchedule = schedule[day] || {};
        Object.keys(daySchedule).forEach((slot) => {
          const lecture = daySchedule[slot];
          if (!lecture || !lecture.subject) return;
          if (!map[day][slot]) map[day][slot] = [];
          map[day][slot].push({
            facultyName: f.name || 'Unnamed Faculty',
            subject: lecture.subject,
            venue: lecture.venue || '',
            batches: Array.isArray(lecture.batches) ? lecture.batches : []
          });
        });
      });
    });
    return map;
  }, [faculty]);

  const totalClasses = useMemo(() => {
    let count = 0;
    Object.values(sessions).forEach((daySlots) => {
      Object.values(daySlots).forEach((arr) => { count += arr.length; });
    });
    return count;
  }, [sessions]);

  const facultyWithSchedules = useMemo(
    () => faculty.filter((f) => f.timetable?.schedule && Object.keys(f.timetable.schedule).length > 0).length,
    [faculty]
  );

  const visibleDays = activeDay === 'all' ? DAYS : [activeDay];

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner} />
          <p style={styles.loadingText}>Loading timetable...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.pageTitle}>📅 Dashboard</h1>
            <p style={styles.pageSubtitle}>
              Every faculty member's class schedule, combined into one weekly timetable
            </p>
          </div>
          <button
            onClick={handleRefresh}
            style={styles.refreshBtn}
            className="refresh-btn"
            disabled={refreshing}
          >
            {refreshing ? '⏳ Refreshing…' : '🔄 Refresh'}
          </button>
        </div>

        {/* Stats */}
        <div style={styles.stats}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>👨‍🏫</div>
            <div style={styles.statContent}>
              <h3 style={styles.statLabel}>Faculty With Schedules</h3>
              <p style={styles.statNumber}>{facultyWithSchedules}</p>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📚</div>
            <div style={styles.statContent}>
              <h3 style={styles.statLabel}>Classes This Week</h3>
              <p style={styles.statNumber}>{totalClasses}</p>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>⏰</div>
            <div style={styles.statContent}>
              <h3 style={styles.statLabel}>Time Slots</h3>
              <p style={styles.statNumber}>{timeSlots.length}</p>
            </div>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* Day filter */}
        <div style={styles.dayTabs}>
          <button
            onClick={() => setActiveDay('all')}
            style={activeDay === 'all' ? styles.dayTabActive : styles.dayTab}
            className={activeDay === 'all' ? 'day-tab-active' : 'day-tab'}
          >
            Full Week
          </button>
          {DAYS.map((d) => (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              style={activeDay === d ? styles.dayTabActive : styles.dayTab}
              className={activeDay === d ? 'day-tab-active' : 'day-tab'}
            >
              {d}
            </button>
          ))}
        </div>

        {timeSlots.length === 0 ? (
          <div style={styles.emptyStateBox}>
            <div style={styles.emptyIcon}>🗓️</div>
            <p style={styles.emptyTitle}>No classes scheduled yet</p>
            <p style={styles.emptySubtitle}>
              Add lecture slots for a faculty member from the Faculty tab and they'll show up here automatically.
            </p>
          </div>
        ) : (
          <div style={styles.gridWrapper}>
            <table style={styles.timetableTable}>
              <thead>
                <tr>
                  <th style={styles.timeHeaderCell}>Time</th>
                  {visibleDays.map((day) => (
                    <th key={day} style={styles.dayHeaderCell}>{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot, rowIdx) => (
                  <tr key={slot}>
                    <td style={{
                      ...styles.timeCell,
                      backgroundColor: rowIdx % 2 === 0 ? '#FAFBFF' : '#FFFFFF'
                    }}>
                      {slot}
                    </td>
                    {visibleDays.map((day) => {
                      const entries = sessions[day]?.[slot] || [];
                      return (
                        <td
                          key={day + slot}
                          style={{
                            ...styles.classCell,
                            backgroundColor: rowIdx % 2 === 0 ? '#FAFBFF' : '#FFFFFF'
                          }}
                        >
                          {entries.length === 0 ? (
                            <span style={styles.emptyCellDash}>—</span>
                          ) : (
                            <div style={styles.classCellStack}>
                              {entries.map((entry, idx) => (
                                <div key={idx} style={styles.classCard}>
                                  <div style={styles.classTitle}>{entry.subject}</div>
                                  {entry.venue && (
                                    <div style={styles.classMeta}>📍 {entry.venue}</div>
                                  )}
                                  <div style={styles.classMeta}>👤 {entry.facultyName}</div>
                                  {entry.batches.length > 0 && (
                                    <div style={styles.batchTags}>
                                      {entry.batches.map((b) => (
                                        <span key={b} style={styles.batchTag}>{b}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#F9FAFB',
    minHeight: 'calc(100vh - 64px)'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 64px)',
    backgroundColor: '#F9FAFB',
    padding: '40px'
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(102, 126, 234, 0.2)',
    borderTop: '3px solid #667eea',
    borderRadius: '50%',
    animation: 'timetable-spin 0.8s linear infinite'
  },
  loadingText: {
    color: '#4B5563',
    marginTop: '16px',
    fontSize: '16px',
    fontWeight: '500'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '12px',
    marginTop: '20px',
    marginBottom: '20px'
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1F2937',
    margin: '0 0 4px 0'
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0
  },
  refreshBtn: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '20px'
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
  error: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    padding: '10px 14px',
    borderRadius: '8px',
    marginBottom: '16px',
    border: '1px solid #FCA5A5'
  },
  dayTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    backgroundColor: 'white',
    padding: '6px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #E5E7EB'
  },
  dayTab: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#6B7280',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s ease'
  },
  dayTabActive: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
  },
  gridWrapper: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'auto',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #E5E7EB',
    marginBottom: '20px'
  },
  timetableTable: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '900px'
  },
  timeHeaderCell: {
    position: 'sticky',
    left: 0,
    zIndex: 2,
    backgroundColor: '#1F2937',
    color: 'white',
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '600',
    minWidth: '130px',
    borderRight: '1px solid rgba(255,255,255,0.15)'
  },
  dayHeaderCell: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '600',
    minWidth: '220px'
  },
  timeCell: {
    position: 'sticky',
    left: 0,
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '1px solid #F3F4F6',
    borderRight: '1px solid #E5E7EB',
    verticalAlign: 'top',
    whiteSpace: 'nowrap'
  },
  classCell: {
    padding: '10px',
    borderBottom: '1px solid #F3F4F6',
    borderRight: '1px solid #F3F4F6',
    verticalAlign: 'top',
    minWidth: '220px'
  },
  classCellStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  emptyCellDash: {
    color: '#D1D5DB',
    fontSize: '14px',
    paddingLeft: '4px'
  },
  classCard: {
    backgroundColor: '#F5F3FF',
    border: '1px solid #DDD6FE',
    borderLeft: '3px solid #667eea',
    borderRadius: '8px',
    padding: '8px 10px'
  },
  classTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: '3px'
  },
  classMeta: {
    fontSize: '12px',
    color: '#4B5563',
    lineHeight: '1.5'
  },
  batchTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginTop: '6px'
  },
  batchTag: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#5B21B6',
    backgroundColor: '#EDE9FE',
    padding: '2px 7px',
    borderRadius: '10px'
  },
  emptyStateBox: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
  },
  emptyIcon: {
    fontSize: '40px',
    marginBottom: '12px'
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1F2937',
    margin: '0 0 6px 0'
  },
  emptySubtitle: {
    fontSize: '14px',
    color: '#9CA3AF',
    margin: 0
  }
};

// Scoped animation + hover states (mirrors the pattern used in AdminDashboard.jsx)
const styleElement = document.createElement('style');
styleElement.textContent = `
  @keyframes timetable-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .refresh-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  .day-tab:hover {
    background-color: #F3F4F6;
  }
  .day-tab-active:hover {
    opacity: 0.9;
  }
`;
if (!document.head.querySelector('style[data-timetable-styles]')) {
  styleElement.setAttribute('data-timetable-styles', 'true');
  document.head.appendChild(styleElement);
}

export default AdminMasterTimetable;