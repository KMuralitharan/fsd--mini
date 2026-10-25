import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { speakText, stopSpeaking, triggerCelebration } from '../utils/speech';
import {
  Headphones,
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Award,
  Volume2,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function ListeningPracticeView() {
  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLessons();
    return () => stopSpeaking();
  }, []);

  const loadLessons = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/listening/lessons');
      setLessons(res.lessons || []);
      if (res.lessons?.length > 0) {
        selectLesson(res.lessons[0].id);
      }
    } catch (err) {
      console.error('Failed to load listening lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectLesson = async (id) => {
    stopSpeaking();
    setIsPlaying(false);
    setShowTranscript(false);
    setUserAnswers({});
    setQuizResult(null);

    try {
      const res = await apiRequest(`/listening/lessons/${id}`);
      setActiveLesson(res.lesson);
    } catch (err) {
      console.error('Failed to fetch lesson detail:', err);
    }
  };

  const handlePlayAudio = () => {
    if (!activeLesson?.audio_script) return;

    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speakText(activeLesson.audio_script, playbackSpeed, () => {
        setIsPlaying(false);
      });
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (isPlaying && activeLesson?.audio_script) {
      stopSpeaking();
      speakText(activeLesson.audio_script, speed, () => setIsPlaying(false));
    }
  };

  const handleAnswerSelect = (qId, option) => {
    setUserAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    try {
      const res = await apiRequest('/listening/submit', 'POST', {
        lessonId: activeLesson.id,
        userAnswers
      });
      setQuizResult(res);
      triggerCelebration('medium');
    } catch (err) {
      alert('Failed to submit answers: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="listening-view-container">
      <div className="view-title-block">
        <div className="title-icon-badge">
          <Headphones size={24} className="text-indigo" />
        </div>
        <div>
          <h2>Listening Practice & Dialogue Comprehension</h2>
          <p className="view-subtitle">
            Train your ear with native-paced dialogues, variable playback speeds, and comprehension quizzes.
          </p>
        </div>
      </div>

      <div className="listening-grid">
        {/* Left Side: Lessons List */}
        <div className="listening-sidebar-pane">
          <div className="glass-panel pane-card">
            <h3 className="pane-title">Listening Audio Tracks</h3>
            <div className="lessons-v-list">
              {lessons.map((l) => {
                const isSelected = activeLesson?.id === l.id;
                return (
                  <div
                    key={l.id}
                    className={`lesson-card-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => selectLesson(l.id)}
                  >
                    <div className="lesson-top-meta">
                      <span className="badge-pill badge-indigo">{l.level}</span>
                      <span className="lesson-time"><Clock size={12} /> {l.duration_seconds}s</span>
                    </div>
                    <h4 className="lesson-title">{l.title}</h4>
                    {l.is_completed ? (
                      <span className="lesson-done-badge text-emerald">
                        <CheckCircle size={13} /> Completed ({l.user_score}%)
                      </span>
                    ) : (
                      <span className="text-muted text-xs">Unattempted</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Audio Player & Quiz */}
        <div className="listening-main-pane">
          {activeLesson && (
            <div className="glass-panel pane-card main-player-card">
              {/* Audio Player Box */}
              <div className="audio-player-box">
                <div className="player-meta-row">
                  <span className="badge-pill badge-indigo">{activeLesson.level} Dialogue</span>
                  <span className="speakers-list">
                    Speakers: {activeLesson.speaker_roles?.join(' & ') || 'Dialogue'}
                  </span>
                </div>

                <h3 className="lesson-active-title">{activeLesson.title}</h3>

                {/* Player Controls */}
                <div className="player-controls-strip">
                  <button className="play-pause-circle-btn" onClick={handlePlayAudio}>
                    {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                  </button>

                  <div className="player-waveform-center">
                    {isPlaying ? (
                      <div className="audio-wave">
                        <span></span><span></span><span></span><span></span><span></span>
                      </div>
                    ) : (
                      <span className="text-muted text-sm">Ready to play conversation</span>
                    )}
                  </div>

                  {/* Speed Selector */}
                  <div className="speed-buttons-group">
                    {[0.75, 1.0, 1.25].map((speed) => (
                      <button
                        key={speed}
                        className={`speed-pill ${playbackSpeed === speed ? 'active' : ''}`}
                        onClick={() => handleSpeedChange(speed)}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>

                  {/* Transcript Toggle */}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowTranscript(!showTranscript)}
                  >
                    {showTranscript ? <EyeOff size={15} /> : <Eye size={15} />}
                    {showTranscript ? 'Hide Text' : 'View Script'}
                  </button>
                </div>

                {/* Transcript Reveal Box */}
                {showTranscript && (
                  <div className="transcript-reveal-card">
                    <span className="transcript-box-label">Conversation Script:</span>
                    <pre className="transcript-pre-text">{activeLesson.audio_script}</pre>
                  </div>
                )}
              </div>

              {/* Comprehension Quiz */}
              <div className="comprehension-section">
                <div className="comp-header">
                  <h4 className="comp-title">Comprehension Questions</h4>
                  <span className="text-muted text-sm">Answer based on the dialogue you heard</span>
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

                {/* Score Summary Banner if submitted */}
                {quizResult && (
                  <div className="quiz-result-banner">
                    <div className="res-banner-left">
                      <Award size={24} className="text-amber" />
                      <div>
                        <h4>Score: {quizResult.scorePercentage}%</h4>
                        <span>{quizResult.correctCount} of {quizResult.totalQuestions} questions correct</span>
                      </div>
                    </div>
                    <span className="badge-pill badge-emerald">+{quizResult.xpEarned} XP Awarded</span>
                  </div>
                )}

                {/* Submit Button */}
                {!quizResult && (
                  <div className="quiz-action-bar">
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleSubmitQuiz}
                      disabled={submitting || Object.keys(userAnswers).length === 0}
                    >
                      {submitting ? 'Grading...' : 'Submit Answers (+50 XP)'}
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
        .listening-view-container {
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
        .listening-grid {
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
        .lessons-v-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .lesson-card-item {
          padding: 1rem;
          background: var(--bg-secondary);
          border: 1.5px solid var(--border-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .lesson-card-item:hover {
          border-color: var(--brand-primary);
        }
        .lesson-card-item.selected {
          border-color: var(--brand-primary);
          background: rgba(99, 102, 241, 0.08);
          box-shadow: 0 0 0 1px var(--brand-primary);
        }
        .lesson-top-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.35rem;
        }
        .lesson-time {
          font-size: 0.75rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .lesson-title {
          font-size: 0.95rem;
          font-weight: 700;
          margin-bottom: 0.35rem;
          color: var(--text-main);
        }
        .lesson-done-badge {
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-weight: 600;
        }
        .main-player-card {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .audio-player-box {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
        }
        .player-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .speakers-list {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .lesson-active-title {
          font-size: 1.35rem;
          font-weight: 800;
          margin-bottom: 1.25rem;
        }
        .player-controls-strip {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-wrap: wrap;
        }
        .play-pause-circle-btn {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: var(--brand-gradient);
          color: #fff;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 14px var(--brand-glow);
          transition: transform var(--transition-fast);
        }
        .play-pause-circle-btn:hover {
          transform: scale(1.05);
        }
        .ml-1 { margin-left: 3px; }
        .player-waveform-center {
          flex: 1;
          display: flex;
          align-items: center;
        }
        .speed-buttons-group {
          display: flex;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 3px;
        }
        .speed-pill {
          padding: 0.3rem 0.65rem;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.78rem;
          font-weight: 700;
          border-radius: var(--radius-sm);
          cursor: pointer;
        }
        .speed-pill.active {
          background: var(--brand-primary);
          color: #fff;
        }
        .transcript-reveal-card {
          margin-top: 1.25rem;
          padding: 1rem;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }
        .transcript-box-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          display: block;
          margin-bottom: 0.5rem;
        }
        .transcript-pre-text {
          font-family: inherit;
          font-size: 0.9rem;
          color: var(--text-secondary);
          white-space: pre-wrap;
          line-height: 1.5;
        }
        .comprehension-section {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .comp-header {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .comp-title {
          font-size: 1.15rem;
          font-weight: 700;
        }
        .questions-stream {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
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
          .listening-grid {
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
