import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axios from 'axios';

// ✅ CLOUDINARY CONFIGURATION
// Sign up at cloudinary.com and get these values
const CLOUDINARY_CLOUD_NAME = 'lqp593cn';
const CLOUDINARY_UPLOAD_PRESET = 'batch_timetable';

const DEFAULT_IMAGE = 'https://via.placeholder.com/60x60/1F2937/FFFFFF?text=No+Image';

const BatchList = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ imageUrl: '', thumbnailUrl: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [imageErrors, setImageErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  
  const API_URL = 'http://https://frosh-app-backend.onrender.com/api/faculty-timetable';

  // ✅ Upload to Cloudinary
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      
      const data = await response.json();
      return {
        originalUrl: data.secure_url,
        // ✅ Thumbnail - 10x smaller!
        thumbnailUrl: data.secure_url.replace('/upload/', '/upload/w_200,h_200,c_fill/')
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const getImageUrl = (batch) => {
    // ✅ Use thumbnail for list view
    if (batch.thumbnailUrl && batch.thumbnailUrl.trim() !== '' && !imageErrors[batch._id]) {
      return batch.thumbnailUrl;
    }
    if (batch.imageUrl && batch.imageUrl.trim() !== '' && !imageErrors[batch._id]) {
      return batch.imageUrl;
    }
    return DEFAULT_IMAGE;
  };

  // ✅ Get original image for full view
  const getOriginalImageUrl = (batch) => {
    if (batch.imageUrl && batch.imageUrl.trim() !== '') {
      return batch.imageUrl;
    }
    return DEFAULT_IMAGE;
  };

  const batchImages = useMemo(() => {
    const map = {};
    batches.forEach(batch => {
      map[batch._id] = getImageUrl(batch);
    });
    return map;
  }, [batches, imageErrors]);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        
        if (!token) {
          setError('❌ Please login as Admin first');
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_URL}/admin/list`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data && response.data.batches) {
          setBatches(response.data.batches);
          setError('');
        } else {
          setBatches([]);
        }
      } catch (err) {
        console.error('❌ Fetch error:', err);
        setError('❌ Failed to fetch batches');
        setBatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, []);

  // ✅ Handle file upload to Cloudinary
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('❌ Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('❌ Image size should be less than 10MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const { originalUrl, thumbnailUrl } = await uploadToCloudinary(file);
      
      setEditData({ 
        ...editData, 
        imageUrl: originalUrl,
        thumbnailUrl: thumbnailUrl 
      });
      setSuccess('✅ Image uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Upload error:', err);
      setError('❌ Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUpdateBatch = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      
      await axios.put(
        `${API_URL}/admin/${selectedBatch.batchCode}`,
        { 
          imageUrl: editData.imageUrl,
          thumbnailUrl: editData.thumbnailUrl
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess(`✅ Image updated successfully!`);
      setImageErrors(prev => ({ ...prev, [selectedBatch._id]: false }));
      
      const response = await axios.get(`${API_URL}/admin/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.batches) {
        setBatches(response.data.batches);
      }
      
      setTimeout(() => {
        setShowEditModal(false);
        setSelectedBatch(null);
        setEditData({ imageUrl: '', thumbnailUrl: '' });
        setSuccess('');
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update image');
    } finally {
      setFormLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    
    try {
      const response = await axios.get(`${API_URL}/batches/admin/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.batches) {
        setBatches(response.data.batches);
        setError('');
      }
    } catch (err) {
      setError('❌ Failed to refresh');
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (batchId) => {
    if (!imageErrors[batchId]) {
      setImageErrors(prev => ({ ...prev, [batchId]: true }));
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.loading}>Loading batches...</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>🏕️ Batches</h1>
          <button onClick={handleRefresh} style={styles.refreshBtn}>
            🔄 Refresh
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Batch Code</th>
                <th>Image</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr>
                  <td colSpan="4" style={styles.emptyState}>
                    No batches found.
                  </td>
                </tr>
              ) : (
                batches.map((batch, index) => (
                  <tr key={batch._id || index}>
                    <td>{index + 1}</td>
                    <td><strong>{batch.batchCode}</strong></td>
                    <td>
                      <img
                        src={batchImages[batch._id] || DEFAULT_IMAGE}
                        alt={batch.batchCode}
                        style={styles.batchImage}
                        onClick={() => {
                          setSelectedBatch(batch);
                          setShowModal(true);
                        }}
                        onError={() => handleImageError(batch._id)}
                      />
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setSelectedBatch(batch);
                          setEditData({ 
                            imageUrl: batch.imageUrl || '',
                            thumbnailUrl: batch.thumbnailUrl || '' 
                          });
                          setShowEditModal(true);
                        }}
                        style={styles.editBtn}
                      >
                        ✏️ Change Image
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Image View Modal - Shows Full Size Original */}
        {showModal && selectedBatch && (
          <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <div style={styles.imageModal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3>{selectedBatch.batchCode} - Timetable</h3>
                <button onClick={() => setShowModal(false)} style={styles.closeBtn}>✕</button>
              </div>
              <img
                src={getOriginalImageUrl(selectedBatch)}
                alt={selectedBatch.batchCode}
                style={styles.fullImage}
                onError={() => handleImageError(selectedBatch._id)}
              />
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditData({ 
                    imageUrl: selectedBatch.imageUrl || '',
                    thumbnailUrl: selectedBatch.thumbnailUrl || '' 
                  });
                  setShowEditModal(true);
                }}
                style={styles.changeBtn}
              >
                🔄 Change Image
              </button>
              <button onClick={() => setShowModal(false)} style={styles.closeModalBtn}>
                Close
              </button>
            </div>
          </div>
        )}

        {/* Edit Image Modal - With Upload */}
        {showEditModal && selectedBatch && (
          <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3>✏️ Change Timetable - {selectedBatch.batchCode}</h3>
                <button onClick={() => setShowEditModal(false)} style={styles.closeBtn}>✕</button>
              </div>
              <form onSubmit={handleUpdateBatch} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Current Image</label>
                  <div style={styles.currentImageDisplay}>
                    <img
                      src={batchImages[selectedBatch._id] || DEFAULT_IMAGE}
                      alt={selectedBatch.batchCode}
                      style={styles.previewImage}
                      onError={() => handleImageError(selectedBatch._id)}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Upload New Timetable Image</label>
                  <div style={styles.uploadContainer}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      style={styles.fileInput}
                      id="imageUpload"
                    />
                    <label htmlFor="imageUpload" style={styles.uploadLabel}>
                      {uploading ? '⏳ Uploading...' : '📤 Choose Image'}
                    </label>
                    <small style={styles.helperText}>
                      Max size: 10MB | Formats: JPG, PNG, GIF, WebP
                    </small>
                  </div>
                </div>

                <div style={styles.orDivider}>
                  <span>OR Enter Image URL Directly</span>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Image URL</label>
                  <input
                    type="url"
                    placeholder="https://res.cloudinary.com/..."
                    value={editData.imageUrl}
                    onChange={(e) => setEditData({ ...editData, imageUrl: e.target.value })}
                    style={styles.formInput}
                  />
                </div>

                {editData.imageUrl && (
                  <div style={styles.previewContainer}>
                    <label style={styles.label}>Preview</label>
                    <img
                      src={editData.imageUrl}
                      alt="Preview"
                      style={styles.previewLarge}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_IMAGE;
                      }}
                    />
                  </div>
                )}

                <div style={styles.formButtons}>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    style={styles.submitBtn} 
                    disabled={formLoading || uploading || !editData.imageUrl}
                  >
                    {formLoading ? 'Updating...' : '💾 Update Timetable'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ✅ STYLES
const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    marginTop: '20px',
  },
  title: {
    margin: 0,
    color: '#2c3e50',
  },
  refreshBtn: {
    padding: '8px 16px',
    backgroundColor: '#9E9E9E',
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
    minWidth: '500px',
  },
  batchImage: {
    width: '60px',
    height: '60px',
    borderRadius: '8px',
    objectFit: 'cover',
    cursor: 'pointer',
    border: '2px solid #e0e0e0',
  },
  editBtn: {
    padding: '6px 14px',
    backgroundColor: '#FF9800',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  imageModal: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '10px',
    maxWidth: '600px',
    width: '90%',
    textAlign: 'center',
  },
  fullImage: {
    width: '100%',
    maxHeight: '500px',
    objectFit: 'contain',
    borderRadius: '8px',
  },
  modal: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '10px',
    maxWidth: '500px',
    width: '90%',
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
  closeModalBtn: {
    padding: '8px 20px',
    backgroundColor: '#666',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  changeBtn: {
    padding: '10px 20px',
    backgroundColor: '#FF9800',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '10px',
    marginRight: '10px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#333',
  },
  formInput: {
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  currentImageDisplay: {
    display: 'flex',
    justifyContent: 'center',
    padding: '10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
  },
  previewImage: {
    width: '80px',
    height: '80px',
    borderRadius: '8px',
    objectFit: 'cover',
  },
  previewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  previewLarge: {
    width: '150px',
    height: '150px',
    borderRadius: '8px',
    objectFit: 'cover',
    border: '1px solid #ddd',
    alignSelf: 'center',
  },
  helperText: {
    fontSize: '12px',
    color: '#999',
    marginTop: '4px',
  },
  formButtons: {
    display: 'flex',
    gap: '10px',
  },
  submitBtn: {
    padding: '10px 20px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    flex: 1,
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#9e9e9e',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
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
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#666',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
  },
  uploadContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  fileInput: {
    display: 'none',
  },
  uploadLabel: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    borderRadius: '5px',
    cursor: 'pointer',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  orDivider: {
    display: 'flex',
    alignItems: 'center',
    margin: '5px 0',
    color: '#999',
    justifyContent: 'center',
  },
};

export default BatchList;