import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://frosh-app-backend.onrender.com/api';

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
});

// Admin's "Feedback" section, shown on the Faculty page: manage the 5 fixed
// questions asked on every session's feedback form, and browse responses
// for sessions where feedback has been started.
const FeedbackSection = () => {
  const [expanded, setExpanded] = useState(false);

  const [questions, setQuestions] = useState(['', '', '', '', '']);
  const [qLoading, setQLoading] = useState(false);
  const [qSaving, setQSaving] = useState(false);
  const [qMsg, setQMsg] = useState('');

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [responseData, setResponseData] = useState(null);
  const [responsesLoading, setResponsesLoading] = useState(false);

  const fetchQuestions = async () => {
    try {
      setQLoading(true);
      const res = await axios.get(`${API_URL}/feedback/admin/questions`, authHeaders());
      const existing = res.data.questions || [];
      const filled = [0, 1, 2, 3, 4].map((i) => existing.find((q) => q.order === i + 1)?.text || '');
      setQuestions(filled);
    } catch (err) {
      console.error('Failed to load feedback questions', err);
    } finally {
      setQLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      const res = await axios.get(`${API_URL}/feedback/admin/sessions`, authHeaders());
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.error('Failed to load feedback sessions', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (expanded) {
      fetchQuestions();
      fetchSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  const handleSaveQuestions = async () => {
    const trimmed = questions.map((q) => q.trim());
    if (trimmed.some((q) => !q)) {
      setQMsg('❌ All 5 questions are required.');
      return;
    }
    try {
      setQSaving(true);
      setQMsg('');
      await axios.put(`${API_URL}/feedback/admin/questions`, { questions: trimmed }, authHeaders());
      setQMsg('✅ Saved!');
      setTimeout(() => setQMsg(''), 3000);
    } catch (err) {
      setQMsg(err.response?.data?.error || '❌ Could not save questions.');
    } finally {
      setQSaving(false);
    }
  };

  const handleViewResponses = async (sessionId) => {
    if (selectedSessionId === sessionId) {
      setSelectedSessionId(null);
      setResponseData(null);
      return;
    }
    try {
      setSelectedSessionId(sessionId);
      setResponsesLoading(true);
      const res = await axios.get(`${API_URL}/feedback/admin/session/${sessionId}/responses`, authHeaders());
      setResponseData(res.data);
    } catch (err) {
      console.error('Failed to load responses', err);
    } finally {
      setResponsesLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <button style={styles.toggleBtn} onClick={() => setExpanded((v) => !v)}>
        📝 Feedback {expanded ? '▲' : '▼'}
      </button>

      {expanded && (
        <div style={styles.panel}>
          <div style={styles.block}>
            <h3 style={styles.blockTitle}>Fixed Feedback Questions (5)</h3>
            <p style={styles.blockHint}>
              These 5 questions are asked on every session's feedback form, alongside the 5
              questions the faculty member adds for that specific session.
            </p>
            {qLoading ? (
              <p style={styles.blockHint}>Loading…</p>
            ) : (
              <>
                {questions.map((q, i) => (
                  <input
                    key={i}
                    style={styles.input}
                    placeholder={`Question ${i + 1}`}
                    value={q}
                    onChange={(e) =>
                      setQuestions((prev) => prev.map((val, idx) => (idx === i ? e.target.value : val)))
                    }
                  />
                ))}
                <button style={styles.saveBtn} onClick={handleSaveQuestions} disabled={qSaving}>
                  {qSaving ? 'Saving…' : 'Save Questions'}
                </button>
                {qMsg && <span style={styles.msg}>{qMsg}</span>}
              </>
            )}
          </div>

          <div style={styles.block}>
            <h3 style={styles.blockTitle}>Session Feedback</h3>
            {sessionsLoading ? (
              <p style={styles.blockHint}>Loading…</p>
            ) : sessions.length === 0 ? (
              <p style={styles.blockHint}>No sessions have started feedback yet.</p>
            ) : (
              sessions.map((s) => (
                <div key={s._id} style={styles.sessionRow}>
                  <div style={styles.sessionInfo}>
                    <strong>{s.subject}</strong>
                    <span style={styles.sessionMeta}>
                      {s.faculty?.name || 'Unknown faculty'} · {s.faculty?.department || ''} ·{' '}
                      {s.feedbackStatus === 'open' ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  <button style={styles.viewBtn} onClick={() => handleViewResponses(s._id)}>
                    {selectedSessionId === s._id ? 'Hide' : 'View Responses'}
                  </button>

                  {selectedSessionId === s._id && (
                    <div style={styles.responsesBox}>
                      {responsesLoading ? (
                        <p style={styles.blockHint}>Loading responses…</p>
                      ) : !responseData || responseData.count === 0 ? (
                        <p style={styles.blockHint}>No responses yet.</p>
                      ) : (
                        responseData.responses.map((r) => (
                          <div key={r._id} style={styles.responseCard}>
                            <strong>
                              {r.student?.name} ({r.student?.rollNo})
                            </strong>
                            {r.answers
                              .slice()
                              .sort((a, b) => (a.source === b.source ? a.order - b.order : a.source === 'admin' ? -1 : 1))
                              .map((a, idx) => (
                                <div key={idx} style={styles.answerRow}>
                                  <span style={styles.answerSourceTag}>{a.source === 'admin' ? 'General' : 'This Class'}</span>{' '}
                                  {a.questionText} — {'⭐'.repeat(a.rating)}
                                  {a.comment ? <em style={styles.answerComment}> “{a.comment}”</em> : null}
                                </div>
                              ))}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  wrapper: { marginBottom: 20 },
  toggleBtn: {
    padding: '10px 16px',
    borderRadius: 8,
    border: '1px solid #374151',
    background: '#1F2937',
    color: 'white',
    fontWeight: 600,
    cursor: 'pointer'
  },
  panel: {
    marginTop: 12,
    padding: 16,
    borderRadius: 10,
    border: '1px solid #374151',
    background: '#111827'
  },
  block: { marginBottom: 20 },
  blockTitle: { color: 'white', fontSize: 15, marginBottom: 6 },
  blockHint: { color: '#9CA3AF', fontSize: 13, marginBottom: 10 },
  input: {
    display: 'block',
    width: '100%',
    maxWidth: 500,
    marginBottom: 8,
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid #374151',
    background: '#1F2937',
    color: 'white'
  },
  saveBtn: {
    padding: '8px 16px',
    borderRadius: 6,
    border: 'none',
    background: '#4F46E5',
    color: 'white',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4
  },
  msg: { marginLeft: 12, color: '#D1D5DB', fontSize: 13 },
  sessionRow: {
    padding: '10px 0',
    borderBottom: '1px solid #1F2937'
  },
  sessionInfo: { display: 'flex', flexDirection: 'column', marginBottom: 6 },
  sessionMeta: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  viewBtn: {
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid #4F46E5',
    background: 'transparent',
    color: '#818CF8',
    fontSize: 13,
    cursor: 'pointer'
  },
  responsesBox: { marginTop: 10, paddingLeft: 8, borderLeft: '2px solid #374151' },
  responseCard: { marginBottom: 12, color: '#D1D5DB', fontSize: 13 },
  answerRow: { marginTop: 4, marginLeft: 8 },
  answerSourceTag: { color: '#6B7280', fontSize: 11 },
  answerComment: { color: '#9CA3AF' }
};

export default FeedbackSection;
