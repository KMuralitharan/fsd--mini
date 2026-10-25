import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { triggerCelebration } from '../utils/speech';
import { X, CheckCircle, AlertCircle, Award, Sparkles, ArrowRight } from 'lucide-react';

export default function PlacementModal({ isOpen, onClose }) {
  const { user, refreshUser } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadQuestions();
      setResult(null);
      setCurrentIndex(0);
      setSelectedAnswers({});
    }
  }, [isOpen]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/auth/placement-test/questions');
      setQuestions(res.questions || []);
    } catch (err) {
      console.error('Failed to load placement test:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, option) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleSubmitTest();
    }
  };

  const handleSubmitTest = async () => {
    setSubmitting(true);
    try {
      const answersPayload = questions.map(q => ({
        questionId: q.id,
        selectedAnswer: selectedAnswers[q.id] || '',
        correctAnswer: q.correctAnswer,
        level: q.level
      }));

      const res = await apiRequest('/auth/placement-test/submit', 'POST', {
        answers: answersPayload
      });

      setResult(res.result);
      triggerCelebration('high');
      await refreshUser();
    } catch (err) {
      alert('Failed to submit test: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  return (
    <div className="modal-backdrop">
      <div className="modal-card placement-modal">
        <div className="modal-header">
          <div className="modal-title-group">
            <Award size={22} className="text-indigo" />
            <h3>CEFR English Placement Assessment</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="modal-body text-center py-8">
            <div className="spinner"></div>
            <p className="mt-4 text-muted">Loading standardized proficiency questions...</p>
          </div>
        ) : result ? (
          <div className="modal-body result-body">
            <div className="level-assigned-badge-circle">
              <span className="cefr-letter">{result.assignedLevel}</span>
            </div>
            <h2 className="result-level-title">{result.levelTitle}</h2>
            <p className="result-desc">{result.description}</p>

            <div className="result-stats-row">
              <div className="res-stat-card">
                <span className="res-stat-val">{result.scorePercentage}%</span>
                <span className="res-stat-lbl">Accuracy</span>
              </div>
              <div className="res-stat-card">
                <span className="res-stat-val">{result.correctAnswers}/{result.totalQuestions}</span>
                <span className="res-stat-lbl">Correct Answers</span>
              </div>
              <div className="res-stat-card">
                <span className="res-stat-val text-amber">+150 XP</span>
                <span className="res-stat-lbl">Bonus Reward</span>
              </div>
            </div>

            <p className="result-footer-note">
              🎉 Your personalized learning curriculum, daily targets, and AI scenarios are now automatically tuned to level {result.assignedLevel}.
            </p>

            <button className="btn btn-primary btn-lg w-full mt-4" onClick={onClose}>
              Continue to Dashboard
            </button>
          </div>
        ) : (
          <div className="modal-body">
            {/* Progress bar */}
            <div className="test-progress-bar-wrap">
              <div className="test-progress-labels">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span className="badge-pill badge-indigo">{currentQ?.category} ({currentQ?.level})</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>

            {/* Question prompt */}
            <div className="question-content">
              <h4 className="question-text">{currentQ?.question}</h4>

              <div className="options-list">
                {currentQ?.options?.map((opt, i) => {
                  const isSelected = selectedAnswers[currentQ.id] === opt;
                  return (
                    <button
                      key={i}
                      className={`option-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectOption(currentQ.id, opt)}
                    >
                      <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
                      <span className="opt-text">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="modal-footer">
              <span className="text-muted text-sm">
                Answer honestly to ensure accurate content calibration.
              </span>
              <button
                className="btn btn-primary"
                onClick={handleNext}
                disabled={!selectedAnswers[currentQ?.id] || submitting}
              >
                {submitting ? 'Evaluating...' : currentIndex === questions.length - 1 ? 'Complete & Grade Test' : 'Next Question'}
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 1rem;
        }
        .placement-modal {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 620px;
          box-shadow: var(--shadow-xl);
          overflow: hidden;
          animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modalPop {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }
        .modal-title-group {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }
        .modal-title-group h3 {
          font-size: 1.15rem;
        }
        .modal-body {
          padding: 1.5rem;
        }
        .test-progress-bar-wrap {
          margin-bottom: 1.5rem;
        }
        .test-progress-labels {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
        }
        .progress-track {
          height: 6px;
          background: var(--bg-secondary);
          border-radius: 999px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: var(--brand-gradient);
          transition: width 0.3s ease;
        }
        .question-text {
          font-size: 1.1rem;
          line-height: 1.45;
          margin-bottom: 1.25rem;
          color: var(--text-main);
        }
        .options-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .option-btn {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.85rem 1rem;
          background: var(--bg-secondary);
          border: 1.5px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-main);
          font-size: 0.95rem;
          text-align: left;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .option-btn:hover {
          border-color: var(--brand-primary);
          background: rgba(99, 102, 241, 0.05);
        }
        .option-btn.selected {
          border-color: var(--brand-primary);
          background: rgba(99, 102, 241, 0.15);
          box-shadow: 0 0 0 1px var(--brand-primary);
        }
        .opt-letter {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.85rem;
        }
        .option-btn.selected .opt-letter {
          background: var(--brand-primary);
          color: #fff;
          border-color: var(--brand-primary);
        }
        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }
        .result-body {
          text-align: center;
          padding: 2.5rem 1.5rem;
        }
        .level-assigned-badge-circle {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: var(--brand-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.25rem;
          box-shadow: var(--shadow-glow);
        }
        .cefr-letter {
          font-family: var(--font-heading);
          font-size: 2.75rem;
          font-weight: 800;
          color: #fff;
        }
        .result-level-title {
          font-size: 1.6rem;
          margin-bottom: 0.5rem;
        }
        .result-desc {
          color: var(--text-secondary);
          font-size: 0.95rem;
          max-width: 440px;
          margin: 0 auto 1.5rem;
        }
        .result-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.85rem;
          margin-bottom: 1.5rem;
        }
        .res-stat-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.85rem 0.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .res-stat-val {
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .res-stat-lbl {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .result-footer-note {
          font-size: 0.85rem;
          color: var(--text-secondary);
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: var(--radius-md);
          padding: 0.75rem 1rem;
          margin-bottom: 1rem;
        }
        .spinner {
          width: 36px;
          height: 36px;
          border: 3px solid var(--border-color);
          border-top-color: var(--brand-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
