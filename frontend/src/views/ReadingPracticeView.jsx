import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { triggerCelebration } from '../utils/speech';
import {
  BookOpen,
  Clock,
  Award,
  CheckCircle,
  XCircle,
  FileText,
  Sparkles,
  ArrowRight,
  BookMarked
} from 'lucide-react';

export default function ReadingPracticeView() {
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
      const res = await apiRequest('/reading/lessons');
      setLessons(res.lessons || []);
      if (res.lessons?.length > 0) {
        selectLesson(res.lessons[0].id);
      }
    } catch (err) {
      console.error('Failed to load reading lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectLesson = async (id) => {
    setUserAnswers({});
    setQuizResult(null);
    try {
      const res = await apiRequest(`/reading/lessons/${id}`);
      setActiveLesson(res.lesson);
    } catch (err) {
      console.error('Failed to load reading passage:', err);
    }
  };

  const handleAnswerSelect = (qId, option) => {
    setUserAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await apiRequest('/reading/submit', 'POST', {
        lessonId: activeLesson.id,
        userAnswers
      });
      setQuizResult(res);
      triggerCelebration('medium');
    } catch (err) {
      alert('Failed to submit reading comprehension: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reading-view-container">
      <div className="view-title-block">
        <div className="title-icon-badge">
          <BookOpen size={24} className="text-indigo" />
        </div>
        <div>
          <h2>Reading Practice & Text Comprehension</h2>
          <p className="view-subtitle">
            Expand reading fluency, inferential understanding, and contextual vocabulary across engaging non-fiction and narrative passages.
          </p>
        </div>
      </div>

      <div className="reading-grid">
        {/* Left Side: Passages List */}
        <div className="reading-sidebar-pane">
          <div className="glass-panel pane-card">
            <h3 className="pane-title">Reading Passages</h3>
            <div className="passages-v-list">
              {lessons.map((l) => {
                const isSelected = activeLesson?.id === l.id;
                return (
                  <div
                    key={l.id}
                    className={`passage-card-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => selectLesson(l.id)}
                  >
                    <div className="passage-top-meta">
                      <span className="badge-pill badge-indigo">{l.level}</span>
                      <span className="passage-words"><FileText size={12} /> {l.word_count} words</span>
                    </div>
                    <h4 className="passage-title">{l.title}</h4>
                    <span className="passage-cat">{l.topic_category}</span>
                    {l.is_completed ? (
                      <span className="lesson-done-badge text-emerald mt-1">
                        <CheckCircle size={13} /> Completed ({l.user_score}%)
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Passage Reader & Comprehension */}
        <div className="reading-main-pane">
          {activeLesson && (
            <div className="glass-panel pane-card passage-reader-card">
              <div className="passage-header-box">
                <div className="passage-badge-row">
                  <span className="badge-pill badge-indigo">{activeLesson.topic_category}</span>
                  <span className="badge-pill badge-emerald">CEFR {activeLesson.level}</span>
                  <span className="word-count-note">~{Math.ceil(activeLesson.word_count / 200)} min read ({activeLesson.word_count} words)</span>
                </div>
                <h3 className="passage-main-title">{activeLesson.title}</h3>
              </div>

              {/* Passage Content Typography */}
              <div className="passage-text-article">
                {activeLesson.passage_text?.split('\n\n').map((paragraph, pIdx) => (
                  <p key={pIdx} className="passage-paragraph">{paragraph}</p>
                ))}
              </div>

              {/* Comprehension Quiz */}
              <div className="comprehension-container">
                <div className="comp-header">
                  <BookMarked size={18} className="text-indigo" />
                  <h4>Passage Comprehension Questions</h4>
                </div>

                <div className="questions-stream">
                  {activeLesson.questions?.map((q, qIndex) => {
                    const review = quizResult?.review?.find(r => r.id === q.id);
                    return (
                      <div key={q.id} className="quiz-question-block">
                        <h5 className="q-title">
                          <span className="q-number">{qIndex + 1}.</span> {q.question_text}
                        </h5>

                        <div className="q-options-grid">
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
                                className={`quiz-opt-btn ${statusClass}`}
                                onClick={() => !quizResult && handleAnswerSelect(q.id, opt)}
                                disabled={Boolean(quizResult)}
                              >
                                <span className="opt-marker">{String.fromCharCode(65 + optIndex)}</span>
                                <span className="opt-text">{opt}</span>
                              </button>
                            );
                          })}
                        </div>

                        {review && (
                          <div className={`explanation-box ${review.isCorrect ? 'exp-correct' : 'exp-wrong'}`}>
                            <div className="exp-status-row">
                              {review.isCorrect ? (
                                <CheckCircle size={15} className="text-emerald" />
                              ) : (
                                <XCircle size={15} className="text-rose" />
                              )}
                              <strong>{review.isCorrect ? 'Correct!' : 'Incorrect.'}</strong>
                            </div>
                            <p className="exp-text">{review.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Result Banner */}
                {quizResult && (
                  <div className="quiz-result-banner">
                    <div className="res-banner-left">
                      <Award size={24} className="text-amber" />
                      <div>
                        <h4>Score: {quizResult.scorePercentage}%</h4>
                        <span>{quizResult.correctCount} of {quizResult.totalQuestions} questions correct</span>
                      </div>
                    </div>
                    <span className="badge-pill badge-emerald">+{quizResult.xpEarned} XP Earned</span>
                  </div>
                )}

                {/* Submit Action */}
                {!quizResult && (
                  <div className="quiz-action-bar">
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleSubmit}
                      disabled={submitting || Object.keys(userAnswers).length === 0}
                    >
                      {submitting ? 'Grading Answers...' : 'Submit Answers (+50 XP)'}
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
        .reading-view-container {
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
        .reading-grid {
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
        .passages-v-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .passage-card-item {
          padding: 1rem;
          background: var(--bg-secondary);
          border: 1.5px solid var(--border-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .passage-card-item:hover {
          border-color: var(--brand-primary);
        }
        .passage-card-item.selected {
          border-color: var(--brand-primary);
          background: rgba(99, 102, 241, 0.08);
          box-shadow: 0 0 0 1px var(--brand-primary);
        }
        .passage-top-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.35rem;
        }
        .passage-words {
          font-size: 0.75rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .passage-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.25rem;
        }
        .passage-cat {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .passage-reader-card {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .passage-header-box {
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1rem;
        }
        .passage-badge-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }
        .word-count-note {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .passage-main-title {
          font-size: 1.5rem;
          font-weight: 800;
        }
        .passage-text-article {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1.5rem 1.75rem;
          font-size: 1.05rem;
          line-height: 1.75;
          color: var(--text-main);
        }
        .passage-paragraph {
          margin-bottom: 1rem;
        }
        .passage-paragraph:last-child {
          margin-bottom: 0;
        }
        .comprehension-container {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .comp-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.15rem;
          font-weight: 700;
        }
        .questions-stream {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .quiz-question-block {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1.25rem;
        }
        .q-title {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          line-height: 1.4;
        }
        .q-number {
          color: var(--brand-primary);
          font-weight: 700;
        }
        .q-options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .quiz-opt-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: var(--bg-card);
          border: 1.5px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-main);
          font-size: 0.88rem;
          text-align: left;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .quiz-opt-btn:hover:not(:disabled) {
          border-color: var(--brand-primary);
        }
        .opt-selected {
          border-color: var(--brand-primary);
          background: rgba(99, 102, 241, 0.12);
        }
        .opt-correct {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.15);
        }
        .opt-wrong {
          border-color: #f43f5e;
          background: rgba(244, 63, 94, 0.15);
        }
        .opt-marker {
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
        .explanation-box {
          margin-top: 0.85rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
        }
        .exp-correct {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .exp-wrong {
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
          .reading-grid {
            grid-template-columns: 1fr;
          }
          .q-options-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
