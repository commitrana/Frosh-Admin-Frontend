import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Html5Qrcode } from 'html5-qrcode';

import { getEvents, createEvent, updateEvent, updateEventStatus, updateEventSlotCount, updateEventSlot, deleteEvent, scanTicket, getTicketStats, getEventRegistrations, uploadEventImage, SERVER_URL } from '../services/api';

const SLOT_COUNTS = [0, 1, 2, 3, 4, 5];

const STATUS_OPTIONS = ['live', 'upcoming', 'past'];

const STATUS_STYLES = {
  live: { bg: '#ffebee', color: '#c62828', label: ' Live' },
  upcoming: { bg: '#e3f2fd', color: '#1565c0', label: ' Upcoming' },
  past: { bg: '#f5f5f5', color: '#616161', label: 'Past' },
};

const EMPTY_FORM = { name: '', date: '', time: '', venue: '', status: 'upcoming', totalTickets: '' };

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  // ---- Ticket scanning modal state ----
  const [scanningEvent, setScanningEvent] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scanStats, setScanStats] = useState(null);
  const scannerRef = useRef(null);

  // ---- View Registrations modal state ----
  const [viewingEvent, setViewingEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [registrationFilter, setRegistrationFilter] = useState('pending'); // 'pending' | 'checkedIn'
  const [slotFilter, setSlotFilter] = useState('all'); // 'all' | slot number

  // ---- Event photo upload state ----
  const photoInputRef = useRef(null);
  const [photoTargetEvent, setPhotoTargetEvent] = useState(null);
  const [uploadingEventId, setUploadingEventId] = useState(null);

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await getEvents();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      if (err.response?.status === 401) {
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    try {
      const { name, date, time, venue } = formData;
      if (!name || !date || !time || !venue) {
        setFormError('Name, date, time, and venue are required');
        setFormLoading(false);
        return;
      }

      await createEvent(formData);
      setFormSuccess('Event created successfully!');
      setFormData(EMPTY_FORM);

      setTimeout(() => {
        setShowCreateForm(false);
        setFormSuccess('');
        fetchEvents();
      }, 1200);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create event');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditClick = (event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      date: event.date,
      time: event.time,
      venue: event.venue,
      status: event.status,
      totalTickets: event.totalTickets === null || event.totalTickets === undefined ? '' : String(event.totalTickets),
    });
    setFormError('');
    setFormSuccess('');
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    try {
      await updateEvent(editingEvent._id, formData);
      setFormSuccess('Event updated successfully!');

      setTimeout(() => {
        setEditingEvent(null);
        setFormData(EMPTY_FORM);
        setFormSuccess('');
        fetchEvents();
      }, 1000);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to update event');
    } finally {
      setFormLoading(false);
    }
  };

  // The toggle: clicking a status pill updates it instantly (no full form needed)
  const handleStatusChange = async (eventId, newStatus) => {
    try {
      await updateEventStatus(eventId, newStatus);
      setMessage(`Status updated to "${newStatus}"`);
      setMessageType('success');
      setEvents(prev =>
        prev.map(ev => (ev._id === eventId ? { ...ev, status: newStatus } : ev))
      );
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setMessage('Failed to update status: ' + (err.response?.data?.error || err.message));
      setMessageType('error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete event "${name}"? This cannot be undone.`)) return;
    try {
      await deleteEvent(id);
      setMessage(`Event "${name}" deleted`);
      setMessageType('success');
      fetchEvents();
    } catch (err) {
      setMessage('Failed to delete event');
      setMessageType('error');
    }
  };

  // ---- Slots ----

  const handleSlotCountChange = async (eventId, slotCount) => {
    try {
      const data = await updateEventSlotCount(eventId, slotCount);
      setEvents((prev) => prev.map((ev) => (ev._id === eventId ? data.event : ev)));
    } catch (err) {
      setMessage('Failed to update slot count: ' + (err.response?.data?.error || err.message));
      setMessageType('error');
    }
  };

  const handleSlotStatusChange = async (eventId, slotNumber, status) => {
    try {
      const data = await updateEventSlot(eventId, slotNumber, { status });
      setEvents((prev) => prev.map((ev) => (ev._id === eventId ? data.event : ev)));
    } catch (err) {
      setMessage('Failed to update slot status: ' + (err.response?.data?.error || err.message));
      setMessageType('error');
    }
  };

  const handleSlotDetailSave = async (eventId, slotNumber, field, value) => {
    try {
      const data = await updateEventSlot(eventId, slotNumber, { [field]: value });
      setEvents((prev) => prev.map((ev) => (ev._id === eventId ? data.event : ev)));
      setEditingEvent((prev) => (prev && prev._id === eventId ? data.event : prev));
    } catch (err) {
      setMessage(`Failed to update slot ${field}: ` + (err.response?.data?.error || err.message));
      setMessageType('error');
    }
  };

  // ---- Event photo upload ----

  const handlePhotoButtonClick = (event) => {
    setPhotoTargetEvent(event);
    // Reset the input value first so selecting the same file twice in a
    // row still fires onChange (browsers otherwise skip a repeat change).
    if (photoInputRef.current) photoInputRef.current.value = '';
    photoInputRef.current?.click();
  };

  const handlePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !photoTargetEvent) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage('Only JPG, PNG, or WEBP images are allowed');
      setMessageType('error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image must be under 5MB');
      setMessageType('error');
      return;
    }

    setUploadingEventId(photoTargetEvent._id);
    try {
      await uploadEventImage(photoTargetEvent._id, file);
      setMessage(`Photo uploaded for "${photoTargetEvent.name}"`);
      setMessageType('success');
      await fetchEvents();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Failed to upload photo'));
      setMessageType('error');
    } finally {
      setUploadingEventId(null);
      setPhotoTargetEvent(null);
    }
  };

  // ---- View Registrations ----

  const openRegistrations = async (event) => {
    setViewingEvent(event);
    setRegistrationFilter('pending');
    setSlotFilter('all');
    setRegistrations([]);
    setRegistrationsLoading(true);
    try {
      const data = await getEventRegistrations(event._id);
      setRegistrations(data.registrations || []);
    } catch (err) {
      setMessage('Failed to load registrations');
      setMessageType('error');
    } finally {
      setRegistrationsLoading(false);
    }
  };

  const closeRegistrations = () => {
    setViewingEvent(null);
    setRegistrations([]);
    setSlotFilter('all');
  };

  // ---- Ticket scanning ----

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (err) {
      // scanner was already stopped/not running — safe to ignore
    }
  };

  const startScanner = async () => {
    try {
      await stopScanner();
      const scanner = new Html5Qrcode('ticket-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => {}
      );
    } catch (err) {
      setScanResult({ type: 'error', message: 'Camera access denied. Please allow camera access.' });
    }
  };

  const refreshScanStats = async (eventId) => {
    try {
      const stats = await getTicketStats(eventId);
      setScanStats(stats);
    } catch (err) {
      // non-fatal — stats just won't update this round
    }
  };

  const onScanSuccess = async (decodedText) => {
    await stopScanner();

    try {
      const result = await scanTicket(decodedText.trim());
      const student = result.ticket?.student;
      setScanResult({
        type: 'success',
        message: result.message,
        studentName: student?.name,
        studentEmail: student?.email,
        studentBranch: student?.branch,
        slot: result.ticket?.slot || 0,
      });
    } catch (err) {
      const data = err.response?.data;
      setScanResult({
        type: 'error',
        message: data?.error || 'Invalid or unrecognized QR code',
        studentName: data?.ticket?.student?.name,
        scannedAt: data?.scannedAt,
        slot: data?.ticket?.slot || 0,
      });
    }

    if (scanningEvent) {
      await refreshScanStats(scanningEvent._id);
    }
  };

  const handleScanAgain = () => {
    setScanResult(null);
    startScanner();
  };

  const openScanner = async (event) => {
    setScanningEvent(event);
    setScanResult(null);
    setScanStats(null);
    await refreshScanStats(event._id);
  };

  const closeScanner = async () => {
    await stopScanner();
    setScanningEvent(null);
    setScanResult(null);
    setScanStats(null);
    fetchEvents(); // refresh table's issued/scanned numbers
  };

  useEffect(() => {
    if (scanningEvent) {
      startScanner();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanningEvent]);

  useEffect(() => {
    // Stop the camera if the component unmounts while a scan is in progress
    return () => { stopScanner(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderStatusToggle = (event) => (
    <div style={styles.toggleGroup}>
      {STATUS_OPTIONS.map((status) => {
        const isActive = event.status === status;
        const cfg = STATUS_STYLES[status];
        return (
          <button
            key={status}
            onClick={() => handleStatusChange(event._id, status)}
            style={{
              ...styles.toggleBtnSmall,
              backgroundColor: isActive ? cfg.color : '#f0f0f0',
              color: isActive ? 'white' : '#666',
              fontWeight: isActive ? 'bold' : 'normal',
            }}
          >
            {status === 'live' ? '' : status === 'upcoming' ? '' : ''} {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        );
      })}
    </div>
  );

  const renderSlotsCell = (event) => {
    const slotCount = event.slotCount || 0;
    return (
      <div style={styles.slotsCell}>
        <div style={styles.toggleGroup}>
          {SLOT_COUNTS.map((n) => {
            const isActive = slotCount === n;
            return (
              <button
                key={n}
                onClick={() => handleSlotCountChange(event._id, n)}
                style={{
                  ...styles.toggleBtnSmall,
                  backgroundColor: isActive ? '#3f51b5' : '#f0f0f0',
                  color: isActive ? 'white' : '#666',
                  fontWeight: isActive ? 'bold' : 'normal',
                }}
              >
                {n}
              </button>
            );
          })}
        </div>

        {slotCount > 0 && (
          <div style={styles.slotList}>
            {(event.slots || []).map((slot) => (
              <div key={slot.number} style={styles.slotRow}>
                <span style={styles.slotLabel}>
                  Slot {slot.number}{slot.time ? ` · ${slot.time}` : ''}{slot.venue ? ` · ${slot.venue}` : ''}
                </span>
                <div style={styles.toggleGroup}>
                  {STATUS_OPTIONS.map((status) => {
                    const isActive = slot.status === status;
                    const cfg = STATUS_STYLES[status];
                    return (
                      <button
                        key={status}
                        onClick={() => handleSlotStatusChange(event._id, slot.number, status)}
                        style={{
                          ...styles.toggleBtnSmall,
                          backgroundColor: isActive ? cfg.color : '#f0f0f0',
                          color: isActive ? 'white' : '#666',
                          fontWeight: isActive ? 'bold' : 'normal',
                        }}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <p style={styles.slotHint}>Edit slot time/venue from Edit.</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <Navbar />

      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}> Event List</h1>
          <p style={styles.subtitle}>Manage all Frosh events shown in the app</p>
        </div>
        <div style={styles.headerStats}>
          <span style={styles.statPill}>Total: {events.length}</span>
        </div>
      </div>

      {message && (
        <div style={messageType === 'success' ? styles.success : styles.error}>{message}</div>
      )}

      <div style={styles.actions}>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setFormData(EMPTY_FORM);
            setFormError('');
            setFormSuccess('');
          }}
          style={styles.createBtn}
        >
          {showCreateForm ? '✕ Cancel' : '+ Add Event'}
        </button>
      </div>

      {showCreateForm && (
        <div style={styles.formContainer}>
          <h3>Add New Event</h3>
          {formError && <div style={styles.error}>{formError}</div>}
          {formSuccess && <div style={styles.success}>{formSuccess}</div>}
          <form onSubmit={handleCreateEvent} style={styles.form}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Event Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Battle of Bands"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={styles.formInput}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                
                
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  style={styles.formInput}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label>Time *</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  style={styles.formInput}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label>Venue *</label>
                <input
                  type="text"
                  placeholder="e.g. Open Air Theatre"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  style={styles.formInput}
                  required
                />
              </div>
            </div>
            <div style={styles.formGroup}>
              <label>Initial Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={styles.formInput}
              >
                <option value="upcoming">🕐 Upcoming</option>
                <option value="live">Live</option>
                <option value="past">Past</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label>Total Tickets</label>
              <input
                type="number"
                min="0"
                placeholder="Leave blank for unlimited"
                value={formData.totalTickets}
                onChange={(e) => setFormData({ ...formData, totalTickets: e.target.value })}
                style={styles.formInput}
              />
            </div>
            <button type="submit" style={styles.submitBtn} disabled={formLoading}>
              {formLoading ? 'Adding...' : '+ Add Event'}
            </button>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {editingEvent && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3>Edit Event</h3>
            {editingEvent.slotCount > 0 && (
              <div style={styles.slotEditorBox}>
                <p style={styles.slotHint}>
                  This event has {editingEvent.slotCount} slot{editingEvent.slotCount !== 1 ? 's' : ''}. Set each slot's
                  time/venue below (status is toggled from the table).
                </p>
                {(editingEvent.slots || []).map((slot) => (
                  <div key={slot.number} style={styles.slotEditorRow}>
                    <span style={styles.slotEditorLabel}>Slot {slot.number}</span>
                    <input
                      type="text"
                      placeholder="Time"
                      defaultValue={slot.time}
                      onBlur={(e) => handleSlotDetailSave(editingEvent._id, slot.number, 'time', e.target.value)}
                      style={styles.slotEditorInput}
                    />
                    <input
                      type="text"
                      placeholder="Venue"
                      defaultValue={slot.venue}
                      onBlur={(e) => handleSlotDetailSave(editingEvent._id, slot.number, 'venue', e.target.value)}
                      style={styles.slotEditorInput}
                    />
                  </div>
                ))}
              </div>
            )}
            {formError && <div style={styles.error}>{formError}</div>}
            {formSuccess && <div style={styles.success}>{formSuccess}</div>}
            <form onSubmit={handleUpdateEvent} style={styles.form}>
              <input
                type="text"
                placeholder="Event Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={styles.formInput}
                required
              />
              
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                style={styles.formInput}
                required
              />
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                style={styles.formInput}
                required
              />
              <input
                type="text"
                placeholder="Venue *"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                style={styles.formInput}
                required
              />
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={styles.formInput}
              >
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="past">Past</option>
              </select>
              <input
                type="number"
                min="0"
                placeholder="Total Tickets (leave blank for unlimited)"
                value={formData.totalTickets}
                onChange={(e) => setFormData({ ...formData, totalTickets: e.target.value })}
                style={styles.formInput}
              />
              {editingEvent && editingEvent.ticketsIssued > 0 && (
                <p style={styles.helperText}>
                  {editingEvent.ticketsIssued} ticket{editingEvent.ticketsIssued === 1 ? '' : 's'} already issued — total can't go below this.
                </p>
              )}
              <div style={styles.formButtons}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingEvent(null);
                    setFormData(EMPTY_FORM);
                  }}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn} disabled={formLoading}>
                  {formLoading ? 'Updating...' : 'Update Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Event Name</th>
              
              <th>Date</th>
              <th>Time</th>
              <th>Venue</th>
              <th>Status</th>
              <th>Slots</th>
              <th>Image</th>
              <th>Tickets</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan="10" style={styles.emptyState}>No events added yet.</td>
              </tr>
            ) : (
              events.map((event, index) => (
                <tr key={event._id}>
                  <td>{index + 1}</td>
                  <td><strong>{event.name}</strong></td>
                  <td>{event.date}</td>
                  <td>{event.time}</td>
                  <td>{event.venue}</td>
                  <td>{renderStatusToggle(event)}</td>
                  <td>{renderSlotsCell(event)}</td>
                  <td>
                    <div style={styles.photoCell}>
                      {event.imageUrl ? (
                        <img
                          src={`${SERVER_URL}${event.imageUrl}`}
                          alt={event.name}
                          style={styles.thumbnail}
                        />
                      ) : (
                        <span style={styles.noImageText}>No image</span>
                      )}
                      <button
                        onClick={() => handlePhotoButtonClick(event)}
                        style={styles.uploadPhotoBtn}
                        disabled={uploadingEventId === event._id}
                      >
                        {uploadingEventId === event._id
                          ? 'Uploading...'
                          : event.imageUrl
                          ? 'Replace Photo'
                          : 'Upload Photo'}
                      </button>
                    </div>
                  </td>
                  <td>
                    <span style={styles.ticketPill}>
                      {event.ticketsIssued || 0} / {event.totalTickets ?? '∞'}
                    </span>
                  </td>
                  <td>
                    <div style={styles.actionsCell}>
                      <button onClick={() => handleEditClick(event)} style={styles.editBtn}>
                        Edit
                      </button>
                      <button onClick={() => openScanner(event)} style={styles.scanBtn}>
                        Scan Now
                      </button>
                      <button onClick={() => openRegistrations(event)} style={styles.viewRegBtn}>
                        View Registrations
                      </button>
                      <button
                        onClick={() => handleDelete(event._id, event.name)}
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

      {/* Hidden file input shared by every row's Upload/Replace Photo button */}
      <input
        type="file"
        ref={photoInputRef}
        onChange={handlePhotoFileChange}
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
      />

      {/* Ticket Scanner Modal */}
      {scanningEvent && (
        <div style={styles.modalOverlay}>
          <div style={styles.scanModal}>
            <div style={styles.scanHeader}>
              <h3 style={{ margin: 0 }}>📷 Scan Tickets — {scanningEvent.name}</h3>
              <button onClick={closeScanner} style={styles.closeIconBtn}>✕</button>
            </div>

            {scanStats && (
              <div style={styles.scanStatsRow}>
                <span style={styles.statPill}>
                  Scanned: {scanStats.scanned}
                </span>
                <span style={styles.statPill}>
                  Issued: {scanStats.issued} / {scanStats.totalTickets ?? '∞'}
                </span>
              </div>
            )}

            {!scanResult && (
              <div id="ticket-reader" style={styles.reader}></div>
            )}

            {scanResult && (
              <div
                style={scanResult.type === 'success' ? styles.scanSuccess : styles.scanError}
              >
                <p style={{ fontWeight: 'bold', margin: '0 0 8px' }}>
                  {scanResult.type === 'success' ? '✅ Verified' : '❌ ' + scanResult.message}
                </p>
                {scanResult.type === 'success' && (
                  <>
                    <p style={{ margin: '2px 0' }}>{scanResult.message}</p>
                    <p style={{ margin: '2px 0' }}><strong>Name:</strong> {scanResult.studentName || '-'}</p>
                    <p style={{ margin: '2px 0' }}><strong>Branch:</strong> {scanResult.studentBranch || '-'}</p>
                    <p style={{ margin: '2px 0' }}><strong>Email:</strong> {scanResult.studentEmail || '-'}</p>
                    {!!scanResult.slot && (
                      <p style={{ margin: '2px 0' }}><strong>Slot:</strong> {scanResult.slot}</p>
                    )}
                  </>
                )}
                {scanResult.type === 'error' && scanResult.studentName && (
                  <p style={{ margin: '2px 0' }}>
                    Already checked in: <strong>{scanResult.studentName}</strong>
                    {!!scanResult.slot && <> (Slot {scanResult.slot})</>}
                  </p>
                )}
              </div>
            )}

            <div style={styles.formButtons}>
              {scanResult && (
                <button onClick={handleScanAgain} style={styles.submitBtn}>
                  📷 Scan Next
                </button>
              )}
              <button onClick={closeScanner} style={styles.cancelBtn}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Registrations Modal */}
      {viewingEvent && (
        <div style={styles.modalOverlay}>
          <div style={styles.regModal}>
            <div style={styles.scanHeader}>
              <h3 style={{ margin: 0 }}>Registrations — {viewingEvent.name}</h3>
              <button onClick={closeRegistrations} style={styles.closeIconBtn}>✕</button>
            </div>

            {/* Toggle: Pending | Checked In — top-left */}
            <div style={styles.toggleRow}>
              <button
                onClick={() => setRegistrationFilter('pending')}
                style={{
                  ...styles.toggleBtn,
                  ...(registrationFilter === 'pending' ? styles.toggleBtnActive : {}),
                }}
              >
                Pending ({registrations.filter((r) => r.status === 'valid').length})
              </button>
              <button
                onClick={() => setRegistrationFilter('checkedIn')}
                style={{
                  ...styles.toggleBtn,
                  ...(registrationFilter === 'checkedIn' ? styles.toggleBtnActiveGreen : {}),
                }}
              >
                Checked In ({registrations.filter((r) => r.status === 'used').length})
              </button>
            </div>

            {/* Toggle: All | Slot 1 | Slot 2 ... — only shown for slotted events */}
            {viewingEvent.slotCount > 0 && (
              <div style={styles.slotFilterRow}>
                <button
                  onClick={() => setSlotFilter('all')}
                  style={{
                    ...styles.toggleBtnSmall,
                    backgroundColor: slotFilter === 'all' ? '#3f51b5' : '#f0f0f0',
                    color: slotFilter === 'all' ? 'white' : '#666',
                    fontWeight: slotFilter === 'all' ? 'bold' : 'normal',
                  }}
                >
                  All Slots
                </button>
                {Array.from({ length: viewingEvent.slotCount }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setSlotFilter(n)}
                    style={{
                      ...styles.toggleBtnSmall,
                      backgroundColor: slotFilter === n ? '#3f51b5' : '#f0f0f0',
                      color: slotFilter === n ? 'white' : '#666',
                      fontWeight: slotFilter === n ? 'bold' : 'normal',
                    }}
                  >
                    Slot {n}
                  </button>
                ))}
              </div>
            )}

            {registrationsLoading ? (
              <p style={{ textAlign: 'center', padding: '20px' }}>Loading...</p>
            ) : (
              <div style={styles.regList}>
                {registrations
                  .filter((r) =>
                    registrationFilter === 'pending' ? r.status === 'valid' : r.status === 'used'
                  )
                  .filter((r) => slotFilter === 'all' || r.slot === slotFilter)
                  .map((r) => (
                    <div key={r._id} style={styles.regRow}>
                      <div>
                        <p style={styles.regName}>{r.student?.name || 'Unknown'}</p>
                        <p style={styles.regSub}>{r.student?.email} • {r.student?.branch}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {viewingEvent.slotCount > 0 && (
                          <span style={styles.slotBadge}>Slot {r.slot || '—'}</span>
                        )}
                        <span
                          style={r.status === 'used' ? styles.badgeCheckedIn : styles.badgePending}
                        >
                          {r.status === 'used' ? 'Checked In' : '🕐 Pending'}
                        </span>
                      </div>
                    </div>
                  ))}

                {registrations
                  .filter((r) =>
                    registrationFilter === 'pending' ? r.status === 'valid' : r.status === 'used'
                  )
                  .filter((r) => slotFilter === 'all' || r.slot === slotFilter).length === 0 && (
                  <p style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                    No {registrationFilter === 'pending' ? 'pending' : 'checked-in'} students
                    {slotFilter === 'all' ? '' : ` in Slot ${slotFilter}`}.
                  </p>
                )}
              </div>
            )}

            <div style={styles.formButtons}>
              <button onClick={closeRegistrations} style={styles.cancelBtn}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1300px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px',
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
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
    padding: '8px 16px',
    borderRadius: '20px',
    fontWeight: 'bold',
    fontSize: '14px',
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
  formContainer: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
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
    width: '95%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
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
    minWidth: '900px',
  },
  toggleGroup: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
  },
  slotFilterRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginBottom: '15px',
  },
  slotBadge: {
    backgroundColor: '#ede7f6',
    color: '#4527a0',
    padding: '3px 9px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  slotsCell: {
    minWidth: '160px',
  },
  slotList: {
    marginTop: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  slotRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    paddingBottom: '4px',
    borderBottom: '1px solid #eee',
  },
  slotLabel: {
    fontSize: '11px',
    color: '#555',
    fontWeight: 'bold',
  },
  slotHint: {
    fontSize: '11px',
    color: '#999',
    margin: '4px 0 0',
  },
  slotEditorBox: {
    background: '#f8faff',
    border: '1px solid #e0e4ff',
    borderRadius: '8px',
    padding: '10px 12px',
    marginBottom: '14px',
  },
  slotEditorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
  },
  slotEditorLabel: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#3f51b5',
    minWidth: '48px',
  },
  slotEditorInput: {
    flex: 1,
    padding: '6px 8px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '12px',
  },
  toggleBtnSmall: {
    padding: '5px 10px',
    borderRadius: '14px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '11px',
    transition: 'all 0.15s ease',
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
  scanBtn: {
    padding: '4px 12px',
    backgroundColor: '#3F51B5',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  viewRegBtn: {
    padding: '4px 12px',
    backgroundColor: '#009688',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  ticketPill: {
    backgroundColor: '#ede7f6',
    color: '#4527a0',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  helperText: {
    fontSize: '12px',
    color: '#e65100',
    margin: '-8px 0 0',
  },
  scanModal: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '10px',
    maxWidth: '480px',
    width: '95%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },
  scanHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  closeIconBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#666',
  },
  scanStatsRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
    flexWrap: 'wrap',
  },
  reader: {
    width: '100%',
    minHeight: '280px',
    borderRadius: '10px',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  scanSuccess: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '15px',
    borderRadius: '8px',
  },
  scanError: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '15px',
    borderRadius: '8px',
  },
  regModal: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '10px',
    maxWidth: '520px',
    width: '95%',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'flex-start',
    gap: '10px',
    marginBottom: '15px',
  },
  toggleBtn: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid #ddd',
    backgroundColor: '#f5f5f5',
    color: '#555',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  toggleBtnActive: {
    backgroundColor: '#fff3e0',
    borderColor: '#e65100',
    color: '#e65100',
  },
  toggleBtnActiveGreen: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2e7d32',
    color: '#2e7d32',
  },
  regList: {
    overflowY: 'auto',
    flex: 1,
    minHeight: '150px',
  },
  regRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 10px',
    borderBottom: '1px solid #eee',
  },
  regName: {
    margin: 0,
    fontWeight: 'bold',
    fontSize: '14px',
  },
  regSub: {
    margin: '3px 0 0',
    fontSize: '12px',
    color: '#777',
  },
  badgePending: {
    backgroundColor: '#fff3e0',
    color: '#e65100',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  badgeCheckedIn: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
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
  photoCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    minWidth: '90px',
  },
  thumbnail: {
    width: '64px',
    height: '64px',
    objectFit: 'cover',
    borderRadius: '6px',
    border: '1px solid #ddd',
  },
  noImageText: {
    fontSize: '11px',
    color: '#999',
  },
  uploadPhotoBtn: {
    padding: '4px 8px',
    backgroundColor: '#607D8B',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '11px',
    whiteSpace: 'nowrap',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
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

export default EventList;