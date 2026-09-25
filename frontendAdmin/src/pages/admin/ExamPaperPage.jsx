import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/admin/Sidebar';
import Topbar from '../../components/admin/Topbar';
import API_CONFIG from '../../config/api';
import { useNotification } from '../../context/NotificationContext';
import './ExamPaperPage.css';

const QUESTION_TYPES = ['Short Answer', 'Essay', 'MCQ', 'True/False', 'Fill in the Blank'];
const EXAM_TYPES = ['1st Term Test', '2nd Term Test', '3rd Term Test', 'Mid Term Exam', 'Final Exam', 'Monthly Test', 'Mock Exam'];
const STATUS_OPTS = ['Draft', 'Published', 'Archived'];
const STUDENT_TYPE_OPTS = [
  { value: 'Online', label: '🌐 Online Students Only' },
  { value: 'Physical', label: '🏫 Physical Students Only' },
  { value: 'Both', label: '🌐🏫 Both Online & Physical' }
];
const GRADE_OPTIONS = [
  '', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
  'Grade 11 (O/L)', 'Grade 12 (A/L)', 'Grade 13 (A/L)',
  'Foundation', 'Diploma', 'Degree', 'Other'
];

const emptyQuestion = () => ({
  number: 1,
  questionText: '',
  type: 'Short Answer',
  marks: 1,
  options: ['', '', '', ''],
  answer: ''
});

