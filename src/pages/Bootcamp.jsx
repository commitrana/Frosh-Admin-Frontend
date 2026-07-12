import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import {
  getBootcampList,
  importBootcampCSV,
  shuffleBootcampBatches,
  updateStudentBatch
} from '../services/api';

const COLOR_STYLES = {
  Red: '#e53935', Blue: '#1e88e5', Black: '#333333', Pink: '#ec407a',
  Purple: '#8e24aa', Yellow: '#fdd835', Green: '#43a047', Orange: '#fb8c00',
  White: '#9e9e9e', Brown: '#6d4c41',
};

const getBatchColor = (batch) => {
  if (!batch) return '#999';
  const color = batch.replace(/[AB]$/, '');
  return COLOR_STYLES[color] || '#666';
};

// Same tolerant CSV line parser used on the Student List page (handles quoted commas)
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

const Bootcamp = () => {
  const [students, setStudents] = useState([]);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const fileInputRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getBootcampList();
      const list = data.students || [];
      setStudents(list);
      setVerifiedCount(data.verifiedCount || 0);
      const initialEdits = {};
      list.forEach((s) => { initialEdits[s._id] = s.batch || ''; });
      setEditValues(initialEdits);
    } catch (err) {
      setMessage('❌ Failed to load bootcamp data');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter((line) => line.trim());

        if (lines.length < 2) {
          setMessage('❌ CSV file is empty or invalid');
          setMessageType('error');
          return;
        }

        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
        const rows = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          const row = {};
          headers.forEach((header, index) => {
            if (index < values.length) row[header] = values[index];
          });
          if (row.name && row.email) rows.push(row);
        }

        if (rows.length === 0) {
          setMessage('❌ No valid rows found in CSV (need at least name + email columns)');
          setMessageType('error');
          return;
        }

        if (!window.confirm(`Import ${rows.length} students into the Bootcamp roster?`)) {
          return;
        }

        setImporting(true);
        const result = await importBootcampCSV(rows);
        setMessage(`✅ ${result.message}`);
        setMessageType('success');
        fetchData();
      } catch (err) {
        setMessage(`❌ ${err.response?.data?.error || 'Failed to import CSV'}`);
        setMessageType('error');
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleShuffle = async () => {
    if (!window.confirm('This will randomly redistribute EVERYONE in the roster across the 20 batches, overwriting current assignments. Continue?')) {
      return;
    }
    setShuffling(true);
    setMessage('');
    try {
      const result = await shuffleBootcampBatches();
      setMessage(`✅ ${result.message}`);
      setMessageType('success');
      fetchData();
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.error || 'Failed to shuffle batches'}`);
      setMessageType('error');
    } finally {
      setShuffling(false);
    }
  };

  const handleInputChange = (id, value) => {
    setEditValues((prev) => ({ ...prev, [id]: value }));
  };

  const saveBatch = async (id) => {
    const newBatch = (editValues[id] || '').trim();
    const student = students.find((s) => s._id === id);

    if (student && newBatch === (student.batch || '')) return;

    setSavingId(id);
    setMessage('');
    try {
      await updateStudentBatch(id, newBatch || null);
      setStudents((prev) =>
        prev.map((s) => (s._id === id ? { ...s, batch: newBatch || null } : s))
      );
      setMessage('✅ Batch updated');
      setMessageType('success');
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.error || 'Failed to update batch'}`);
      setMessageType('error');
      setEditValues((prev) => ({ ...prev, [id]: student?.batch || '' }));
    } finally {
      setSavingId(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur();
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <Navbar />

      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>🏕️ Bootcamp</h1>
          <p style={styles.subtitle}>Imported roster — batch is freely editable, type any of the 20 codes</p>
        </div>
        <div style={styles.headerStats}>
          <span style={styles.statPill}>Total: {students.length}</span>
          <span style={styles.statPillGreen}>✅ Verified: {verifiedCount}</span>
        </div>
      </div>

      {message && (
        <div style={messageType === 'success' ? styles.success : styles.error}>{message}</div>
      )}

      <div style={styles.actions}>
        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={handleImportCSV}
          style={{ display: 'none' }}
        />
        <button onClick={handleImportClick} style={styles.importBtn} disabled={importing}>
          {importing ? 'Importing...' : '📤 Import Now (CSV)'}
        </button>
        <button onClick={handleShuffle} style={styles.shuffleBtn} disabled={shuffling || students.length === 0}>
          {shuffling ? 'Shuffling...' : '🎲 Shuffle All Into Batches'}
        </button>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone No.</th>
              <th>Batch</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan="6" style={styles.emptyState}>
                  No students imported yet. Click "Import Now (CSV)" to upload the bootcamp roster.
                </td>
              </tr>
            ) : (
              students.map((student, index) => (
                <tr key={student._id}>
                  <td>{index + 1}</td>
                  <td><strong>{student.name}</strong></td>
                  <td>{student.email}</td>
                  <td>{student.phoneNo || '-'}</td>
                  <td>
                    <div style={styles.batchCell}>
                      <span
                        style={{ ...styles.batchDot, backgroundColor: getBatchColor(editValues[student._id]) }}
                      />
                      <input
                        type="text"
                        value={editValues[student._id] ?? ''}
                        onChange={(e) => handleInputChange(student._id, e.target.value)}
                        onBlur={() => saveBatch(student._id)}
                        onKeyDown={handleKeyDown}
                        disabled={savingId === student._id}
                        placeholder="e.g. RedA"
                        style={styles.batchInput}
                      />
                      {savingId === student._id && <span style={styles.savingText}>saving...</span>}
                    </div>
                  </td>
                  <td>
                    {student.verified ? (
                      <span style={styles.verifiedBadge}>✅ Verified</span>
                    ) : (
                      <span style={styles.unverifiedBadge}>⚠️ Not in Student List</span>
                    )}
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
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
  },
  loading: {
    padding: '50px',
    textAlign: 'center',
    fontSize: '18px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 30px 0',
  },
  title: {
    margin: 0,
    fontSize: '28px',
  },
  subtitle: {
    margin: '5px 0 0',
    color: '#666',
  },
  headerStats: {
    display: 'flex',
    gap: '10px',
  },
  statPill: {
    backgroundColor: '#ede7f6',
    color: '#4527a0',
    padding: '8px 16px',
    borderRadius: '20px',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  statPillGreen: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '8px 16px',
    borderRadius: '20px',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  success: {
    margin: '15px 30px 0',
    padding: '12px 20px',
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    borderRadius: '8px',
  },
  error: {
    margin: '15px 30px 0',
    padding: '12px 20px',
    backgroundColor: '#ffebee',
    color: '#c62828',
    borderRadius: '8px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    padding: '20px 30px',
  },
  importBtn: {
    padding: '12px 20px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  shuffleBtn: {
    padding: '12px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  tableContainer: {
    backgroundColor: 'white',
    margin: '0 30px 30px',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '800px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#888',
  },
  batchCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  batchDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '1px solid rgba(0,0,0,0.15)',
    flexShrink: 0,
  },
  batchInput: {
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '13px',
    width: '110px',
  },
  savingText: {
    fontSize: '11px',
    color: '#999',
    fontStyle: 'italic',
  },
  verifiedBadge: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  unverifiedBadge: {
    backgroundColor: '#fff3e0',
    color: '#e65100',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
};

export default Bootcamp;