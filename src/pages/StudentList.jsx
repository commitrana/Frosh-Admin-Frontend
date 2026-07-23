import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { 
  getAllStudents,
  updateStudent,
  bulkUpdateStudents,
  deleteStudent,
  bulkDeleteStudents,
  exportStudents,
  importStudents,
  generateStudentPassword,
  generateAllPasswords,
  createStudent  
} from '../services/api';

// Column configuration
const STUDENT_COLUMNS = [
  { key: 'name', label: 'Name', sortable: true, editable: true, width: '150px' },
  { key: 'email', label: 'Email', sortable: true, editable: true, width: '200px' },
  { key: 'password', label: 'Password', sortable: false, editable: false, width: '180px' },
  { key: 'branch', label: 'Branch', sortable: true, editable: true, width: '120px' },
  { key: 'phoneNo', label: 'Phone No.', sortable: true, editable: true, width: '130px' },
  { key: 'fatherName', label: 'Father Name', sortable: true, editable: true, width: '150px' },
  { key: 'motherName', label: 'Mother Name', sortable: true, editable: true, width: '150px' },
  { key: 'dob', label: 'DOB', sortable: true, editable: true, width: '110px', 
    render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A' 
  },
  { key: 'rollNo', label: 'Roll No', sortable: true, editable: true, width: '120px' },
];