const ExamPaperPage = () => {
  const { showSuccess, showError, showConfirm, toastSuccess } = useNotification();
  const [papers, setPapers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterExamType, setFilterExamType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [editingPaper, setEditingPaper] = useState(null);
  const [viewingPaper, setViewingPaper] = useState(null);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    subjectId: '',
    grade: '',
    examType: '1st Term Test',
    targetStudentType: 'Online',
    date: '',
    duration: 60,
    passMark: 0,
    instructions: '',
    teacherName: '',
    status: 'Draft'
  });
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const printRef = useRef();

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchPapers();
    fetchSubjects();
  }, []);

  const fetchPapers = async () => {
    try {
      const res = await fetch(`${API_CONFIG.API_URL}/exam-papers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setPapers(data.data);
    } catch (err) { console.error(err); }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch(`${API_CONFIG.API_URL}/subjects`);
      const data = await res.json();
      if (data.success && data.data) setAvailableSubjects(data.data);
    } catch (err) { console.error(err); }
  };

  const totalMarks = questions.reduce((sum, q) => sum + (parseFloat(q.marks) || 0), 0);

  // ── Questions helpers ──────────────────────────────────────
  const addQuestion = () => {
    setQuestions(prev => [...prev, { ...emptyQuestion(), number: prev.length + 1, options: ['', '', '', ''] }]);
  };

  const removeQuestion = (idx) => {
    if (questions.length === 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, number: i + 1 })));
  };

  const updateQuestion = (idx, field, value) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const updateOption = (qIdx, optIdx, value) => {
    setQuestions(prev => {
      const updated = [...prev];
      const opts = [...(updated[qIdx].options || ['', '', '', ''])];
      opts[optIdx] = value;
      updated[qIdx] = { ...updated[qIdx], options: opts };
      return updated;
    });
  };

  const moveQuestion = (idx, direction) => {
    setQuestions(prev => {
      const arr = [...prev];
      const swapIdx = idx + direction;
      if (swapIdx < 0 || swapIdx >= arr.length) return arr;
      [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
      return arr.map((q, i) => ({ ...q, number: i + 1 }));
    });
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.subject.trim()) {
      showError('Validation Error', 'Title and Subject are required.');
      return;
    }
    const incompleteQ = questions.find(q => !q.questionText.trim());
    if (incompleteQ) {
      showError('Validation Error', `Question ${incompleteQ.number} has no text.`);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        duration: parseInt(formData.duration) || 60,
        passMark: parseFloat(formData.passMark) || 0,
        questions: questions.map((q, i) => ({
          number: i + 1,
          questionText: q.questionText,
          type: q.type,
          marks: parseFloat(q.marks) || 1,
          options: q.type === 'MCQ' ? q.options : [],
          answer: q.answer || ''
        }))
      };

      const url = editingPaper
        ? `${API_CONFIG.API_URL}/exam-papers/${editingPaper._id}`
        : `${API_CONFIG.API_URL}/exam-papers`;
      const method = editingPaper ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchPapers();
        showSuccess(editingPaper ? 'Paper Updated' : 'Paper Created', data.message);
        resetForm();
        setShowForm(false);
      } else {
        showError('Save Failed', data.message || 'Could not save exam paper.');
      }
    } catch (err) {
      showError('Network Error', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', subject: '', subjectId: '', grade: '', examType: '1st Term Test', targetStudentType: 'Online', date: '', duration: 60, passMark: 0, instructions: '', teacherName: '', status: 'Draft' });
    setQuestions([emptyQuestion()]);
    setEditingPaper(null);
  };

  const handleEdit = (paper) => {
    setViewingPaper(null);
    setEditingPaper(paper);
    setFormData({
      title: paper.title || '',
      subject: paper.subject || '',
      subjectId: typeof paper.subjectId === 'object' ? paper.subjectId?._id : (paper.subjectId || ''),
      grade: paper.grade || '',
      examType: paper.examType || '1st Term Test',
      targetStudentType: paper.targetStudentType || 'Online',
      date: paper.date ? paper.date.slice(0, 10) : '',
      duration: paper.duration || 60,
      passMark: paper.passMark || 0,
      instructions: paper.instructions || '',
      teacherName: paper.teacherName || '',
      status: paper.status || 'Draft'
    });
    setQuestions(paper.questions && paper.questions.length > 0
      ? paper.questions.map((q, i) => ({ ...q, options: q.options && q.options.length === 4 ? q.options : ['', '', '', ''], number: i + 1 }))
      : [emptyQuestion()]
    );
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const ok = await showConfirm({ title: 'Delete Exam Paper?', message: 'This action cannot be undone.', confirmText: 'Delete', confirmBtnColor: '#dc2626' });
    if (!ok) return;
    try {
      const res = await fetch(`${API_CONFIG.API_URL}/exam-papers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchPapers();
        showSuccess('Deleted', 'Exam paper removed successfully.');
      } else {
        showError('Delete Failed', data.message);
      }
    } catch { showError('Network Error', 'Please try again.'); }
  };

  // ── Print / Preview ────────────────────────────────────────
  const handlePrint = (paper) => {
    const printContent = buildPrintHTML(paper);
    const win = window.open('', '_blank');
    win.document.write(printContent);
    win.document.close();
    win.focus();
    win.print();
  };

  const buildPrintHTML = (paper) => {
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
    const letterMap = ['A', 'B', 'C', 'D'];

    const questionsHTML = (paper.questions || []).map((q) => {
      let optionsHTML = '';
      if (q.type === 'MCQ' && q.options && q.options.some(o => o)) {
        optionsHTML = `<div class="options">${q.options.map((o, i) => o ? `<div class="option">${letterMap[i]}. ${o}</div>` : '').join('')}</div>`;
      }
      if (q.type === 'True/False') {
        optionsHTML = `<div class="options"><div class="option">A. True</div><div class="option">B. False</div></div>`;
      }
      const lines = q.type === 'Short Answer' ? 3 : q.type === 'Essay' ? 8 : q.type === 'Fill in the Blank' ? 1 : 0;
      const answerLines = lines > 0
        ? `<div class="answer-lines">${Array(lines).fill('<div class="line"></div>').join('')}</div>`
        : '';

      return `
        <div class="question-block">
          <div class="question-header">
            <span class="q-num">Q${q.number}.</span>
            <span class="q-text">${q.questionText}</span>
            <span class="q-marks">[${q.marks} mark${q.marks !== 1 ? 's' : ''}]</span>
          </div>
          ${optionsHTML}
          ${answerLines}
        </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>${paper.title}</title>
  <style>
    @page { margin: 20mm 18mm; }
    body { font-family: 'Times New Roman', serif; color: #000; font-size: 12pt; line-height: 1.5; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 18px; }
    .school-name { font-size: 16pt; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
    .paper-title { font-size: 14pt; font-weight: bold; margin: 4px 0; }
    .paper-meta { font-size: 10pt; display: flex; justify-content: space-between; margin-top: 8px; }
    .instructions-box { border: 1px solid #000; padding: 8px 12px; margin: 12px 0; font-size: 10pt; }
    .instructions-box h4 { margin: 0 0 4px 0; font-size: 10pt; text-transform: uppercase; }
    .student-info { display: flex; gap: 30px; margin: 12px 0 20px 0; font-size: 10pt; }
    .student-field { flex: 1; border-bottom: 1px solid #000; padding-bottom: 2px; }
    .student-field label { font-weight: bold; }
    .section-title { font-size: 11pt; font-weight: bold; text-transform: uppercase; margin: 16px 0 8px 0; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    .question-block { margin-bottom: 20px; page-break-inside: avoid; }
    .question-header { display: flex; gap: 6px; align-items: flex-start; }
    .q-num { font-weight: bold; min-width: 28px; }
    .q-text { flex: 1; }
    .q-marks { font-weight: bold; white-space: nowrap; font-size: 10pt; color: #333; }
    .options { margin: 6px 0 0 34px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
    .option { font-size: 11pt; }
    .answer-lines { margin: 6px 0 0 34px; }
    .line { border-bottom: 1px solid #888; height: 22px; margin-bottom: 6px; }
    .footer { text-align: center; font-size: 9pt; color: #555; border-top: 1px solid #000; padding-top: 6px; margin-top: 20px; }
    @media print { body { -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="school-name">Wisdom Institute of Higher Education</div>
    <div class="paper-title">${paper.title}</div>
    <div class="paper-meta">
      <span><strong>Subject:</strong> ${paper.subject}</span>
      <span><strong>Grade:</strong> ${paper.grade || '—'}</span>
      <span><strong>Date:</strong> ${formatDate(paper.date)}</span>
      <span><strong>Duration:</strong> ${paper.duration} min</span>
      <span><strong>Total Marks:</strong> ${paper.totalMarks}</span>
    </div>
    ${paper.teacherName ? `<div style="font-size:10pt; margin-top:4px;"><strong>Teacher:</strong> ${paper.teacherName}</div>` : ''}
  </div>

  ${paper.instructions ? `
  <div class="instructions-box">
    <h4>Instructions</h4>
    <p>${paper.instructions.replace(/\n/g, '<br/>')}</p>
  </div>` : ''}

  <div class="student-info">
    <div class="student-field"><label>Name: </label>___________________________________</div>
    <div class="student-field"><label>Index No: </label>_______________</div>
    <div class="student-field"><label>Class: </label>_______________</div>
  </div>

  <div class="section-title">Questions</div>
  ${questionsHTML}

  <div class="footer">
    ${paper.examType} &nbsp;|&nbsp; Wisdom Institute of Higher Education &nbsp;|&nbsp; Pass Mark: ${paper.passMark}/${paper.totalMarks}
  </div>
</body>
</html>`;
  };

  // ── Filtering ──────────────────────────────────────────────
  const filteredPapers = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return papers.filter(p => {
      if (term && !`${p.title} ${p.subject} ${p.grade} ${p.teacherName || ''} ${p.examType}`.toLowerCase().includes(term)) return false;
      if (filterSubject !== 'All' && p.subject !== filterSubject) return false;
      if (filterExamType !== 'All' && p.examType !== filterExamType) return false;
      if (filterStatus !== 'All' && p.status !== filterStatus) return false;
      return true;
    });
  }, [papers, searchTerm, filterSubject, filterExamType, filterStatus]);

  const subjectOptions = React.useMemo(() => ['All', ...Array.from(new Set(papers.map(p => p.subject).filter(Boolean))).sort()], [papers]);
  const examTypeOptions = React.useMemo(() => ['All', ...Array.from(new Set(papers.map(p => p.examType).filter(Boolean))).sort()], [papers]);

  const statusColor = (s) => s === 'Published' ? { bg: '#dcfce7', color: '#15803d' } : s === 'Archived' ? { bg: '#f1f5f9', color: '#64748b' } : { bg: '#fef9c3', color: '#a16207' };

  const isAnyFilter = filterSubject !== 'All' || filterExamType !== 'All' || filterStatus !== 'All' || searchTerm.trim();

  return (
    <div className="ep-page">
      <Sidebar />
      <div className="ep-main">
        <Topbar userName="Wisdom Admin" />
        <div className="ep-content">

          {/* ── Header ── */}
          <div className="ep-header">
            <div>
              <h1>📄 Exam Papers</h1>
              <p className="ep-subtitle">Create and manage exam question papers</p>
            </div>
            <div className="ep-header-actions">
              <div className="ep-search">
                <input
                  type="text"
                  placeholder="Search papers..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                {searchTerm && <button className="ep-clear-btn" onClick={() => setSearchTerm('')}>×</button>}
              </div>
              <button className="ep-create-btn" onClick={() => { if (showForm) { resetForm(); setShowForm(false); } else { setShowForm(true); } }}>
                {showForm ? '✕ Cancel' : '+ Create Paper'}
              </button>
            </div>
          </div>

          {/* ── Form ── */}
          {showForm && (
            <div className="ep-form-container">
              <h2>{editingPaper ? '✏️ Edit Exam Paper' : '📝 Create New Exam Paper'}</h2>
              <form onSubmit={handleSubmit} className="ep-form">

                {/* Row 1: Title + Subject */}
                <div className="ep-form-row">
                  <div className="ep-form-group ep-grow2">
                    <label>Paper Title <span className="required">*</span></label>
                    <input type="text" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Mathematics – 1st Term Paper 2025" required />
                  </div>
                  <div className="ep-form-group ep-grow1">
                    <label>Subject <span className="required">*</span></label>
                    <select value={formData.subjectId} onChange={e => {
                      const sub = availableSubjects.find(s => s._id === e.target.value);
                      setFormData(p => ({ ...p, subjectId: e.target.value, subject: sub ? sub.name : p.subject, teacherName: sub?.conductedBy?.name || p.teacherName }));
                    }}>
                      <option value="">Select from DB...</option>
                      {availableSubjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                    <input type="text" value={formData.subject} onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))} placeholder="Or type subject name" style={{ marginTop: '4px' }} required />
                  </div>
                </div>

                {/* Row 2: Student Type + Grade */}
                <div className="ep-form-row" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '10px 12px', gap: '12px' }}>
                  <div className="ep-form-group ep-grow1">
                    <label style={{ color: '#0369a1', fontWeight: '700' }}>
                      🎯 For Which Students? <span className="required">*</span>
                    </label>
                    <select
                      value={formData.targetStudentType}
                      onChange={e => setFormData(p => ({ ...p, targetStudentType: e.target.value }))}
                      style={{ borderColor: '#7dd3fc', background: '#fff' }}
                      required
                    >
                      {STUDENT_TYPE_OPTS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <small style={{ color: '#0369a1', fontSize: '0.72rem', marginTop: '2px' }}>
                      Only Published papers are visible to matching students
                    </small>
                  </div>
                  <div className="ep-form-group ep-grow1">
                    <label style={{ color: '#0369a1', fontWeight: '700' }}>Grade / Class</label>
                    <select
                      value={formData.grade}
                      onChange={e => setFormData(p => ({ ...p, grade: e.target.value }))}
                      style={{ borderColor: '#7dd3fc', background: '#fff' }}
                    >
                      {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g || '— Select Grade —'}</option>)}
                    </select>
                    <small style={{ color: '#0369a1', fontSize: '0.72rem', marginTop: '2px' }}>
                      Leave blank to show to all grades
                    </small>
                  </div>
                </div>

                {/* Row 3: Exam Type, Date, Duration */}
                <div className="ep-form-row">
                  <div className="ep-form-group">
                    <label>Exam Type</label>
                    <select value={formData.examType} onChange={e => setFormData(p => ({ ...p, examType: e.target.value }))}>
                      {EXAM_TYPES.map(et => <option key={et} value={et}>{et}</option>)}
                    </select>
                  </div>
                  <div className="ep-form-group">
                    <label>Exam Date</label>
                    <input type="date" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} />
                  </div>
                  <div className="ep-form-group">
                    <label>Duration (minutes)</label>
                    <input type="number" value={formData.duration} onChange={e => setFormData(p => ({ ...p, duration: e.target.value }))} min="10" max="480" />
                  </div>
                </div>

                {/* Row 3: Teacher, Pass Mark, Status */}
                <div className="ep-form-row">
                  <div className="ep-form-group ep-grow1">
                    <label>Teacher Name</label>
                    <input type="text" value={formData.teacherName} onChange={e => setFormData(p => ({ ...p, teacherName: e.target.value }))} placeholder="Teacher / Invigilator" />
                  </div>
                  <div className="ep-form-group">
                    <label>Pass Mark</label>
                    <input type="number" value={formData.passMark} onChange={e => setFormData(p => ({ ...p, passMark: e.target.value }))} min="0" />
                  </div>
                  <div className="ep-form-group">
                    <label>Status</label>
                    <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}>
                      {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Instructions */}
                <div className="ep-form-group" style={{ width: '100%' }}>
                  <label>Instructions (shown on paper)</label>
                  <textarea value={formData.instructions} onChange={e => setFormData(p => ({ ...p, instructions: e.target.value }))} rows={3} placeholder="e.g. Answer ALL questions. Write clearly in blue or black ink." />
                </div>

                {/* ── Questions Builder ── */}
                <div className="ep-questions-section">
                  <div className="ep-questions-header">
                    <h3>📋 Questions</h3>
                    <div className="ep-total-badge">Total: <strong>{totalMarks}</strong> marks | <strong>{questions.length}</strong> question{questions.length !== 1 ? 's' : ''}</div>
                    <button type="button" className="ep-add-q-btn" onClick={addQuestion}>+ Add Question</button>
                  </div>

                  <div className="ep-questions-list">
                    {questions.map((q, idx) => (
                      <div key={idx} className="ep-question-card">
                        <div className="ep-question-card-header">
                          <span className="ep-q-label">Q{q.number}</span>
                          <select className="ep-q-type-sel" value={q.type} onChange={e => updateQuestion(idx, 'type', e.target.value)}>
                            {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <div className="ep-q-marks-input">
                            <label>Marks:</label>
                            <input type="number" min="0.5" step="0.5" value={q.marks} onChange={e => updateQuestion(idx, 'marks', e.target.value)} />
                          </div>
                          <div className="ep-q-move-btns">
                            <button type="button" onClick={() => moveQuestion(idx, -1)} disabled={idx === 0} title="Move up">↑</button>
                            <button type="button" onClick={() => moveQuestion(idx, 1)} disabled={idx === questions.length - 1} title="Move down">↓</button>
                          </div>
                          {questions.length > 1 && (
                            <button type="button" className="ep-q-remove-btn" onClick={() => removeQuestion(idx)} title="Remove question">×</button>
                          )}
                        </div>

                        <div className="ep-q-text-row">
                          <textarea
                            value={q.questionText}
                            onChange={e => updateQuestion(idx, 'questionText', e.target.value)}
                            placeholder={`Enter question ${q.number} here...`}
                            rows={2}
                            required
                          />
                        </div>

                        {/* MCQ options */}
                        {q.type === 'MCQ' && (
                          <div className="ep-q-options">
                            {['A', 'B', 'C', 'D'].map((letter, oIdx) => (
                              <div key={oIdx} className="ep-option-row">
                                <span className="ep-option-letter">{letter}.</span>
                                <input
                                  type="text"
                                  value={q.options?.[oIdx] || ''}
                                  onChange={e => updateOption(idx, oIdx, e.target.value)}
                                  placeholder={`Option ${letter}`}
                                />
                              </div>
                            ))}
                            <div className="ep-answer-row">
                              <label>Correct Answer:</label>
                              <select value={q.answer || ''} onChange={e => updateQuestion(idx, 'answer', e.target.value)}>
                                <option value="">—</option>
                                {['A', 'B', 'C', 'D'].map(l => <option key={l} value={l}>{l}</option>)}
                              </select>
                            </div>
                          </div>
                        )}

                        {/* True/False */}
                        {q.type === 'True/False' && (
                          <div className="ep-q-options">
                            <div className="ep-answer-row">
                              <label>Correct Answer:</label>
                              <select value={q.answer || ''} onChange={e => updateQuestion(idx, 'answer', e.target.value)}>
                                <option value="">—</option>
                                <option value="True">True</option>
                                <option value="False">False</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form actions */}
                <div className="ep-form-actions">
                  <button type="button" className="ep-cancel-btn" onClick={() => { resetForm(); setShowForm(false); }}>Cancel</button>
                  <button type="submit" className="ep-submit-btn" disabled={loading}>
                    {loading ? 'Saving...' : editingPaper ? 'Update Paper' : 'Save Paper'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Filters ── */}
          <div className="ep-filters">
            <div className="ep-filter-item">
              <label>Subject:</label>
              <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
                {subjectOptions.map(s => <option key={s} value={s}>{s === 'All' ? 'All Subjects' : s}</option>)}
              </select>
            </div>
            <div className="ep-filter-item">
              <label>Exam Type:</label>
              <select value={filterExamType} onChange={e => setFilterExamType(e.target.value)}>
                {examTypeOptions.map(et => <option key={et} value={et}>{et === 'All' ? 'All Types' : et}</option>)}
              </select>
            </div>
            <div className="ep-filter-item">
              <label>Status:</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                {['All', ...STATUS_OPTS].map(s => <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>)}
              </select>
            </div>
            {isAnyFilter && (
              <button className="ep-reset-btn" onClick={() => { setFilterSubject('All'); setFilterExamType('All'); setFilterStatus('All'); setSearchTerm(''); }}>✕ Clear</button>
            )}
            <span className="ep-count-badge">Showing <strong>{filteredPapers.length}</strong> of {papers.length}</span>
          </div>

          {/* ── Papers Grid ── */}
          {papers.length === 0 ? (
            <div className="ep-empty">
              <div className="ep-empty-icon">📄</div>
              <p>No exam papers yet. Click <strong>+ Create Paper</strong> to build your first one.</p>
            </div>
          ) : filteredPapers.length === 0 ? (
            <div className="ep-empty"><p>No papers match your search or filters.</p></div>
          ) : (
            <div className="ep-grid">
              {filteredPapers.map(paper => {
                const sc = statusColor(paper.status);
                const subName = typeof paper.subjectId === 'object' ? paper.subjectId?.name : paper.subject;
                const dateStr = paper.date ? new Date(paper.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                return (
                  <div key={paper._id} className="ep-card">
                    <div className="ep-card-top">
                      <div className="ep-card-status" style={{ background: sc.bg, color: sc.color }}>{paper.status}</div>
                      <div className="ep-card-type-badge">{paper.examType}</div>
                      {paper.targetStudentType && (
                        <div style={{
                          fontSize: '0.68rem', fontWeight: '700', padding: '2px 8px',
                          borderRadius: '20px', whiteSpace: 'nowrap',
                          background: paper.targetStudentType === 'Online' ? '#dbeafe' : paper.targetStudentType === 'Physical' ? '#dcfce7' : '#fef9c3',
                          color: paper.targetStudentType === 'Online' ? '#1d4ed8' : paper.targetStudentType === 'Physical' ? '#15803d' : '#a16207',
                          border: `1px solid ${paper.targetStudentType === 'Online' ? '#93c5fd' : paper.targetStudentType === 'Physical' ? '#86efac' : '#fde68a'}`
                        }}>
                          {paper.targetStudentType === 'Online' ? '🌐 Online' : paper.targetStudentType === 'Physical' ? '🏫 Physical' : '🌐🏫 Both'}
                        </div>
                      )}
                    </div>
                    <h3 className="ep-card-title">{paper.title}</h3>
                    <div className="ep-card-meta">
                      <span>📚 {subName || paper.subject}</span>
                      {paper.grade && <span>🎓 {paper.grade}</span>}
                      <span>📅 {dateStr}</span>
                      <span>⏱ {paper.duration} min</span>
                      <span>❓ {paper.questions?.length || 0} Qs</span>
                      <span>🏆 {paper.totalMarks} marks</span>
                    </div>
                    {paper.teacherName && <div className="ep-card-teacher">👤 {paper.teacherName}</div>}
                    <div className="ep-card-actions">
                      <button className="ep-view-btn" onClick={() => setViewingPaper(paper)}>Preview</button>
                      <button className="ep-print-btn" onClick={() => handlePrint(paper)}>🖨 Print</button>
                      <button className="ep-edit-btn" onClick={() => handleEdit(paper)}>Edit</button>
                      <button className="ep-delete-btn" onClick={() => handleDelete(paper._id)}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── View / Preview Modal ── */}
      {viewingPaper && (
        <div className="ep-modal-overlay" onClick={() => setViewingPaper(null)}>
          <div className="ep-modal" onClick={e => e.stopPropagation()}>
            <div className="ep-modal-header">
              <div>
                <h2>{viewingPaper.title}</h2>
                <p>{viewingPaper.subject} {viewingPaper.grade ? `• ${viewingPaper.grade}` : ''} • {viewingPaper.examType}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="ep-print-btn" onClick={() => handlePrint(viewingPaper)}>🖨 Print PDF</button>
                <button className="ep-modal-close" onClick={() => setViewingPaper(null)}>Close</button>
              </div>
            </div>
            <div className="ep-modal-body">
              {/* Meta strip */}
              <div className="ep-modal-meta">
                {viewingPaper.date && <span>📅 {new Date(viewingPaper.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>}
                <span>⏱ {viewingPaper.duration} minutes</span>
                <span>🏆 Total: {viewingPaper.totalMarks} marks</span>
                <span>✅ Pass: {viewingPaper.passMark} marks</span>
                {viewingPaper.teacherName && <span>👤 {viewingPaper.teacherName}</span>}
              </div>

              {viewingPaper.instructions && (
                <div className="ep-modal-instructions">
                  <strong>Instructions:</strong>
                  <p>{viewingPaper.instructions}</p>
                </div>
              )}

              <div className="ep-modal-questions">
                {(viewingPaper.questions || []).map((q, i) => (
                  <div key={i} className="ep-modal-q">
                    <div className="ep-modal-q-header">
                      <span className="ep-modal-q-num">Q{q.number}.</span>
                      <span className="ep-modal-q-text">{q.questionText}</span>
                      <span className="ep-modal-q-marks">[{q.marks} mark{q.marks !== 1 ? 's' : ''}]</span>
                      <span className="ep-modal-q-type">{q.type}</span>
                    </div>
                    {q.type === 'MCQ' && q.options && q.options.some(o => o) && (
                      <div className="ep-modal-options">
                        {q.options.map((opt, oi) => opt ? (
                          <div key={oi} className={`ep-modal-option ${q.answer === ['A', 'B', 'C', 'D'][oi] ? 'ep-correct' : ''}`}>
                            {['A', 'B', 'C', 'D'][oi]}. {opt}
                          </div>
                        ) : null)}
                      </div>
                    )}
                    {q.type === 'True/False' && (
                      <div className="ep-modal-options">
                        <div className={`ep-modal-option ${q.answer === 'True' ? 'ep-correct' : ''}`}>A. True</div>
                        <div className={`ep-modal-option ${q.answer === 'False' ? 'ep-correct' : ''}`}>B. False</div>
                      </div>
                    )}
                    {q.answer && ['MCQ', 'True/False'].includes(q.type) && (
                      <div className="ep-modal-answer">✓ Answer: {q.answer}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamPaperPage;
