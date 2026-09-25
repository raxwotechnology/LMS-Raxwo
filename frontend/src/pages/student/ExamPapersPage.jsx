import React, { useState, useRef, useEffect } from 'react';
import { useStudent } from '../../context/StudentContext';
import API_CONFIG from '../../config/api';

export default function ExamPapersPage() {
  const { examPapers, studentUser, showToast } = useStudent();
  const [activePaper, setActivePaper] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerRef, setTimerRef] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const answersRef = useRef({});

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const statusColor = (p) => {
    if (!p.date) return { bg: '#eff6ff', color: '#1d4ed8', label: 'Available' };
    const diff = Math.ceil((new Date(p.date) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { bg: '#f1f5f9', color: '#64748b', label: 'Past' };
    if (diff === 0) return { bg: '#fef9c3', color: '#a16207', label: 'Today' };
    return { bg: '#dcfce7', color: '#15803d', label: `In ${diff} day${diff !== 1 ? 's' : ''}` };
  };

  // ── Start attempt ──────────────────────────────────────────
  const startAttempt = (paper) => {
    setActivePaper(paper);
    setAnswers({});
    answersRef.current = {};
    setSubmitted(false);
    setScore(null);
    setSubmitting(false);
    setSubmitError('');

    const totalSeconds = (paper.duration || 60) * 60;
    setTimeLeft(totalSeconds);
    const ref = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(ref);
          doSubmit(paper, answersRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setTimerRef(ref);
  };

  // ── Core submit logic (also called on auto-submit) ──────────
  const doSubmit = async (paper, currentAnswers) => {
    if (submitting || submitted) return;
    if (timerRef) clearInterval(timerRef);
    setSubmitting(true);
    setSubmitError('');

    const answersArray = (paper.questions || []).map((_, idx) => {
      const val = currentAnswers?.[idx];
      return val == null ? '' : String(val);
    });

    if (!paper?._id) {
      setSubmitting(false);
      setSubmitError('This paper cannot be submitted because it has no ID.');
      return;
    }

    try {
      const res = await fetch(`${API_CONFIG.API_URL}/exam-submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examPaperId: paper._id,
          studentId: studentUser?.studentId || studentUser?.email || studentUser?._id || 'unknown',
          studentName: studentUser?.name || studentUser?.studentName || '',
          studentEmail: studentUser?.email || '',
          answers: answersArray
        })
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        if (data.data) {
          const { earnedMarks, totalMarks, percentage, passed, passMark } = data.data;
          setScore({ earned: earnedMarks, total: totalMarks, percentage, passed, passMark });
        }
        if (showToast) showToast('Paper submitted successfully', 'success');
      } else {
        setSubmitError(data.message || 'Could not submit paper. Please try again.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = (paper) => {
    doSubmit(paper, answers);
  };

  const handleSubmit = () => {
    doSubmit(activePaper, answers);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const letterMap = ['A', 'B', 'C', 'D'];

  // ── Attempt UI ─────────────────────────────────────────────
  if (activePaper) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '80px' }}>
        {/* Sticky header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: '#fff', borderBottom: '1px solid #e2e8f0',
          padding: '10px 16px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '1rem', color: '#1e293b' }}>{activePaper.title}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{activePaper.subject} • {activePaper.grade || 'All Grades'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {!submitted && timeLeft !== null && (
              <div style={{
                fontSize: '1rem', fontWeight: '800',
                color: timeLeft < 300 ? '#dc2626' : '#0369a1',
                background: timeLeft < 300 ? '#fee2e2' : '#dbeafe',
                padding: '6px 14px', borderRadius: '8px',
                border: `1px solid ${timeLeft < 300 ? '#fca5a5' : '#93c5fd'}`
              }}>
                ⏱ {formatTime(timeLeft)}
              </div>
            )}
            {!submitted ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  background: submitting ? '#94a3b8' : '#6366f1', color: '#fff', border: 'none',
                  borderRadius: '8px', padding: '8px 20px', fontWeight: '700',
                  cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '0.875rem'
                }}
              >
                {submitting ? '⏳ Submitting...' : 'Submit Paper'}
              </button>
            ) : (
              <button
                onClick={() => { setActivePaper(null); if (timerRef) clearInterval(timerRef); }}
                style={{
                  background: '#f1f5f9', color: '#374151', border: '1px solid #e2e8f0',
                  borderRadius: '8px', padding: '8px 20px', fontWeight: '700',
                  cursor: 'pointer', fontSize: '0.875rem'
                }}
              >
                ← Back to Papers
              </button>
            )}
          </div>
        </div>

        {/* Submitted result banner */}
        {submitError && !submitted && (
          <div style={{
            margin: '16px 0', padding: '14px 18px', borderRadius: '12px',
            background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', fontWeight: 600
          }}>
            {submitError}
          </div>
        )}
        {submitted && (
          <div style={{
            margin: '16px 0', padding: '16px 20px', borderRadius: '12px',
            background: score?.passed === false ? '#fef2f2' : '#dcfce7',
            border: `1px solid ${score?.passed === false ? '#fca5a5' : '#86efac'}`,
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <div style={{ fontSize: '2rem' }}>{score?.passed === false ? '📚' : '✅'}</div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '1rem', color: score?.passed === false ? '#b91c1c' : '#15803d' }}>
                Paper Submitted Successfully!
              </div>
              {score && (
                <div style={{ fontSize: '0.85rem', color: '#374151', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <span>📊 Score: <strong>{score.earned}/{score.total} marks</strong></span>
                  {score.percentage !== undefined && <span>📈 <strong>{score.percentage}%</strong></span>}
                  {score.passMark > 0 && <span>Pass mark: <strong>{score.passMark}</strong></span>}
                  <span style={{ fontWeight: '800', color: score.passed === false ? '#b91c1c' : '#15803d' }}>
                    {score.passed === false ? '❌ Not Passed' : '🎉 Passed!'}
                  </span>
                </div>
              )}
              {!score && (
                <div style={{ fontSize: '0.82rem', color: '#166534', marginTop: '2px' }}>
                  Your answers have been recorded. Results will be reviewed by your teacher.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        {activePaper.instructions && !submitted && (
          <div style={{
            margin: '12px 0', padding: '12px 16px', background: '#fef9c3',
            border: '1px solid #fde68a', borderRadius: '10px', fontSize: '0.85rem', color: '#374151'
          }}>
            <strong>📋 Instructions:</strong> {activePaper.instructions}
          </div>
        )}

        {/* Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          {(activePaper.questions || []).map((q, idx) => {
            const userAns = answers[idx] || '';
            const isAutoGraded = (q.type === 'MCQ' || q.type === 'True/False') && q.answer;
            const isCorrect = isAutoGraded && submitted && userAns.toLowerCase() === q.answer.toLowerCase();
            const isWrong = isAutoGraded && submitted && userAns && userAns.toLowerCase() !== q.answer.toLowerCase();

            return (
              <div key={idx} style={{
                background: '#fff', border: `1px solid ${submitted && isAutoGraded ? (isCorrect ? '#86efac' : isWrong ? '#fca5a5' : '#e2e8f0') : '#e2e8f0'}`,
                borderRadius: '12px', padding: '16px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{
                      minWidth: '28px', height: '28px', borderRadius: '50%', background: '#6366f1',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: '800', flexShrink: 0
                    }}>Q{q.number}</span>
                    <span style={{ fontSize: '0.92rem', fontWeight: '600', color: '#1e293b', lineHeight: '1.4' }}>{q.questionText}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #c7d2fe' }}>{q.type}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>{q.marks} mk</span>
                  </div>
                </div>

                {/* MCQ */}
                {q.type === 'MCQ' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '38px' }}>
                    {(q.options || []).map((opt, oi) => {
                      if (!opt) return null;
                      const letter = letterMap[oi];
                      const isSelected = userAns === letter;
                      const isRightAnswer = submitted && q.answer === letter;
                      const isWrongPick = submitted && isSelected && q.answer !== letter;
                      return (
                        <label key={oi} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 12px', borderRadius: '8px', cursor: submitted ? 'default' : 'pointer',
                          border: `1px solid ${isRightAnswer ? '#86efac' : isWrongPick ? '#fca5a5' : isSelected ? '#93c5fd' : '#e2e8f0'}`,
                          background: isRightAnswer ? '#dcfce7' : isWrongPick ? '#fee2e2' : isSelected ? '#dbeafe' : '#f8fafc',
                          transition: 'all 0.15s'
                        }}>
                          <input
                            type="radio"
                            name={`q-${idx}`}
                            value={letter}
                            checked={isSelected}
                            onChange={() => !submitted && setAnswers(prev => ({ ...prev, [idx]: letter }))}
                            disabled={submitted}
                            style={{ accentColor: '#6366f1' }}
                          />
                          <span style={{ fontWeight: '600', color: '#374151', minWidth: '20px' }}>{letter}.</span>
                          <span style={{ fontSize: '0.875rem', color: '#1e293b' }}>{opt}</span>
                          {isRightAnswer && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: '700', color: '#15803d' }}>✓ Correct</span>}
                          {isWrongPick && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: '700', color: '#b91c1c' }}>✗ Wrong</span>}
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* True/False */}
                {q.type === 'True/False' && (
                  <div style={{ display: 'flex', gap: '10px', paddingLeft: '38px' }}>
                    {['True', 'False'].map(opt => {
                      const isSelected = userAns === opt;
                      const isRightAnswer = submitted && q.answer === opt;
                      const isWrongPick = submitted && isSelected && q.answer !== opt;
                      return (
                        <label key={opt} style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '8px 16px', borderRadius: '8px', cursor: submitted ? 'default' : 'pointer',
                          border: `1px solid ${isRightAnswer ? '#86efac' : isWrongPick ? '#fca5a5' : isSelected ? '#93c5fd' : '#e2e8f0'}`,
                          background: isRightAnswer ? '#dcfce7' : isWrongPick ? '#fee2e2' : isSelected ? '#dbeafe' : '#f8fafc',
                          fontWeight: '600', fontSize: '0.875rem', color: '#1e293b'
                        }}>
                          <input type="radio" name={`q-${idx}`} value={opt} checked={isSelected}
                            onChange={() => !submitted && setAnswers(prev => ({ ...prev, [idx]: opt }))}
                            disabled={submitted} style={{ accentColor: '#6366f1' }} />
                          {opt}
                          {isRightAnswer && <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#15803d' }}>✓</span>}
                          {isWrongPick && <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#b91c1c' }}>✗</span>}
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Short Answer / Essay / Fill in Blank */}
                {(q.type === 'Short Answer' || q.type === 'Essay' || q.type === 'Fill in the Blank') && (
                  <div style={{ paddingLeft: '38px' }}>
                    <textarea
                      value={userAns}
                      onChange={e => !submitted && setAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                      disabled={submitted}
                      rows={q.type === 'Essay' ? 5 : 2}
                      placeholder={submitted ? '—' : 'Write your answer here...'}
                      style={{
                        width: '100%', padding: '10px 12px',
                        border: '1px solid #e2e8f0', borderRadius: '8px',
                        fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical',
                        outline: 'none', boxSizing: 'border-box',
                        background: submitted ? '#f8fafc' : '#fff',
                        color: '#1e293b'
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom submit */}
        {!submitted && (
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button
              onClick={handleSubmit}
              style={{
                background: '#6366f1', color: '#fff', border: 'none', borderRadius: '10px',
                padding: '12px 40px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
              }}
            >
              ✅ Submit Paper
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Papers list ────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border/60">
        <div>
          <h1 className="text-2xl font-bold text-brand-text tracking-tight flex items-center gap-2.5">
            <span>📄 Exam Papers</span>
            {examPapers.length > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-brand-navy text-white">
                {examPapers.length}
              </span>
            )}
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            Exam papers assigned to you based on your subject, grade, and class type.
          </p>
        </div>
      </div>

      {examPapers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-brand-border space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-brand-soft text-brand-muted flex items-center justify-center mx-auto text-3xl">
            📄
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-brand-text">No Exam Papers Available</h3>
            <p className="text-xs text-brand-muted mt-1.5 leading-relaxed">
              When your teacher publishes an exam paper for your grade and subject (
              <span className="font-semibold text-brand-navy">{studentUser?.grade || 'your grade'}</span>
              ), it will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {examPapers.map((paper, index) => {
            const sc = statusColor(paper);
            return (
              <div
                key={paper._id || index}
                className="bg-white rounded-[14px] border border-brand-border shadow-card hover:border-brand-focus/40 hover:shadow-card-hover transition-all overflow-hidden"
              >
                {/* Top strip */}
                <div className="bg-brand-navy text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-bannerChipBg text-brand-bannerChipText shadow-xs">
                        {paper.examType}
                      </span>
                      {paper.grade && (
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white shadow-xs">
                          {paper.grade}
                        </span>
                      )}
                      <span style={{ background: sc.bg, color: sc.color }}
                        className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                        {sc.label}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">{paper.title}</h2>
                    <p className="text-sm text-white/70">{paper.subject}</p>
                  </div>
                  <button
                    onClick={() => startAttempt(paper)}
                    style={{
                      background: '#ffffff', color: '#1e293b',
                      border: 'none', borderRadius: '10px',
                      padding: '10px 24px', fontWeight: '700', cursor: 'pointer',
                      fontSize: '0.875rem', whiteSpace: 'nowrap',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    🖊 Attempt Paper
                  </button>
                </div>

                {/* Details */}
                <div className="p-5 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">Date</p>
                    <p className="text-sm font-semibold text-brand-text">{formatDate(paper.date)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">Duration</p>
                    <p className="text-sm font-semibold text-brand-text">{paper.duration} minutes</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">Total Marks</p>
                    <p className="text-sm font-semibold text-brand-text">{paper.totalMarks} marks</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">Pass Mark</p>
                    <p className="text-sm font-semibold text-brand-text">{paper.passMark || '—'}</p>
                  </div>
                  {paper.teacherName && (
                    <div className="space-y-1 col-span-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">Teacher</p>
                      <p className="text-sm font-semibold text-brand-text">{paper.teacherName}</p>
                    </div>
                  )}
                  {paper.instructions && (
                    <div className="space-y-1 col-span-full">
                      <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">Instructions</p>
                      <p className="text-xs text-brand-muted leading-relaxed">{paper.instructions}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
