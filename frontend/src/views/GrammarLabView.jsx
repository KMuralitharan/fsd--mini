import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { triggerCelebration } from '../utils/speech';
import {
  Layers,
  BookOpen,
  Award,
  CheckCircle,
  XCircle,
  Sparkles,
  ArrowRight,
  Info,
  Check
} from 'lucide-react';

export default function GrammarLabView() {
  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/grammar/lessons');
      setLessons(res.lessons || []);
      if (res.lessons?.length > 0) {
        selectLesson(res.lessons[0].id);
      }
    } catch (err) {
      console.error('Failed to load grammar lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectLesson = async (id) => {
    setUserAnswers({});
    setQuizResult(null);
    try {
      const res = await apiRequest(`/grammar/lessons/${id}`);
      setActiveLesson(res.lesson);
    } catch (err) {
      console.error('Failed to load grammar lesson:', err);
    }
  };

  const handleSelectOption = (qId, option) => {
    setUserAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    try {
      const res = await apiRequest('/grammar/submit', 'POST', {
        lessonId: activeLesson.id,
        userAnswers
      });
      setQuizResult(res);
      triggerCelebration(res.passed ? 'high' : 'medium');
    } catch (err) {
      alert('Failed to submit grammar quiz: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grammar-view-container">
      <div className="view-title-block">
        <div className="title-icon-badge">
          <Layers size={24} className="text-indigo" />
        </div>
        <div>
          <h2>Grammar Lab & Structural Mastery</h2>
          <p className="view-subtitle">
            Solidify syntax, tenses, conditionals, and active voice with structural formulas, real-world examples, and diagnostic quizzes.
          </p>
        </div>
      </div>

      <div className="grammar-layout-grid">
        {/* Left Side: Lessons Curriculum */}
        <div className="grammar-sidebar-pane">
          <div className="glass-panel pane-card">
            <h3 className="pane-title">Curriculum Modules</h3>
            <div className="lessons-curriculum-list">
              {lessons.map((l) => {
                const isSelected = activeLesson?.id === l.id;
                return (
                  <div
                    key={l.id}
                    className={`grammar-curriculum-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => selectLesson(l.id)}
                  >
                    <div className="item-top-meta">
                      <span className="badge-pill badge-indigo">{l.topic}</span>
                      <span className="badge-pill badge-secondary">{l.level}</span>
                    </div>
                    <h4 className="item-title">{l.title}</h4>
                    {l.is_completed ? (
                      <span className="completed-tag text-emerald">
                        <CheckCircle size={13} /> Completed ({l.user_score}%)
                      </span>
                    ) : (
                      <span className="uncompleted-tag text-muted">Ready to study</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Lesson Details & Interactive Quiz */}
        <div className="grammar-main-pane">
          {activeLesson && (
            <div className="glass-panel pane-card main-grammar-card">
              {/* Lesson Concept Banner */}
              <div className="lesson-overview-block">
                <div className="lesson-badge-row">
                  <span className="badge-pill badge-indigo">{activeLesson.topic}</span>
                  <span className="badge-pill badge-emerald">CEFR {activeLesson.level}</span>
                </div>
                <h3 className="lesson-main-title">{activeLesson.title}</h3>

                {/* Explanation */}
                <div className="explanation-paragraph-card">
                  <span className="rule-badge-label">Grammar Rule & Core Principle:</span>
                  <p className="rule-text">{activeLesson.rule_explanation}</p>
                </div>

                {/* Formula */}
                {activeLesson.formula && (
                  <div className="formula-box">
                    <span className="formula-label">Structural Pattern / Formula:</span>
                    <code className="formula-code">{activeLesson.formula}</code>
                  </div>
                )}

                {/* Real-World Examples */}
                {activeLesson.examples && activeLesson.examples.length > 0 && (
                  <div className="examples-section">
                    <span className="examples-header-label">Illustrated Examples:</span>
                    <div className="examples-list">
                      {activeLesson.examples.map((ex, i) => (
                        <div key={i} className="example-item-box">
                          <p className="example-en font-semibold text-main">"{ex.en}"</p>
                          {ex.note && <p className="example-note text-sm text-secondary">💡 {ex.note}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Practice Quiz */}
              <div className="grammar-quiz-section">
                <div className="quiz-header">
                  <h4 className="quiz-sec-title">Interactive Application Quiz</h4>
                  <span className="text-muted text-sm">Select the accurate sentence or verb form</span>
                </div>

                <div className="grammar-questions-stream">
                  {activeLesson.questions?.map((q, qIndex) => {
                    const review = quizResult?.review?.find(r => r.id === q.id);
                    return (
                      <div key={q.id} className="grammar-q-card">
                        <h5 className="g-q-title">
                          <span className="text-indigo font-bold">{qIndex + 1}.</span> {q.question}
                        </h5>

                        <div className="g-options-grid">
                          {q.options?.map((opt, optIndex) => {
                            const isChosen = userAnswers[q.id] === opt;
                            let statusClass = '';

                            if (quizResult) {
                              if (opt === q.correct_answer) statusClass = 'opt-correct';
                              else if (isChosen && opt !== q.correct_answer) statusClass = 'opt-wrong';
                            } else if (isChosen) {
                              statusClass = 'opt-selected';
                            }

                            return (
                              <button
                                key={optIndex}
                                className={`g-opt-btn ${statusClass}`}
                                onClick={() => !quizResult && handleSelectOption(q.id, opt)}
                                disabled={Boolean(quizResult)}
                              >
                                <span className="opt-letter">{String.fromCharCode(65 + optIndex)}</span>
                                <span>{opt}</span>
                              </button>
                            );
                          })}
                        </div>

                        {review && (
                          <div className={`explanation-card ${review.isCorrect ? 'exp-pass' : 'exp-fail'}`}>
                            <div className="exp-status-row">
                              {review.isCorrect ? (
                                <CheckCircle size={15} className="text-emerald" />
                              ) : (
                                <XCircle size={15} className="text-rose" />
                              )}
                              <strong>{review.isCorrect ? 'Correct application!' : 'Grammar error detected.'}</strong>
                            </div>
                            <p className="exp-reason-text">{review.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Quiz Result Banner */}
                {quizResult && (
                  <div className="quiz-result-banner">
                    <div className="res-banner-left">
                      <Award size={24} className="text-amber" />
                      <div>
                        <h4>Mastery Score: {quizResult.scorePercentage}%</h4>
                        <span>{quizResult.correctCount} of {quizResult.totalQuestions} questions correct</span>
                      </div>
                    </div>
                    <span className="badge-pill badge-emerald">+{quizResult.xpEarned} XP Earned</span>
                  </div>
                )}

                {/* Submit Quiz */}
                {!quizResult && (
                  <div className="quiz-action-bar">
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleSubmitQuiz}
                      disabled={submitting || Object.keys(userAnswers).length === 0}
                    >
                      {submitting ? 'Validating Answers...' : 'Submit Grammar Quiz (+60 XP)'}
                      <ArrowRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .grammar-view-container {
          padding: 1.75rem 2rem;
          max-width: 1350px;
          margin: 0 auto;
        }
        .view-title-block {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.75rem;
        }
        .title-icon-badge {
          width: 46px;
          height: 46px;
          border-radius: var(--radius-md);
          background: rgba(99, 102, 241, 0.12);
          border: 1px solid rgba(99, 102, 241, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .view-subtitle {
          font-size: 0.9rem;
          color: var(--text-muted);
        }
        .grammar-layout-grid {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 1.5rem;
        }
        .pane-card {
          padding: 1.5rem;
        }
        .pane-title {
          font-size: 1.1rem;
          margin-bottom: 1rem;
        }
        .lessons-curriculum-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .grammar-curriculum-item {
          padding: 1rem;
          background: var(--bg-secondary);
          border: 1.5px solid var(--border-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .grammar-curriculum-item:hover {
          border-color: var(--brand-primary);
        }
        .grammar-curriculum-item.selected {
          border-color: var(--brand-primary);
          background: rgba(99, 102, 241, 0.08);
          box-shadow: 0 0 0 1px var(--brand-primary);
        }
        .item-top-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.35rem;
        }
        .item-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.25rem;
        }
        .completed-tag {
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-weight: 600;
        }
        .uncompleted-tag {
          font-size: 0.75rem;
        }
        .main-grammar-card {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .lesson-overview-block {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
        }
        .lesson-badge-row {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .lesson-main-title {
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 1.25rem;
        }
        .explanation-paragraph-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1rem 1.25rem;
          margin-bottom: 1rem;
        }
        .rule-badge-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--brand-primary);
          text-transform: uppercase;
          display: block;
          margin-bottom: 0.35rem;
        }
        .rule-text {
          font-size: 0.98rem;
          line-height: 1.55;
          color: var(--text-main);
        }
        .formula-box {
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.25);
          border-radius: var(--radius-md);
          padding: 0.85rem 1.25rem;
          margin-bottom: 1rem;
        }
        .formula-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          display: block;
          margin-bottom: 0.25rem;
        }
        .formula-code {
          font-family: monospace;
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--brand-primary);
        }
        .examples-section {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1rem 1.25rem;
        }
        .examples-header-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          display: block;
          margin-bottom: 0.65rem;
        }
        .examples-list {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .example-item-box {
          padding: 0.5rem 0.75rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-sm);
        }
        .grammar-quiz-section {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .quiz-sec-title {
          font-size: 1.15rem;
          font-weight: 700;
        }
        .grammar-questions-stream {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .grammar-q-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1.25rem;
        }
        .g-q-title {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          line-height: 1.4;
        }
        .g-options-grid {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .g-opt-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: var(--bg-card);
          border: 1.5px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-main);
          font-size: 0.9rem;
          text-align: left;
          cursor: pointer;
        }
        .g-opt-btn.opt-selected { border-color: var(--brand-primary); background: rgba(99, 102, 241, 0.12); }
        .g-opt-btn.opt-correct { border-color: #10b981; background: rgba(16, 185, 129, 0.15); }
        .g-opt-btn.opt-wrong { border-color: #f43f5e; background: rgba(244, 63, 94, 0.15); }
        .opt-letter {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          background: var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .explanation-card {
          margin-top: 0.85rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
        }
        .exp-pass {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .exp-fail {
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.3);
        }
        .exp-status-row {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          margin-bottom: 0.25rem;
        }
        .quiz-result-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }
        .res-banner-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        @media (max-width: 900px) {
          .grammar-layout-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
