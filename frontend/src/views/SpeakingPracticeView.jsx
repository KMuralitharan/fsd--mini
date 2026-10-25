import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../utils/api';
import { createSpeechRecognizer, speakText, stopSpeaking, triggerCelebration } from '../utils/speech';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  TrendingUp,
  Award,
  ChevronRight,
  Info
} from 'lucide-react';

export default function SpeakingPracticeView() {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);

  const recognizerRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    loadTopics();
    return () => {
      stopSpeaking();
      if (recognizerRef.current) recognizerRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadTopics = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/speaking/topics');
      setTopics(res.topics || []);
      if (res.topics?.length > 0) {
        setSelectedTopic(res.topics[0]);
      }
    } catch (err) {
      console.error('Failed to load speaking topics:', err);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = () => {
    setTranscript('');
    setInterimText('');
    setEvaluation(null);
    setTimerSeconds(0);
    setIsRecording(true);

    // Initialize Web Speech Recognizer
    recognizerRef.current = createSpeechRecognizer({
      onResult: (final, interim) => {
        if (final) {
          setTranscript(prev => (prev ? prev + ' ' + final : final).trim());
        }
        setInterimText(interim);
      },
      onError: (err) => {
        console.warn('Speech error:', err);
      },
      onEnd: () => {
        // Recognition completed or paused
      }
    });

    recognizerRef.current.start();

    // Start timer counter
    timerRef.current = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognizerRef.current) recognizerRef.current.stop();
  };

  const handleAnalyze = async () => {
    const fullText = (transcript + ' ' + interimText).trim();
    if (!fullText) {
      alert('Please speak or type your response before analyzing.');
      return;
    }

    setAnalyzing(true);
    try {
      const res = await apiRequest('/speaking/analyze', 'POST', {
        topicId: selectedTopic?.id || 1,
        transcript: fullText,
        durationSeconds: Math.max(timerSeconds, 15)
      });
      setEvaluation(res.analysis);
      triggerCelebration('high');
    } catch (err) {
      alert('Evaluation failed: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSampleListen = () => {
    if (selectedTopic?.sample_answer) {
      speakText(selectedTopic.sample_answer);
    }
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="speaking-view-container">
      {/* View Header */}
      <div className="view-title-block">
        <div className="title-icon-badge">
          <Mic size={24} className="text-indigo" />
        </div>
        <div>
          <h2>Speaking Practice & Voice AI Lab</h2>
          <p className="view-subtitle">
            Record spontaneous speech to analyze pacing (WPM), filler words, pronunciation, and grammatical structure.
          </p>
        </div>
      </div>

      <div className="speaking-layout-grid">
        {/* Left Side: Topic Picker */}
        <div className="speaking-left-pane">
          <div className="glass-panel pane-card">
            <h3 className="pane-title">Choose Topic</h3>
            <div className="topics-vertical-list">
              {topics.map((t) => {
                const isSelected = selectedTopic?.id === t.id;
                return (
                  <div
                    key={t.id}
                    className={`topic-select-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedTopic(t);
                      setEvaluation(null);
                      setTranscript('');
                      setTimerSeconds(0);
                    }}
                  >
                    <div className="topic-card-top">
                      <span className="badge-pill badge-indigo">{t.level}</span>
                      <span className="topic-duration">{t.duration_seconds}s</span>
                    </div>
                    <h4 className="topic-name">{t.title}</h4>
                    <span className="topic-category-label">{t.category}</span>
                    {t.best_score > 0 && (
                      <div className="topic-best-score">
                        Best: <strong>{t.best_score}/100</strong>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Recording Studio & Analysis */}
        <div className="speaking-right-pane">
          {selectedTopic && (
            <div className="glass-panel pane-card studio-card">
              {/* Topic Prompt Card */}
              <div className="prompt-display-box">
                <div className="prompt-header">
                  <span className="badge-pill badge-indigo">{selectedTopic.category} • {selectedTopic.level}</span>
                  <button className="btn btn-secondary btn-sm" onClick={handleSampleListen}>
                    <Volume2 size={15} /> Listen to Native Model
                  </button>
                </div>
                <h3 className="active-prompt-text">{selectedTopic.prompt}</h3>

                {selectedTopic.hints && selectedTopic.hints.length > 0 && (
                  <div className="hints-row">
                    <span className="hints-label"><Info size={14} /> Guided Tips:</span>
                    <ul className="hints-list">
                      {selectedTopic.hints.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Live Audio Recording Controls */}
              <div className="recording-controls-zone">
                <div className="timer-badge">
                  <Clock size={16} />
                  <span>{formatTimer(timerSeconds)}</span>
                </div>

                <div className="mic-action-wrap">
                  {!isRecording ? (
                    <button className="record-btn-circle" onClick={startRecording}>
                      <Mic size={32} />
                    </button>
                  ) : (
                    <button className="record-btn-circle recording mic-recording" onClick={stopRecording}>
                      <MicOff size={32} />
                    </button>
                  )}
                </div>

                <div className="recording-status-text">
                  {isRecording ? (
                    <div className="recording-indicator">
                      <div className="audio-wave">
                        <span></span><span></span><span></span><span></span><span></span>
                      </div>
                      <span className="text-rose font-semibold">Listening... speak naturally</span>
                    </div>
                  ) : transcript ? (
                    <span className="text-emerald font-semibold">Recording saved. Ready for AI evaluation.</span>
                  ) : (
                    <span className="text-muted">Tap the microphone to start recording your response.</span>
                  )}
                </div>
              </div>

              {/* Live Transcript Box */}
              <div className="transcript-box">
                <div className="transcript-box-header">
                  <span>Live Speech-to-Text Transcript</span>
                  <span className="text-xs text-muted">Web Speech API</span>
                </div>
                <textarea
                  className="transcript-textarea form-textarea"
                  value={transcript + (interimText ? ' ' + interimText : '')}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Your spoken words will transcribe here in real-time. You can also edit or type manually if microphone is unavailable..."
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="studio-actions-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setTranscript('');
                    setInterimText('');
                    setEvaluation(null);
                    setTimerSeconds(0);
                  }}
                  disabled={isRecording}
                >
                  <RefreshCw size={16} /> Reset
                </button>

                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleAnalyze}
                  disabled={isRecording || analyzing || (!transcript && !interimText)}
                >
                  <Sparkles size={18} />
                  {analyzing ? 'AI Evaluating Speech...' : 'Analyze Speech (+100 XP)'}
                </button>
              </div>

              {/* AI Evaluation Report Card */}
              {evaluation && (
                <div className="evaluation-report-card">
                  <div className="eval-card-header">
                    <div className="eval-overall-score-pill">
                      <Award size={22} className="text-amber" />
                      <span>Overall Speaking Score: <strong>{evaluation.overallScore}/100</strong></span>
                    </div>
                    <span className="badge-pill badge-emerald">+100 XP Earned</span>
                  </div>

                  {/* 4 Score Metrics */}
                  <div className="eval-metrics-grid">
                    <div className="metric-score-box">
                      <span className="metric-box-label">Fluency</span>
                      <span className="metric-box-val text-indigo">{evaluation.fluencyScore}%</span>
                      <div className="mini-track"><div className="mini-fill" style={{ width: `${evaluation.fluencyScore}%` }}></div></div>
                    </div>
                    <div className="metric-score-box">
                      <span className="metric-box-label">Grammar</span>
                      <span className="metric-box-val text-emerald">{evaluation.grammarScore}%</span>
                      <div className="mini-track"><div className="mini-fill fill-emerald" style={{ width: `${evaluation.grammarScore}%` }}></div></div>
                    </div>
                    <div className="metric-score-box">
                      <span className="metric-box-label">Vocabulary</span>
                      <span className="metric-box-val text-amber">{evaluation.vocabularyScore}%</span>
                      <div className="mini-track"><div className="mini-fill fill-amber" style={{ width: `${evaluation.vocabularyScore}%` }}></div></div>
                    </div>
                    <div className="metric-score-box">
                      <span className="metric-box-label">Pronunciation</span>
                      <span className="metric-box-val text-rose">{evaluation.pronunciationScore}%</span>
                      <div className="mini-track"><div className="mini-fill fill-rose" style={{ width: `${evaluation.pronunciationScore}%` }}></div></div>
                    </div>
                  </div>

                  {/* Speech Diagnostics: Speed (WPM) & Filler Words */}
                  <div className="speech-diagnostics-row">
                    <div className="diag-item">
                      <span className="diag-title">Speaking Pace:</span>
                      <span className="diag-badge">{evaluation.speakingSpeedWpm} WPM</span>
                      <span className="diag-note">(Target: 120-150 WPM)</span>
                    </div>
                    <div className="diag-item">
                      <span className="diag-title">Filler Words Count:</span>
                      <span className={`diag-badge ${evaluation.fillerWordsCount > 2 ? 'badge-rose-soft' : 'badge-emerald-soft'}`}>
                        {evaluation.fillerWordsCount} detected
                      </span>
                      {evaluation.fillerWordsDetails && Object.keys(evaluation.fillerWordsDetails).length > 0 && (
                        <span className="diag-note">({Object.keys(evaluation.fillerWordsDetails).join(', ')})</span>
                      )}
                    </div>
                  </div>

                  {/* Actionable Suggestions */}
                  <div className="eval-suggestions-section">
                    <h4 className="suggestions-title">
                      <Sparkles size={16} className="text-amber" /> AI Coach Suggestions for Improvement:
                    </h4>
                    <ul className="suggestions-list">
                      {evaluation.suggestions?.map((s, idx) => (
                        <li key={idx} className="suggestion-bullet">
                          <CheckCircle size={15} className="text-emerald flex-shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .speaking-view-container {
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
        .speaking-layout-grid {
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
        .topics-vertical-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 720px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .topic-select-card {
          padding: 1rem;
          background: var(--bg-secondary);
          border: 1.5px solid var(--border-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .topic-select-card:hover {
          border-color: var(--brand-primary);
        }
        .topic-select-card.selected {
          border-color: var(--brand-primary);
          background: rgba(99, 102, 241, 0.08);
          box-shadow: 0 0 0 1px var(--brand-primary);
        }
        .topic-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.35rem;
        }
        .topic-duration {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .topic-name {
          font-size: 0.95rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          color: var(--text-main);
        }
        .topic-category-label {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .topic-best-score {
          font-size: 0.75rem;
          color: var(--accent-emerald);
          margin-top: 0.35rem;
        }
        .studio-card {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .prompt-display-box {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1.25rem;
        }
        .prompt-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        .active-prompt-text {
          font-size: 1.15rem;
          font-weight: 700;
          line-height: 1.4;
          margin-bottom: 0.85rem;
          color: var(--text-main);
        }
        .hints-row {
          background: rgba(99, 102, 241, 0.06);
          border-radius: var(--radius-sm);
          padding: 0.75rem;
        }
        .hints-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--brand-primary);
          display: flex;
          align-items: center;
          gap: 0.35rem;
          margin-bottom: 0.35rem;
        }
        .hints-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          font-size: 0.82rem;
          color: var(--text-secondary);
          padding-left: 0.5rem;
        }
        .recording-controls-zone {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.85rem;
          padding: 1.5rem 0;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
        }
        .timer-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-family: monospace;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-main);
          background: var(--bg-card);
          padding: 0.25rem 0.85rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-color);
        }
        .record-btn-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--brand-gradient);
          color: #fff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px var(--brand-glow);
          transition: transform var(--transition-fast);
        }
        .record-btn-circle:hover {
          transform: scale(1.05);
        }
        .record-btn-circle.recording {
          background: #f43f5e;
        }
        .recording-status-text {
          font-size: 0.85rem;
        }
        .recording-indicator {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }
        .transcript-box {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .transcript-box-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        .transcript-textarea {
          resize: vertical;
          min-height: 100px;
          line-height: 1.5;
        }
        .studio-actions-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .evaluation-report-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .eval-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }
        .eval-overall-score-pill {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.15rem;
          font-weight: 600;
        }
        .eval-overall-score-pill strong {
          color: var(--brand-primary);
          font-size: 1.35rem;
        }
        .eval-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.25rem;
        }
        .metric-score-box {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.85rem;
          text-align: center;
        }
        .metric-box-label {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-transform: uppercase;
          display: block;
          margin-bottom: 0.25rem;
        }
        .metric-box-val {
          font-size: 1.5rem;
          font-weight: 800;
          display: block;
          margin-bottom: 0.35rem;
        }
        .mini-track {
          height: 4px;
          background: var(--bg-secondary);
          border-radius: 999px;
          overflow: hidden;
        }
        .mini-fill {
          height: 100%;
          background: var(--brand-primary);
        }
        .mini-fill.fill-emerald { background: var(--accent-emerald); }
        .mini-fill.fill-amber { background: var(--accent-amber); }
        .mini-fill.fill-rose { background: var(--accent-rose); }
        .speech-diagnostics-row {
          display: flex;
          gap: 1.5rem;
          padding: 0.75rem 1rem;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
        }
        .diag-item {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.85rem;
        }
        .diag-title {
          font-weight: 600;
          color: var(--text-muted);
        }
        .diag-badge {
          font-weight: 700;
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          background: var(--bg-secondary);
        }
        .badge-rose-soft { background: rgba(244, 63, 94, 0.15); color: #f43f5e; }
        .badge-emerald-soft { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .diag-note {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .eval-suggestions-section {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1rem;
        }
        .suggestions-title {
          font-size: 0.92rem;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin-bottom: 0.75rem;
        }
        .suggestions-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .suggestion-bullet {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }
        .flex-shrink-0 { flex-shrink: 0; margin-top: 2px; }
        @media (max-width: 960px) {
          .speaking-layout-grid {
            grid-template-columns: 1fr;
          }
          .eval-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