const StudentList = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    branch: '',
    phoneNo: '',
    dob: '',
    fatherName: '',
    motherName: '',
    rollNo: '',
    slotNumber: 1
  });
  const [addLoading, setAddLoading] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Fetch students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  // --- Fetch Students ---
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await getAllStudents();
      setAllStudents(data.students || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch students');
      if (err.response?.status === 401) {
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Add New Student ---
  const handleAddStudent = async (e) => {
    e.preventDefault();
    
    const requiredFields = ['name', 'email', 'branch', 'phoneNo', 'dob', 'fatherName', 'motherName', 'rollNo'];
    const missing = requiredFields.filter(field => !newStudent[field]);
    
    if (missing.length > 0) {
      setError(`❌ Please fill all fields: ${missing.join(', ')}`);
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    try {
      setAddLoading(true);
      const result = await createStudent(newStudent);
      
      alert(`✅ Student added successfully!\n\nName: ${result.student.name}\nEmail: ${result.student.email}\nRoll No: ${result.student.rollNo}`);
      
      setShowAddModal(false);
      setNewStudent({
        name: '',
        email: '',
        branch: '',
        phoneNo: '',
        dob: '',
        fatherName: '',
        motherName: '',
        rollNo: '',
        slotNumber: 1
      });
      fetchStudents();
      setSuccess(`✅ ${result.student.name} added successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      setError(`❌ Failed to add student: ${errorMessage}`);
      setTimeout(() => setError(''), 3000);
    } finally {
      setAddLoading(false);
    }
  };

  // --- Go to Bottom ---
  const scrollToBottom = () => {
    const tableContainer = document.querySelector('[data-table-container]');
    if (tableContainer) {
      tableContainer.scrollTo({
        top: tableContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Filter and Sort
  const filteredData = useMemo(() => {
    if (!searchTerm) return allStudents;
    const lowerSearch = searchTerm.toLowerCase();
    return allStudents.filter(student => 
      student.name?.toLowerCase().includes(lowerSearch) ||
      student.email?.toLowerCase().includes(lowerSearch) ||
      student.branch?.toLowerCase().includes(lowerSearch) ||
      student.rollNo?.toLowerCase().includes(lowerSearch) ||
      student.fatherName?.toLowerCase().includes(lowerSearch) ||
      student.motherName?.toLowerCase().includes(lowerSearch)
    );
  }, [allStudents, searchTerm]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'dob') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // --- Generate Password Function ---
  const handleGeneratePassword = async (studentId) => {
    try {
      const result = await generateStudentPassword(studentId);
      alert(`✅ Password generated successfully!\n\nStudent: ${result.student.name}\nEmail: ${result.student.email}\nNew Password: ${result.password}\n\n📋 Please copy this password and share with the student.`);
      fetchStudents();
      setSuccess(`✅ Password generated for ${result.student.name}!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error generating password:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      setError(`❌ Failed to generate password: ${errorMessage}`);
      setTimeout(() => setError(''), 5000);
    }
  };

  // --- Generate All Passwords Function ---
  const handleGenerateAllPasswords = async () => {
    const studentsWithPassword = allStudents.filter(s => s.password && s.password.length > 0);
    
    let confirmMessage = '⚠️ Are you sure you want to generate passwords for ALL students?\n\n';
    
    if (studentsWithPassword.length > 0) {
      confirmMessage += `📌 ${studentsWithPassword.length} students already have passwords.\n`;
      confirmMessage += `✅ These students will be SKIPPED and their passwords will NOT change.\n\n`;
      confirmMessage += `🆕 Only students WITHOUT passwords will get new ones.\n\n`;
    } else {
      confirmMessage += `✅ No students have passwords yet.\n`;
      confirmMessage += `🆕 All ${allStudents.length} students will get new passwords.\n\n`;
    }
    
    confirmMessage += `Do you want to continue?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      setLoading(true);
      const result = await generateAllPasswords();
      
      let alertMessage = `✅ Password Generation Complete!\n\n`;
      alertMessage += `📊 Total Students: ${result.totalStudents}\n`;
      alertMessage += `🆕 New Passwords Generated: ${result.generatedCount}\n`;
      alertMessage += `ℹ️ Already Had Passwords: ${result.alreadyHavePassword}\n`;
      
      if (result.errors && result.errors.length > 0) {
        alertMessage += `\n⚠️ Errors: ${result.errors.length}`;
      }
      
      alert(alertMessage);
      
      fetchStudents();
      setSuccess(`✅ Generated passwords for ${result.generatedCount} students!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error generating all passwords:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      setError(`❌ Failed to generate all passwords: ${errorMessage}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  // --- CSV Export Function ---
  const handleExportCSV = async () => {
    try {
      const blob = await exportStudents();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccess('✅ CSV exported successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('❌ Failed to export CSV');
      setTimeout(() => setError(''), 3000);
    }
  };

  // --- CSV Import Function ---
  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setError('❌ CSV file is empty or invalid');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const studentsData = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          const student = {};
          
          headers.forEach((header, index) => {
            if (index < values.length && values[index]) {
              const key = header.toLowerCase();
              student[key] = values[index].trim();
            }
          });

          if (student.name) {
            studentsData.push(student);
          }
        }

        if (studentsData.length === 0) {
          setError('❌ No valid data found in CSV');
          return;
        }

        if (window.confirm(`Import ${studentsData.length} students?`)) {
          const result = await importStudents(studentsData);
          setSuccess(`✅ ${result.message}`);
          fetchStudents();
          setTimeout(() => setSuccess(''), 3000);
        }
      } catch (err) {
        setError('❌ Failed to import CSV: ' + err.message);
        setTimeout(() => setError(''), 3000);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

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

  // --- Edit Cell Function ---
  const handleCellEdit = (studentId, columnKey, currentValue) => {
    setEditingCell({ studentId, columnKey });
    setEditValue(currentValue || '');
  };

  const handleCellSave = async (studentId, columnKey) => {
    try {
      await updateStudent(studentId, { [columnKey]: editValue });
      fetchStudents();
      setEditingCell(null);
      setEditValue('');
      setSuccess('✅ Student updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('❌ Failed to update student');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e, studentId, columnKey) => {
    if (e.key === 'Enter') {
      handleCellSave(studentId, columnKey);
    } else if (e.key === 'Escape') {
      handleCellCancel();
    }
  };

  // --- Bulk Edit ---
  const handleBulkEdit = () => {
    if (selectedStudents.length === 0) {
      setError('❌ Please select at least one student');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setShowBulkEdit(true);
  };

  const handleBulkUpdate = async (columnKey, value) => {
    try {
      const data = { [columnKey]: value };
      await bulkUpdateStudents(selectedStudents, data);
      setSelectedStudents([]);
      setShowBulkEdit(false);
      fetchStudents();
      setSuccess(`✅ Bulk updated successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('❌ Failed to bulk update');
      setTimeout(() => setError(''), 3000);
    }
  };

  // --- Delete Functions ---
  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await deleteStudent(studentId);
      fetchStudents();
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
      setSuccess('✅ Student deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('❌ Failed to delete student');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) {
      setError('❌ Please select at least one student');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!window.confirm(`Delete ${selectedStudents.length} selected students?`)) return;
    try {
      await bulkDeleteStudents(selectedStudents);
      setSelectedStudents([]);
      fetchStudents();
      setSuccess(`✅ Deleted ${selectedStudents.length} students!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('❌ Failed to delete students');
      setTimeout(() => setError(''), 3000);
    }
  };

  // --- Selection Handlers ---
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudents(sortedData.map(s => s._id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // --- Render Cell ---
  const renderCell = (student, column) => {
    const value = student[column.key];
    const isEditing = editingCell && editingCell.studentId === student._id && editingCell.columnKey === column.key;
    
    // Special handling for password column
    if (column.key === 'password') {
      return (
        <div style={styles.passwordContainer}>
          <span style={styles.passwordText}>
            {value ? value : 'No password'}
          </span>
          <button
            onClick={() => handleGeneratePassword(student._id)}
            style={styles.generateBtn}
            title="Generate New Password"
          >
            🔑 Generate
          </button>
        </div>
      );
    }
    
    if (isEditing) {
      return (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => handleCellSave(student._id, column.key)}
          onKeyDown={(e) => handleKeyDown(e, student._id, column.key)}
          autoFocus
          style={styles.editInput}
          placeholder={`Enter ${column.label}`}
        />
      );
    }
    
    if (column.render) {
      return column.render(value, student);
    }
    return value || 'N/A';
  };

  // Loading state with navbar visible
  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner} />
          <p style={styles.loadingText}>Loading students...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>👨‍🎓 Student List</h1>
            <p style={styles.subtitle}>Manage all students across societies</p>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.stats}>
              <span style={styles.statsBadge}>Total: {allStudents.length}</span>
              <span style={{...styles.statsBadge, backgroundColor: '#ECFDF5', color: '#065F46'}}>
                Showing: {sortedData.length}
              </span>
              {selectedStudents.length > 0 && (
                <span style={{...styles.statsBadge, backgroundColor: '#FEF3C7', color: '#92400E'}}>
                  Selected: {selectedStudents.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ERROR / SUCCESS */}
        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        {/* BULK EDIT MODAL */}
        {showBulkEdit && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>✏️ Bulk Edit Students</h3>
                <button onClick={() => setShowBulkEdit(false)} style={styles.closeBtn}>✕</button>
              </div>
              <p style={styles.modalSubtitle}>Update {selectedStudents.length} selected students</p>
              <div style={styles.bulkEditForm}>
                <select
                  onChange={(e) => {
                    const columnKey = e.target.value;
                    if (columnKey) {
                      const value = prompt(`Enter new value for ${STUDENT_COLUMNS.find(c => c.key === columnKey)?.label}:`);
                      if (value !== null) {
                        handleBulkUpdate(columnKey, value);
                      }
                    }
                  }}
                  style={styles.bulkEditSelect}
                  defaultValue=""
                >
                  <option value="">Select field to update...</option>
                  {STUDENT_COLUMNS.filter(col => col.editable !== false).map(col => (
                    <option key={col.key} value={col.key}>{col.label}</option>
                  ))}
                </select>
                <button onClick={() => setShowBulkEdit(false)} style={styles.cancelBtn}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* CONTROLS */}
        <div style={styles.controls}>
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="🔍 Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={styles.clearBtn}>✕</button>
            )}
          </div>
          <div style={styles.controlsRight}>
            <button 
              onClick={() => setShowAddModal(true)} 
              style={{...styles.actionBtn, backgroundColor: '#10B981'}}
            >
              ➕ Add Student
            </button>
            <button onClick={handleExportCSV} style={{...styles.actionBtn, backgroundColor: '#3B82F6'}}>
              📥 Export CSV
            </button>
            <button 
              onClick={() => fileInputRef.current.click()} 
              style={{...styles.actionBtn, backgroundColor: '#F59E0B'}}
            >
              📤 Import CSV
            </button>
            <button 
              onClick={handleGenerateAllPasswords} 
              style={{...styles.actionBtn, backgroundColor: '#8B5CF6'}}
            >
              🔑 Generate All Passwords
            </button>
            <button 
              onClick={scrollToBottom} 
              style={{...styles.actionBtn, backgroundColor: '#6B7280'}}
              title="Go to bottom of the list"
            >
              ⬇️ Go to Bottom
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              style={{ display: 'none' }}
            />
            {selectedStudents.length > 0 && (
              <>
                <button onClick={handleBulkEdit} style={{...styles.actionBtn, backgroundColor: '#3B82F6'}}>
                  ✏️ Bulk Edit
                </button>
                <button onClick={handleBulkDelete} style={{...styles.actionBtn, backgroundColor: '#EF4444'}}>
                  🗑️ Delete Selected
                </button>
              </>
            )}
            <button onClick={fetchStudents} style={{...styles.actionBtn, backgroundColor: '#9CA3AF'}}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div style={styles.tableContainer} data-table-container>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.checkboxCol}>
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={sortedData.length > 0 && selectedStudents.length === sortedData.length}
                    style={styles.checkbox}
                  />
                </th>
                <th style={styles.serialNo}>#</th>
                {STUDENT_COLUMNS.map(column => (
                  <th 
                    key={column.key}
                    style={{ 
                      ...styles.th, 
                      width: column.width || 'auto',
                      cursor: column.sortable ? 'pointer' : 'default'
                    }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    {column.label}
                    {column.sortable && (
                      <span style={styles.sortIcon}>
                        {sortConfig.key === column.key 
                          ? sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
                          : ' ⇅'
                        }
                      </span>
                    )}
                  </th>
                ))}
                <th style={styles.actionsCol}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={STUDENT_COLUMNS.length + 3} style={styles.emptyState}>
                    {searchTerm ? 'No students match your search.' : 'No students found.'}
                  </td>
                </tr>
              ) : (
                sortedData.map((student, index) => (
                  <tr key={student._id} style={{
                    ...styles.row,
                    backgroundColor: selectedStudents.includes(student._id) ? '#EFF6FF' : 'white'
                  }}>
                    <td style={styles.checkboxCol}>
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student._id)}
                        onChange={() => handleSelectStudent(student._id)}
                        style={styles.checkbox}
                      />
                    </td>
                    <td style={styles.serialNo}>{index + 1}</td>
                    {STUDENT_COLUMNS.map(column => (
                      <td 
                        key={column.key} 
                        style={{
                          ...styles.td,
                          cursor: column.editable !== false ? 'pointer' : 'default'
                        }}
                        onDoubleClick={() => {
                          if (column.editable !== false) {
                            handleCellEdit(student._id, column.key, student[column.key]);
                          }
                        }}
                      >
                        {renderCell(student, column)}
                      </td>
                    ))}
                    <td style={styles.actionsCol}>
                      <button
                        onClick={() => handleDeleteStudent(student._id)}
                        style={styles.deleteBtn}
                        title="Delete student"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ADD STUDENT MODAL */}
        {showAddModal && (
          <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
            <div style={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>➕ Add New Student</h2>
                <button 
                  onClick={() => setShowAddModal(false)} 
                  style={styles.closeBtn}
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleAddStudent} style={styles.addForm}>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Full Name *</label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                      style={styles.formInput}
                      required
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Email *</label>
                    <input
                      type="email"
                      placeholder="Enter email"
                      value={newStudent.email}
                      onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                      style={styles.formInput}
                      required
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Branch *</label>
                    <select
                      value={newStudent.branch}
                      onChange={(e) => setNewStudent({...newStudent, branch: e.target.value})}
                      style={styles.formInput}
                      required
                    >
                      <option value="">Select Branch</option>
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="ME">ME</option>
                      <option value="EE">EE</option>
                      <option value="CE">CE</option>
                      <option value="IT">IT</option>
                      <option value="AE">AE</option>
                      <option value="CH">CH</option>
                    </select>
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Phone No. *</label>
                    <input
                      type="text"
                      placeholder="Enter phone number"
                      value={newStudent.phoneNo}
                      onChange={(e) => setNewStudent({...newStudent, phoneNo: e.target.value})}
                      style={styles.formInput}
                      required
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Date of Birth *</label>
                    <input
                      type="date"
                      value={newStudent.dob}
                      onChange={(e) => setNewStudent({...newStudent, dob: e.target.value})}
                      style={styles.formInput}
                      required
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Roll No. *</label>
                    <input
                      type="text"
                      placeholder="Enter roll number"
                      value={newStudent.rollNo}
                      onChange={(e) => setNewStudent({...newStudent, rollNo: e.target.value})}
                      style={styles.formInput}
                      required
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Father's Name *</label>
                    <input
                      type="text"
                      placeholder="Enter father's name"
                      value={newStudent.fatherName}
                      onChange={(e) => setNewStudent({...newStudent, fatherName: e.target.value})}
                      style={styles.formInput}
                      required
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Mother's Name *</label>
                    <input
                      type="text"
                      placeholder="Enter mother's name"
                      value={newStudent.motherName}
                      onChange={(e) => setNewStudent({...newStudent, motherName: e.target.value})}
                      style={styles.formInput}
                      required
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Slot Number</label>
                    <select
                      value={newStudent.slotNumber}
                      onChange={(e) => setNewStudent({...newStudent, slotNumber: parseInt(e.target.value)})}
                      style={styles.formInput}
                    >
                      <option value="1">Slot 1</option>
                      <option value="2">Slot 2</option>
                    </select>
                  </div>
                </div>
                
                <div style={styles.modalFooter}>
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)} 
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    style={styles.submitBtn} 
                    disabled={addLoading}
                  >
                    {addLoading ? 'Adding...' : '➕ Add Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            💡 Double-click on any cell to edit. Use checkboxes for bulk actions.
          </p>
        </div>
      </div>
    </>
  );
};

// ============ STYLES ============

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
    animation: 'spin 0.8s linear infinite'
  },
  loadingText: {
    color: '#4B5563',
    marginTop: '16px',
    fontSize: '16px',
    fontWeight: '500'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #E5E7EB',
    marginTop: '20px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  title: {
    margin: 0,
    color: '#1F2937',
    fontSize: '28px',
    fontWeight: '700'
  },
  subtitle: {
    margin: '4px 0 0',
    color: '#6B7280',
    fontSize: '14px'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  stats: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  statsBadge: {
    padding: '8px 16px',
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    flex: '1',
    maxWidth: '400px'
  },
  searchInput: {
    width: '100%',
    padding: '10px 40px 10px 16px',
    borderRadius: '10px',
    border: '1.5px solid #E5E7EB',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    outline: 'none',
    backgroundColor: 'white',
    fontFamily: 'inherit'
  },
  clearBtn: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#9CA3AF',
    padding: '5px'
  },
  controlsRight: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  actionBtn: {
    padding: '8px 16px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit'
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'auto',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #E5E7EB',
    maxHeight: 'calc(100vh - 350px)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '1100px'
  },
  th: {
    padding: '12px 15px',
    textAlign: 'left',
    backgroundColor: '#F9FAFB',
    color: '#374151',
    fontWeight: '600',
    borderBottom: '2px solid #E5E7EB',
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    fontSize: '13px'
  },
  td: {
    padding: '12px 15px',
    borderBottom: '1px solid #F3F4F6',
    color: '#1F2937',
    minHeight: '45px',
    fontSize: '14px'
  },
  row: {
    transition: 'background-color 0.2s ease'
  },
  serialNo: {
    padding: '12px 10px',
    textAlign: 'center',
    fontWeight: '600',
    color: '#6B7280',
    width: '50px',
    fontSize: '13px'
  },
  checkboxCol: {
    padding: '12px 10px',
    textAlign: 'center',
    width: '40px'
  },
  actionsCol: {
    padding: '12px 10px',
    textAlign: 'center',
    width: '70px'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#667eea'
  },
  sortIcon: {
    fontSize: '12px',
    marginLeft: '5px',
    opacity: 0.5
  },
  passwordContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  passwordText: {
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#374151',
    padding: '4px 10px',
    backgroundColor: '#F3F4F6',
    borderRadius: '6px',
    minWidth: '80px',
    textAlign: 'center',
    border: '1px solid #E5E7EB'
  },
  generateBtn: {
    padding: '4px 12px',
    backgroundColor: '#8B5CF6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#9CA3AF',
    fontSize: '14px'
  },
  error: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    border: '1px solid #FCA5A5',
    fontSize: '14px'
  },
  success: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    border: '1px solid #A7F3D0',
    fontSize: '14px'
  },
  editInput: {
    width: '100%',
    padding: '4px 8px',
    border: '2px solid #667eea',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'white',
    fontFamily: 'inherit'
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
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    animation: 'slideUp 0.3s ease-out'
  },
  modalLarge: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '16px',
    maxWidth: '800px',
    width: '95%',
    maxHeight: '85vh',
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
    fontSize: '20px',
    fontWeight: '600',
    color: '#1F2937',
    margin: 0
  },
  modalSubtitle: {
    color: '#6B7280',
    fontSize: '14px',
    marginTop: '-10px',
    marginBottom: '16px'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
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
    justifyContent: 'flex-end',
    gap: '10px'
  },
  bulkEditForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginTop: '20px'
  },
  bulkEditSelect: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid #E5E7EB',
    fontSize: '14px',
    backgroundColor: 'white',
    fontFamily: 'inherit'
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#9CA3AF',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease'
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
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'all 0.2s ease'
  },
  footer: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    textAlign: 'center'
  },
  footerText: {
    margin: 0,
    color: '#6B7280',
    fontSize: '14px'
  },
  addForm: {
    marginTop: '10px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151'
  },
  formInput: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid #E5E7EB',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
    backgroundColor: '#FAFAFA',
    fontFamily: 'inherit'
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
    transform: scale(0.95);
  }
  .action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  .delete-btn:hover {
    background-color: #FEF2F2;
  }
  .generate-btn:hover {
    background-color: #7C3AED;
    transform: translateY(-1px);
  }
  .close-btn:hover {
    background-color: #F3F4F6;
  }
  .cancel-btn:hover {
    background-color: #6B7280;
  }
  .submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  }
  input:focus, select:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    background-color: white;
  }
  .search-input:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  tr:hover {
    background-color: #F9FAFB;
  }
`;
document.head.appendChild(styleElement);

export default StudentList;