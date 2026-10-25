import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { triggerCelebration } from '../utils/speech';
import {
  PenTool,
  Sparkles,
  Award,
  CheckCircle,
  AlertCircle,
  FileCheck,
  BookOpen,
  ArrowRight,
  Info,
  Layers,
  SplitSquareVertical
} from 'lucide-react';

export default function WritingPracticeView() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/writing/tasks');
      setTasks(res.tasks || []);
      if (res.tasks?.length > 0) {
        selectTask(res.tasks[0]);
      }
    } catch (err) {
      console.error('Failed to load writing tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectTask = (task) => {
    setSelectedTask(task);
    setText('');
    setEvaluation(null);
  };

  const handleAnalyze = async () => {
    if (!text.trim() || text.trim().split(/\s+/).length < 15) {
      alert('Please write at least 15 words before requesting AI analysis.');
      return;
    }

    setAnalyzing(true);
    try {
      const res = await apiRequest('/writing/analyze', 'POST', {
        taskId: selectedTask?.id || 1,
        text
      });
      setEvaluation(res.evaluation);
      triggerCelebration('high');
    } catch (err) {
      alert('Analysis failed: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const wordsCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="writing-view-container">
      <div className="view-title-block">
        <div className="title-icon-badge">
          <PenTool size={24} className="text-indigo" />
        </div>
        <div>
          <h2>Writing Practice & AI Composition Lab</h2>
          <p className="view-subtitle">
            Draft formal emails, essays, and career summaries. Receive side-by-side enhancements and grammatical breakdown.
          </p>
        </div>
      </div>

      <div className="writing-layout-grid">
        {/* Left Side: Tasks */}
        <div className="writing-sidebar-pane">
          <div className="glass-panel pane-card">
            <h3 className="pane-title">Writing Assignments</h3>
            <div className="tasks-v-list">
              {tasks.map((t) => {
                const isSelected = selectedTask?.id === t.id;
                return (
                  <div
                    key={t.id}
                    className={`task-select-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => selectTask(t)}
                  >
                    <div className="task-top-meta">
                      <span className="badge-pill badge-indigo">{t.category}</span>
                      <span className="task-level">{t.level}</span>
                    </div>
                    <h4 className="task-title">{t.title}</h4>
                    <span className="task-words-req">{t.min_words} - {t.max_words} words</span>
                    {t.user_best_score > 0 && (
                      <span className="text-xs text-emerald mt-1 block">Best Score: {t.user_best_score}%</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Composition Studio */}
        <div className="writing-main-pane">
          {selectedTask && (
            <div className="glass-panel pane-card studio-pane">
              {/* Task Details Banner */}
              <div className="task-guidance-card">
                <div className="task-guidance-header">
                  <span className="badge-pill badge-indigo">{selectedTask.category}</span>
                  <span className="text-xs text-muted">Length: {selectedTask.min_words}–{selectedTask.max_words} words</span>
                </div>
                <h3 className="task-prompt-title">{selectedTask.prompt}</h3>

                {selectedTask.guidelines && (
                  <div className="guidelines-box">
                    <span className="guidelines-title"><Info size={14} /> Writing Guidelines:</span>
                    <ul className="guidelines-list">
                      {selectedTask.guidelines.map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Text Input Editor */}
              <div className="writing-editor-box">
                <div className="editor-top-bar">
                  <span className="editor-label">Your Composition</span>
                  <span className={`word-counter ${wordsCount < selectedTask.min_words ? 'text-amber' : 'text-emerald'}`}>
                    {wordsCount} / {selectedTask.max_words} words (min {selectedTask.min_words})
                  </span>
                </div>

                <textarea
                  className="writing-textarea form-textarea"
                  rows={8}
                  placeholder="Draft your response here. Focus on formal register, clear paragraphing, and precise terminology..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>

              {/* Actions Footer */}
              <div className="studio-footer-row">
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setText(selectedTask.sample_response || '')}
                >
                  <BookOpen size={14} /> Insert Model Sample
                </button>

                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleAnalyze}
                  disabled={analyzing || wordsCount < 15}
                >
                  <Sparkles size={18} />
                  {analyzing ? 'AI Evaluating Draft...' : 'Submit & AI Analyze (+90 XP)'}
                </button>
              </div>

              {/* Side-by-Side Evaluation Comparison */}
              {evaluation && (
                <div className="writing-evaluation-card">
                  <div className="eval-overall-row">
                    <div className="overall-score-tag">
                      <Award size={22} className="text-amber" />
                      <span>Writing Score: <strong>{evaluation.overallScore}/100</strong></span>
                    </div>
                    <span className="badge-pill badge-emerald">+90 XP Awarded</span>
                  </div>

                  {/* 3 Metrics */}
                  <div className="eval-metrics-row">
                    <div className="metric-pill-box">
                      <span className="metric-name">Grammar & Syntax</span>
                      <span className="metric-value text-indigo">{evaluation.grammarScore}%</span>
                    </div>
                    <div className="metric-pill-box">
                      <span className="metric-name">Vocabulary & Tone</span>
                      <span className="metric-value text-emerald">{evaluation.vocabularyScore}%</span>
                    </div>
                    <div className="metric-pill-box">
                      <span className="metric-name">Clarity & Formality</span>
                      <span className="metric-value text-amber">{evaluation.clarityScore}%</span>
                    </div>
                  </div>

                  {/* Side-by-Side Comparison */}
                  <div className="diff-comparison-grid">
                    <div className="diff-panel original-panel">
                      <span className="diff-panel-title">Original Submission</span>
                      <div className="diff-panel-content">{evaluation.originalText}</div>
                    </div>

                    <div className="diff-panel improved-panel">
                      <span className="diff-panel-title text-emerald">
                        <Sparkles size={14} /> AI-Polished Version
                      </span>
                      <div className="diff-panel-content text-emerald-bright">{evaluation.improvedText}</div>
                    </div>
                  </div>

                  {/* Specific Mistake Explanations */}
                  <div className="mistakes-analysis-section">
                    <h4 className="mistakes-title">
                      <AlertCircle size={16} className="text-amber" /> Detailed Mistakes & Explanation:
                    </h4>
                    <div className="mistakes-list">
                      {evaluation.mistakes?.map((m, idx) => (
                        <div key={idx} className="mistake-item">
                          <div className="mistake-header">
                            <span className="badge-pill badge-rose">{m.issue}</span>
                            <ArrowRight size={14} className="text-muted" />
                            <span className="badge-pill badge-emerald">Suggested: {m.correction}</span>
                          </div>
                          <p className="mistake-reason">{m.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .writing-view-container {
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
        .writing-layout-grid {
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
        .tasks-v-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .task-select-card {
          padding: 1rem;
          background: var(--bg-secondary);
          border: 1.5px solid var(--border-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .task-select-card:hover {
          border-color: var(--brand-primary);
        }
        .task-select-card.selected {
          border-color: var(--brand-primary);
          background: rgba(99, 102, 241, 0.08);
          box-shadow: 0 0 0 1px var(--brand-primary);
        }
        .task-top-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.35rem;
        }
        .task-level {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .task-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.25rem;
        }
        .task-words-req {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .studio-pane {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .task-guidance-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1.25rem;
        }
        .task-guidance-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .task-prompt-title {
          font-size: 1.15rem;
          font-weight: 700;
          line-height: 1.45;
          margin-bottom: 0.85rem;
        }
        .guidelines-box {
          background: rgba(99, 102, 241, 0.06);
          border-radius: var(--radius-sm);
          padding: 0.75rem;
        }
        .guidelines-title {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--brand-primary);
          display: flex;
          align-items: center;
          gap: 0.35rem;
          margin-bottom: 0.35rem;
        }
        .guidelines-list {
          list-style: none;
          padding-left: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          font-size: 0.82rem;
          color: var(--text-secondary);
        }
        .writing-editor-box {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .editor-top-bar {
          display: flex;
          justify-content: space-between;
          font-size: 0.82rem;
          font-weight: 600;
        }
        .writing-textarea {
          line-height: 1.6;
          font-size: 1rem;
        }
        .studio-footer-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .writing-evaluation-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          animation: slideUp 0.3s ease;
        }
        .eval-overall-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }
        .overall-score-tag {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.15rem;
          font-weight: 600;
        }
        .overall-score-tag strong {
          font-size: 1.35rem;
          color: var(--brand-primary);
        }
        .eval-metrics-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.85rem;
          margin-bottom: 1.25rem;
        }
        .metric-pill-box {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.75rem;
          text-align: center;
        }
        .metric-name {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-transform: uppercase;
          display: block;
        }
        .metric-value {
          font-size: 1.35rem;
          font-weight: 800;
        }
        .diff-comparison-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .diff-panel {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1rem;
        }
        .diff-panel-title {
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          margin-bottom: 0.5rem;
          color: var(--text-muted);
        }
        .diff-panel-content {
          font-size: 0.95rem;
          line-height: 1.6;
          white-space: pre-wrap;
        }
        .text-emerald-bright {
          color: #059669;
        }
        .mistakes-analysis-section {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1.25rem;
        }
        .mistakes-title {
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin-bottom: 1rem;
        }
        .mistakes-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .mistake-item {
          background: var(--bg-secondary);
          border-radius: var(--radius-sm);
          padding: 0.75rem;
        }
        .mistake-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.35rem;
          flex-wrap: wrap;
        }
        .mistake-reason {
          font-size: 0.82rem;
          color: var(--text-secondary);
        }
        @media (max-width: 900px) {
          .writing-layout-grid {
            grid-template-columns: 1fr;
          }
          .diff-comparison-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
