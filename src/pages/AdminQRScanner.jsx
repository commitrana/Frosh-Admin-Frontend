import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogout, getMemberById, verifyMember, declineMember } from '../services/api';
import { Html5Qrcode } from 'html5-qrcode';

const AdminQRScanner = () => {
  const [memberData, setMemberData] = useState(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [status, setStatus] = useState(null); // 'pending', 'verified', 'rejected'
  const navigate = useNavigate();
  const scannerRef = useRef(null);

  useEffect(() => {
    startScanner();
    return () => stopScanner();
  }, []);

  const startScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      }

      const scanner = new Html5Qrcode('reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => {}
      );
      
      setError('');
    } catch (err) {
      setError('Camera access denied. Please allow camera access.');
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (err) {}
  };

  const onScanSuccess = async (decodedText) => {
    try {
      console.log('✅ QR Scanned:', decodedText);
      await stopScanner();
      setScanning(false);

      const data = JSON.parse(decodedText);
      const memberId = data.id || data.memberId;

      if (!memberId) {
        setError('Invalid QR Code');
        return;
      }

      setLoading(true);
      const result = await getMemberById(memberId);
      setMemberData(result.member);
      setStatus(result.member.status || 'pending');
      setError('');
    } catch (err) {
      setError('Invalid QR Code');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!memberData) return;
    try {
      setVerifying(true);
      const result = await verifyMember(memberData.id);
      setMemberData(result.member);
      setStatus('verified');
      alert('✅ Member verified successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify');
    } finally {
      setVerifying(false);
    }
  };

  const handleReject = async () => {
    if (!memberData) return;
    try {
      setVerifying(true);
      const result = await declineMember(memberData.id);
      setMemberData(result.member);
      setStatus('rejected');
      alert('❌ Member rejected');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject');
    } finally {
      setVerifying(false);
    }
  };

  const handleScanAgain = () => {
    setMemberData(null);
    setError('');
    setStatus(null);
    setScanning(true);
    startScanner();
  };

  const handleLogout = () => {
    stopScanner();
    adminLogout();
    navigate('/admin/login');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>📷 QR Scanner</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      <div style={styles.scannerContainer}>
        {error && <div style={styles.error}>{error}</div>}

        {scanning && !memberData && (
          <div>
            <div id="reader" style={styles.reader}></div>
            <p style={styles.scanningText}>Scanning...</p>
          </div>
        )}

        {loading && <p>Loading...</p>}

        {memberData && status === 'pending' && (
          <div style={styles.resultContainer}>
            <h3>⏳ Verify Member</h3>
            <div style={styles.memberDetails}>
              <p><strong>Name:</strong> {memberData.name}</p>
              <p><strong>Email:</strong> {memberData.email}</p>
              <p><strong>Branch:</strong> {memberData.branch}</p>
              <p><strong>Roll No:</strong> {memberData.rollNo}</p>
              <p><strong>Society:</strong> {memberData.societyName}</p>
            </div>
            <div style={styles.actionButtons}>
              <button onClick={handleReject} style={styles.declineBtn} disabled={verifying}>
                ❌ Reject
              </button>
              <button onClick={handleAccept} style={styles.acceptBtn} disabled={verifying}>
                {verifying ? '...' : '✅ Accept'}
              </button>
            </div>
          </div>
        )}

        {memberData && status === 'verified' && (
          <div style={styles.verifiedContainer}>
            <h2 style={{ color: '#4CAF50' }}>✅ Already Verified!</h2>
            <p>This member is already verified.</p>
            <div style={styles.memberDetails}>
              <p><strong>Name:</strong> {memberData.name}</p>
              <p><strong>Email:</strong> {memberData.email}</p>
            </div>
          </div>
        )}

        {memberData && status === 'rejected' && (
          <div style={styles.rejectedContainer}>
            <h2 style={{ color: '#f44336' }}>❌ Member Rejected!</h2>
            <p>This member has been rejected.</p>
            <div style={styles.memberDetails}>
              <p><strong>Name:</strong> {memberData.name}</p>
              <p><strong>Email:</strong> {memberData.email}</p>
            </div>
          </div>
        )}

        {!scanning && memberData && (
          <button onClick={handleScanAgain} style={styles.scanAgainBtn}>
            📷 Scan Another
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { padding: 20, maxWidth: 800, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  logoutBtn: { padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer' },
  scannerContainer: { backgroundColor: 'white', padding: 30, borderRadius: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center' },
  reader: { width: '100%', minHeight: 300, margin: '0 auto' },
  scanningText: { color: '#666', marginTop: 10 },
  error: { backgroundColor: '#ffebee', color: '#c62828', padding: 15, borderRadius: 5, marginBottom: 10 },
  resultContainer: { padding: 20 },
  memberDetails: { backgroundColor: '#f5f5f5', padding: 20, borderRadius: 8, textAlign: 'left' },
  actionButtons: { display: 'flex', gap: 20, justifyContent: 'center', marginTop: 20 },
  acceptBtn: { padding: '12px 40px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 18, fontWeight: 'bold' },
  declineBtn: { padding: '12px 40px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 18, fontWeight: 'bold' },
  verifiedContainer: { padding: 20, backgroundColor: '#e8f5e9', borderRadius: 8 },
  rejectedContainer: { padding: 20, backgroundColor: '#ffebee', borderRadius: 8 },
  scanAgainBtn: { padding: '12px 30px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 16, marginTop: 20 },
};

export default AdminQRScanner;