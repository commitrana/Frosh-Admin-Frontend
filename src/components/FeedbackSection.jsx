import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const API_URL = 'https://frosh-app-backend.onrender.com/api';

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
});

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const TYPE_OPTIONS = [
  { value: 'short_answer', label: 'Short answer' },
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'multiple_choice', label: 'Multiple choice' },
  { value: 'checkboxes', label: 'Checkboxes' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'linear_scale', label: 'Linear scale' },
  { value: 'numerical', label: 'Numerical' }
];
const CHOICE_TYPES = ['multiple_choice', 'checkboxes', 'dropdown'];

const emptyQuestion = () => ({ text: '', type: 'linear_scale', options: ['', ''], scaleMin: 1, scaleMax: 5 });

// Admin's "Feedback" panel, shown on the Faculty page:
//  1. Manage the 5 fixed questions asked on every session's feedback form.
//  2. Browse responses: Faculty list -> classes they've taken -> students
//     who gave feedback for that class, with their ratings + comments.
const FeedbackSection = () => {
  const [expanded, setExpanded] = useState(false);

  // ---- Fixed questions editor ----
  const [questions, setQuestions] = useState(Array.from({ length: 5 }, emptyQuestion));
  const [qLoading, setQLoading] = useState(false);
  const [qSaving, setQSaving] = useState(false);
  const [qMsg, setQMsg] = useState('');

  // ---- Drill-down browser ----
  const [sessions, setSessions] = useState([]);
  const [allFaculty, setAllFaculty] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [view, setView] = useState('faculty'); // 'faculty' | 'sessions' | 'responses'
  const [selectedFaculty, setSelectedFaculty] = useState(null); // { id, name, department }
  const [selectedSession, setSelectedSession] = useState(null); // session object
  const [responseData, setResponseData] = useState(null);
  const [responsesLoading, setResponsesLoading] = useState(false);

  const fetchQuestions = async () => {
    try {
      setQLoading(true);
      const res = await axios.get(`${API_URL}/feedback/admin/questions`, authHeaders());
      const existing = res.data.questions || [];
      const filled = [0, 1, 2, 3, 4].map((i) => {
        const q = existing.find((x) => x.order === i + 1);
        if (!q) return emptyQuestion();
        return {
          text: q.text || '',
          type: q.type || 'linear_scale',
          options: q.options && q.options.length >= 2 ? q.options : ['', ''],
          scaleMin: q.scaleMin ?? 1,
          scaleMax: q.scaleMax ?? 5
        };
      });
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
      const [sessionsRes, facultyRes] = await Promise.all([
        axios.get(`${API_URL}/feedback/admin/sessions`, authHeaders()),
        axios.get(`${API_URL}/faculty/admin/list`, authHeaders())
      ]);
      setSessions(sessionsRes.data.sessions || []);
      setAllFaculty(facultyRes.data.faculty || facultyRes.data || []);
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

  const updateQuestion = (i, patch) => {
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  };
  const updateOption = (qi, oi, value) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === qi ? { ...q, options: q.options.map((o, x) => (x === oi ? value : o)) } : q))
    );
  };
  const addOption = (qi) => {
    setQuestions((prev) => prev.map((q, idx) => (idx === qi ? { ...q, options: [...q.options, ''] } : q)));
  };
  const removeOption = (qi, oi) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === qi ? { ...q, options: q.options.filter((_, x) => x !== oi) } : q))
    );
  };

  const handleSaveQuestions = async () => {
    for (const q of questions) {
      if (!q.text.trim()) {
        setQMsg('❌ All 5 questions are required.');
        return;
      }
      if (CHOICE_TYPES.includes(q.type) && q.options.map((o) => o.trim()).filter(Boolean).length < 2) {
        setQMsg(`❌ "${q.text}" needs at least 2 options.`);
        return;
      }
      if (q.type === 'linear_scale' && Number(q.scaleMin) >= Number(q.scaleMax)) {
        setQMsg(`❌ "${q.text}" has an invalid scale range.`);
        return;
      }
    }
    const payload = questions.map((q) => ({
      text: q.text.trim(),
      type: q.type,
      options: CHOICE_TYPES.includes(q.type) ? q.options.map((o) => o.trim()).filter(Boolean) : undefined,
      scaleMin: q.type === 'linear_scale' ? Number(q.scaleMin) : undefined,
      scaleMax: q.type === 'linear_scale' ? Number(q.scaleMax) : undefined
    }));
    try {
      setQSaving(true);
      setQMsg('');
      await axios.put(`${API_URL}/feedback/admin/questions`, { questions: payload }, authHeaders());
      setQMsg('✅ Saved!');
      setTimeout(() => setQMsg(''), 3000);
    } catch (err) {
      setQMsg(err.response?.data?.error || '❌ Could not save questions.');
    } finally {
      setQSaving(false);
    }
  };

  // Every faculty member shows up (even with 0 classes so far), plus a bucket
  // for any orphaned sessions whose faculty reference didn't populate.
  const facultyGroups = useMemo(() => {
    const map = new Map();
    allFaculty.forEach((f) => {
      map.set(f._id, { id: f._id, name: f.name, department: f.department || '', sessions: [] });
    });
    sessions.forEach((s) => {
      const id = s.faculty?._id;
      if (id && map.has(id)) {
        map.get(id).sessions.push(s);
      } else if (id) {
        // Faculty populated but not in the roster fetch (e.g. deleted) — group by id anyway.
        if (!map.has(id)) {
          map.set(id, { id, name: s.faculty?.name || 'Unknown faculty', department: s.faculty?.department || '', sessions: [] });
        }
        map.get(id).sessions.push(s);
      } else {
        if (!map.has('unknown')) {
          map.set('unknown', { id: 'unknown', name: 'Unknown faculty', department: '', sessions: [] });
        }
        map.get('unknown').sessions.push(s);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allFaculty, sessions]);

  const openFaculty = (group) => {
    setSelectedFaculty(group);
    setView('sessions');
  };

  const openSession = async (session) => {
    setSelectedSession(session);
    setView('responses');
    setResponseData(null);
    try {
      setResponsesLoading(true);
      const res = await axios.get(`${API_URL}/feedback/admin/session/${session._id}/responses`, authHeaders());
      setResponseData(res.data);
    } catch (err) {
      console.error('Failed to load responses', err);
    } finally {
      setResponsesLoading(false);
    }
  };

  const backToFaculty = () => {
    setView('faculty');
    setSelectedFaculty(null);
    setSelectedSession(null);
    setResponseData(null);
  };

  const backToSessions = () => {
    setView('sessions');
    setSelectedSession(null);
    setResponseData(null);
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
                  <div key={i} style={styles.qCard}>
                    <div style={styles.qLabel}>Question {i + 1}</div>
                    <input
                      style={styles.input}
                      placeholder={`Question ${i + 1}`}
                      value={q.text}
                      onChange={(e) => updateQuestion(i, { text: e.target.value })}
                    />
                    <div style={styles.typeRow}>
                      {TYPE_OPTIONS.map((opt) => (
                        <span
                          key={opt.value}
                          style={q.type === opt.value ? styles.typeChipActive : styles.typeChip}
                          onClick={() =>
                            updateQuestion(i, {
                              type: opt.value,
                              options: CHOICE_TYPES.includes(opt.value) && q.options.length < 2 ? ['', ''] : q.options
                            })
                          }
                        >
                          {opt.label}
                        </span>
                      ))}
                    </div>

                    {CHOICE_TYPES.includes(q.type) && (
                      <div style={styles.optionsBlock}>
                        {q.options.map((opt, oi) => (
                          <div key={oi} style={styles.optionRow}>
                            <input
                              style={styles.optionInput}
                              placeholder={`Option ${oi + 1}`}
                              value={opt}
                              onChange={(e) => updateOption(i, oi, e.target.value)}
                            />
                            {q.options.length > 2 && (
                              <span style={styles.removeOptBtn} onClick={() => removeOption(i, oi)}>✕</span>
                            )}
                          </div>
                        ))}
                        <span style={styles.addOptText} onClick={() => addOption(i)}>+ Add option</span>
                      </div>
                    )}

                    {q.type === 'linear_scale' && (
                      <div style={styles.scaleRow}>
                        <span style={styles.rowMeta}>Scale:</span>
                        <input
                          style={styles.scaleInput}
                          type="number"
                          value={q.scaleMin}
                          onChange={(e) => updateQuestion(i, { scaleMin: e.target.value })}
                        />
                        <span style={styles.rowMeta}>to</span>
                        <input
                          style={styles.scaleInput}
                          type="number"
                          value={q.scaleMax}
                          onChange={(e) => updateQuestion(i, { scaleMax: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                ))}
                <button style={styles.saveBtn} onClick={handleSaveQuestions} disabled={qSaving}>
                  {qSaving ? 'Saving…' : 'Save Questions'}
                </button>
                {qMsg && <span style={styles.msg}>{qMsg}</span>}
              </>
            )}
          </div>

          <div style={styles.block}>
            <div style={styles.breadcrumb}>
              <span
                style={view === 'faculty' ? styles.crumbActive : styles.crumbLink}
                onClick={backToFaculty}
              >
                Faculty
              </span>
              {selectedFaculty && (
                <>
                  <span style={styles.crumbSep}>›</span>
                  <span
                    style={view === 'sessions' ? styles.crumbActive : styles.crumbLink}
                    onClick={backToSessions}
                  >
                    {selectedFaculty.name}
                  </span>
                </>
              )}
              {selectedSession && (
                <>
                  <span style={styles.crumbSep}>›</span>
                  <span style={styles.crumbActive}>{selectedSession.subject}</span>
                </>
              )}
            </div>

            {/* ---------- Level 1: Faculty list ---------- */}
            {view === 'faculty' && (
              sessionsLoading ? (
                <p style={styles.blockHint}>Loading…</p>
              ) : facultyGroups.length === 0 ? (
                <p style={styles.blockHint}>No sessions have started feedback yet.</p>
              ) : (
                <div style={styles.list}>
                  {facultyGroups.map((g) => (
                    <div key={g.id} style={styles.rowCard} onClick={() => openFaculty(g)}>
                      <div>
                        <div style={styles.rowTitle}>{g.name}</div>
                        <div style={styles.rowMeta}>{g.department}</div>
                      </div>
                      <div style={styles.rowRight}>
                        <span style={g.sessions.length > 0 ? styles.countPill : styles.countPillEmpty}>
                          {g.sessions.length} class{g.sessions.length !== 1 ? 'es' : ''}
                        </span>
                        <span style={styles.chevron}>›</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ---------- Level 2: Classes for selected faculty ---------- */}
            {view === 'sessions' && selectedFaculty && (
              selectedFaculty.sessions.length === 0 ? (
                <p style={styles.blockHint}>No feedback started for any class yet.</p>
              ) : (
              <div style={styles.list}>
                {selectedFaculty.sessions.map((s) => (
                  <div key={s._id} style={styles.rowCard} onClick={() => openSession(s)}>
                    <div>
                      <div style={styles.rowTitle}>{s.subject}</div>
                      <div style={styles.rowMeta}>
                        {s.venue ? `${s.venue} · ` : ''}
                        {formatDate(s.feedbackStartedAt || s.date)}
                      </div>
                    </div>
                    <div style={styles.rowRight}>
                      <span style={s.feedbackStatus === 'open' ? styles.statusOpen : styles.statusClosed}>
                        {s.feedbackStatus === 'open' ? 'Open' : 'Closed'}
                      </span>
                      <span style={styles.chevron}>›</span>
                    </div>
                  </div>
                ))}
              </div>
              )
            )}

            {/* ---------- Level 3: Student responses for selected session ---------- */}
            {view === 'responses' && selectedSession && (
              responsesLoading ? (
                <p style={styles.blockHint}>Loading responses…</p>
              ) : !responseData || responseData.count === 0 ? (
                <p style={styles.blockHint}>No responses yet.</p>
              ) : (
                <div style={styles.list}>
                  {responseData.responses.map((r) => (
                    <div key={r._id} style={styles.responseCard}>
                      <div style={styles.rowTitle}>
                        {r.student?.name} <span style={styles.rowMeta}>({r.student?.rollNo})</span>
                      </div>
                      {r.answers
                        .slice()
                        .sort((a, b) => (a.source === b.source ? a.order - b.order : a.source === 'admin' ? -1 : 1))
                        .map((a, idx) => (
                          <div key={idx} style={styles.answerRow}>
                            <span style={styles.answerSourceTag}>
                              {a.source === 'admin' ? 'General' : 'This Class'}
                            </span>{' '}
                            <span style={styles.answerText}>{a.questionText}</span>
                            <div style={styles.answerValue}>
                              {(a.questionType === 'short_answer' || a.questionType === 'paragraph') && (
                                <span>"{a.textValue}"</span>
                              )}
                              {(a.questionType === 'numerical') && <span>{a.numberValue}</span>}
                              {(a.questionType === 'linear_scale') && (
                                <span style={styles.stars}>{'⭐'.repeat(a.numberValue)}</span>
                              )}
                              {(a.questionType === 'multiple_choice' || a.questionType === 'dropdown') && (
                                <span style={styles.answerChip}>{a.selectedOptions?.[0]}</span>
                              )}
                              {a.questionType === 'checkboxes' &&
                                (a.selectedOptions || []).map((o, oi) => (
                                  <span key={oi} style={styles.answerChip}>{o}</span>
                                ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  wrapper: { marginBottom: 20, fontFamily: 'Arial, sans-serif' },
  toggleBtn: {
    padding: '10px 16px',
    borderRadius: 8,
    border: '1px solid #dcdfe6',
    background: 'white',
    color: '#2c3e50',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },
  panel: {
    marginTop: 12,
    padding: 20,
    borderRadius: 10,
    border: '1px solid #eee',
    background: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  block: { marginBottom: 24 },
  blockTitle: { color: '#2c3e50', fontSize: 16, fontWeight: 700, marginBottom: 6 },
  blockHint: { color: '#8a8f98', fontSize: 13, marginBottom: 10 },
  input: {
    display: 'block',
    width: '100%',
    maxWidth: 520,
    marginBottom: 8,
    padding: '9px 12px',
    borderRadius: 6,
    border: '1px solid #dcdfe6',
    background: '#f8faff',
    color: '#2c3e50',
    fontSize: 14
  },
  saveBtn: {
    padding: '9px 18px',
    borderRadius: 6,
    border: 'none',
    background: '#3f51b5',
    color: 'white',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    marginTop: 4
  },
  msg: { marginLeft: 12, color: '#5c6470', fontSize: 13 },

  qCard: { border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 10, background: '#fbfbfd', maxWidth: 560 },
  qLabel: { color: '#3f51b5', fontSize: 12, fontWeight: 700, marginBottom: 6 },
  typeRow: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  typeChip: {
    fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 12,
    border: '1.5px solid #3f51b5', color: '#3f51b5', cursor: 'pointer'
  },
  typeChipActive: {
    fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 12,
    border: '1.5px solid #3f51b5', color: 'white', background: '#3f51b5', cursor: 'pointer'
  },
  optionsBlock: { marginTop: 10 },
  optionRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 },
  optionInput: { flex: 1, fontSize: 13, padding: '6px 10px', borderRadius: 6, border: '1px solid #dcdfe6' },
  removeOptBtn: { color: '#a0a5ad', cursor: 'pointer', fontSize: 13 },
  addOptText: { color: '#3f51b5', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  scaleRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 },
  scaleInput: { width: 50, fontSize: 13, padding: '5px 6px', borderRadius: 6, border: '1px solid #dcdfe6', textAlign: 'center' },

  breadcrumb: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
  crumbLink: { color: '#3f51b5', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  crumbActive: { color: '#2c3e50', fontSize: 14, fontWeight: 700 },
  crumbSep: { color: '#c0c4cc', fontSize: 14 },

  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  rowCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid #eee',
    background: '#f8faff',
    cursor: 'pointer',
    transition: 'background 0.15s ease'
  },
  rowTitle: { color: '#2c3e50', fontSize: 14, fontWeight: 600 },
  rowMeta: { color: '#8a8f98', fontSize: 12, marginTop: 2 },
  rowRight: { display: 'flex', alignItems: 'center', gap: 10 },
  countPill: {
    background: '#e8eaf6',
    color: '#3f51b5',
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 12
  },
  countPillEmpty: {
    background: '#f1f2f4',
    color: '#a0a5ad',
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 12
  },
  statusOpen: {
    background: '#e8f5e9',
    color: '#2e7d32',
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 12
  },
  statusClosed: {
    background: '#eceff1',
    color: '#607d8b',
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 12
  },
  chevron: { color: '#c0c4cc', fontSize: 18 },

  responseCard: {
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid #eee',
    background: '#fbfbfd'
  },
  answerRow: { marginTop: 8, fontSize: 13, color: '#2c3e50' },
  answerSourceTag: {
    color: '#3f51b5',
    background: '#e8eaf6',
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 4,
    textTransform: 'uppercase'
  },
  answerText: { color: '#2c3e50' },
  answerValue: { marginTop: 4, marginLeft: 2, display: 'flex', flexWrap: 'wrap', gap: 6 },
  answerChip: {
    background: '#e8eaf6', color: '#3f51b5', fontSize: 12, fontWeight: 600,
    padding: '2px 8px', borderRadius: 10
  },
  stars: { fontSize: 12 },
  answerComment: { color: '#8a8f98', fontStyle: 'italic', marginTop: 2, marginLeft: 2 }
};

export default FeedbackSection;