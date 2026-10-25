import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { speakText, triggerCelebration } from '../utils/speech';
import {
  GraduationCap,
  Volume2,
  CheckCircle,
  RotateCw,
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Award,
  Layers,
  HelpCircle
} from 'lucide-react';

export default function VocabularyView() {
  const [activeTab, setActiveTab] = useState('flashcards'); // 'flashcards' | 'quiz' | 'bank'
  const [words, setWords] = useState([]);
  const [dailyWords, setDailyWords] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedLevel, selectedStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [wordsRes, dailyRes] = await Promise.all([
        apiRequest(`/vocabulary/words?level=${selectedLevel}&status=${selectedStatus}&search=${encodeURIComponent(searchQuery)}`),
        apiRequest('/vocabulary/daily')
      ]);
      setWords(wordsRes.words || []);
      setDailyWords(dailyRes.dailyWords || []);
    } catch (err) {
      console.error('Failed to load vocabulary data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadQuiz = async () => {
    try {
      const res = await apiRequest('/vocabulary/quiz');
      setQuizQuestions(res.questions || []);
      setQuizAnswers({});
      setQuizScore(null);
    } catch (err) {
      console.error('Failed to generate quiz:', err);
    }
  };

  const handleUpdateStatus = async (vocabId, newStatus) => {
    try {
      await apiRequest('/vocabulary/status', 'POST', { vocabId, status: newStatus });
      setWords(prev => prev.map(w => w.id === vocabId ? { ...w, learning_status: newStatus } : w));
      if (newStatus === 'mastered') {
        triggerCelebration('medium');
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handlePronounce = (wordText) => {
    speakText(wordText, 0.9);
  };

  const handleQuizAnswer = (qId, option) => {
    setQuizAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const handleGradeQuiz = () => {
    let correct = 0;
    quizQuestions.forEach(q => {
      if (quizAnswers[q.id] === q.correctAnswer) correct++;
    });
    const pct = Math.round((correct / Math.max(quizQuestions.length, 1)) * 100);
    setQuizScore({ correct, total: quizQuestions.length, percentage: pct });
    triggerCelebration('medium');
  };

  const currentFlashcard = words[flashcardIndex];

  return (
    <div className="vocab-view-container">
      <div className="view-title-block">
        <div className="title-icon-badge">
          <GraduationCap size={24} className="text-indigo" />
        </div>
        <div>
          <h2>Vocabulary Builder & Spaced Repetition</h2>
          <p className="view-subtitle">
            Master high-frequency academic and conversational words with phonetics, audio pronunciation, and interactive quizzes.
          </p>
        </div>
      </div>

      {/* Daily 5 Words of the Day Ribbon */}
      <div className="daily-words-ribbon glass-panel">
        <div className="ribbon-title">
          <Sparkles size={16} className="text-amber" />
          <span>DAILY WORDS OF THE DAY</span>
        </div>
        <div className="daily-words-scroll">
          {dailyWords.map((dw) => (
            <div key={dw.id} className="daily-word-chip" onClick={() => handlePronounce(dw.word)}>
              <span className="dw-word">{dw.word}</span>
              <span className="dw-phonetic">{dw.phonetic}</span>
              <Volume2 size={13} className="text-indigo dw-speaker" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="vocab-subtabs">
        <button
          className={`subtab-btn ${activeTab === 'flashcards' ? 'active' : ''}`}
          onClick={() => { setActiveTab('flashcards'); setIsFlipped(false); }}
        >
          <RotateCw size={16} /> Flashcards Mode
        </button>
        <button
          className={`subtab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
          onClick={() => { setActiveTab('quiz'); loadQuiz(); }}
        >
          <HelpCircle size={16} /> Vocabulary Quiz
        </button>
        <button
          className={`subtab-btn ${activeTab === 'bank' ? 'active' : ''}`}
          onClick={() => setActiveTab('bank')}
        >
          <Layers size={16} /> Word Bank ({words.length})
        </button>
      </div>

      {/* 1. Flashcards Mode */}
      {activeTab === 'flashcards' && currentFlashcard && (
        <div className="flashcard-screen-wrap">
          <div className="flashcard-tracker-bar">
            <span>Card {flashcardIndex + 1} of {words.length}</span>
            <span className="badge-pill badge-indigo">CEFR {currentFlashcard.level}</span>
          </div>

          <div
            className={`flashcard-3d-box ${isFlipped ? 'flipped' : ''}`}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Front of card */}
            <div className="flashcard-face flashcard-front">
              <span className="flip-hint">Tap card to reveal definition</span>
              <h2 className="card-front-word">{currentFlashcard.word}</h2>
              <div className="card-phonetic-row" onClick={(e) => { e.stopPropagation(); handlePronounce(currentFlashcard.word); }}>
                <span className="card-phonetic-text">{currentFlashcard.phonetic}</span>
                <button className="btn-icon" title="Listen to pronunciation">
                  <Volume2 size={20} className="text-indigo" />
                </button>
              </div>
              <span className="badge-pill badge-indigo mt-3">{currentFlashcard.part_of_speech}</span>
            </div>

            {/* Back of card */}
            <div className="flashcard-face flashcard-back">
              <span className="flip-hint">Tap card to return</span>
              <div className="back-definition-group">
                <span className="def-label">Definition:</span>
                <p className="def-text">{currentFlashcard.meaning}</p>
              </div>

              <div className="back-example-group">
                <span className="def-label">Context Example:</span>
                <p className="example-text">"{currentFlashcard.example_sentence}"</p>
              </div>

              {currentFlashcard.synonyms && currentFlashcard.synonyms.length > 0 && (
                <div className="synonyms-tags-row">
                  <span className="syn-label">Synonyms:</span>
                  {currentFlashcard.synonyms.map((s, i) => (
                    <span key={i} className="syn-tag">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Flashcard Controls */}
          <div className="flashcard-nav-controls">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setIsFlipped(false);
                setFlashcardIndex(prev => Math.max(prev - 1, 0));
              }}
              disabled={flashcardIndex === 0}
            >
              <ArrowLeft size={16} /> Previous
            </button>

            <button
              className={`btn ${currentFlashcard.learning_status === 'mastered' ? 'btn-secondary' : 'btn-emerald'}`}
              onClick={() => handleUpdateStatus(currentFlashcard.id, 'mastered')}
            >
              <CheckCircle size={16} />
              {currentFlashcard.learning_status === 'mastered' ? 'Mastered ✓' : 'Mark as Mastered (+15 XP)'}
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => {
                setIsFlipped(false);
                setFlashcardIndex(prev => Math.min(prev + 1, words.length - 1));
              }}
              disabled={flashcardIndex === words.length - 1}
            >
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 2. Interactive Quiz Mode */}
      {activeTab === 'quiz' && (
        <div className="vocab-quiz-container glass-panel">
          <div className="quiz-header-box">
            <h3 className="font-bold text-lg">Daily Vocabulary Mastery Quiz</h3>
            <span className="text-sm text-muted">Test your recall of key definitions</span>
          </div>

          <div className="quiz-stream">
            {quizQuestions.map((q, idx) => (
              <div key={q.id} className="quiz-card-box">
                <h4 className="quiz-q-title">
                  <span className="text-indigo font-bold">{idx + 1}.</span> {q.prompt}
                </h4>
                <p className="quiz-q-context text-sm text-muted italic mb-3">
                  Context: "{q.sentenceContext}"
                </p>

                <div className="quiz-options-list">
                  {q.options?.map((opt, optIdx) => {
                    const isSelected = quizAnswers[q.id] === opt;
                    let cls = '';
                    if (quizScore) {
                      if (opt === q.correctAnswer) cls = 'opt-correct';
                      else if (isSelected) cls = 'opt-wrong';
                    } else if (isSelected) {
                      cls = 'opt-selected';
                    }

                    return (
                      <button
                        key={optIdx}
                        className={`quiz-opt-btn ${cls}`}
                        onClick={() => !quizScore && handleQuizAnswer(q.id, opt)}
                      >
                        <span className="opt-marker">{String.fromCharCode(65 + optIdx)}</span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {quizScore && (
            <div className="quiz-result-banner mt-4">
              <Award size={24} className="text-amber" />
              <div>
                <h4>Quiz Score: {quizScore.percentage}%</h4>
                <span>{quizScore.correct} of {quizScore.total} definitions identified correctly</span>
              </div>
            </div>
          )}

          {!quizScore && quizQuestions.length > 0 && (
            <div className="mt-4 text-center">
              <button
                className="btn btn-primary btn-lg"
                onClick={handleGradeQuiz}
                disabled={Object.keys(quizAnswers).length === 0}
              >
                Grade Quiz & Record Score
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. Word Bank Mode */}
      {activeTab === 'bank' && (
        <div className="word-bank-wrap">
          {/* Filters Bar */}
          <div className="bank-filters-row glass-panel">
            <div className="search-input-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search word or meaning..."
                className="form-input search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') loadData(); }}
              />
            </div>

            <div className="filters-right">
              <select
                className="form-select select-sm"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
              >
                <option value="ALL">All CEFR Levels</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
              </select>

              <select
                className="form-select select-sm"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="new">New Words</option>
                <option value="learning">Learning</option>
                <option value="mastered">Mastered</option>
              </select>
            </div>
          </div>

          {/* Words Grid */}
          <div className="words-cards-grid">
            {words.map((w) => (
              <div key={w.id} className="word-entry-card glass-panel">
                <div className="word-card-top-row">
                  <div className="word-title-group">
                    <h4 className="entry-word">{w.word}</h4>
                    <span className="entry-phonetic">{w.phonetic}</span>
                  </div>
                  <button className="btn-icon" onClick={() => handlePronounce(w.word)} title="Listen">
                    <Volume2 size={18} className="text-indigo" />
                  </button>
                </div>

                <div className="word-tags-row">
                  <span className="badge-pill badge-indigo">{w.level}</span>
                  <span className="badge-pill badge-secondary">{w.part_of_speech}</span>
                  {w.learning_status === 'mastered' && (
                    <span className="badge-pill badge-emerald">Mastered</span>
                  )}
                </div>

                <p className="word-meaning-text">{w.meaning}</p>
                <p className="word-example-text">"{w.example_sentence}"</p>

                <div className="word-card-footer">
                  <button
                    className={`btn btn-sm ${w.learning_status === 'mastered' ? 'btn-secondary' : 'btn-outline'}`}
                    onClick={() => handleUpdateStatus(w.id, w.learning_status === 'mastered' ? 'learning' : 'mastered')}
                  >
                    {w.learning_status === 'mastered' ? 'Mastered ✓' : 'Mark Mastered'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .vocab-view-container {
          padding: 1.75rem 2rem;
          max-width: 1350px;
          margin: 0 auto;
        }
        .view-title-block {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.25rem;
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
        .daily-words-ribbon {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 0.85rem 1.25rem;
          margin-bottom: 1.5rem;
          overflow-x: auto;
        }
        .ribbon-title {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          white-space: nowrap;
        }
        .daily-words-scroll {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .daily-word-chip {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.35rem 0.85rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          cursor: pointer;
          white-space: nowrap;
          transition: all var(--transition-fast);
        }
        .daily-word-chip:hover {
          border-color: var(--brand-primary);
          transform: translateY(-1px);
        }
        .dw-word {
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--text-main);
        }
        .dw-phonetic {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .dw-speaker {
          opacity: 0.7;
        }
        .vocab-subtabs {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .subtab-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.25rem;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .subtab-btn:hover {
          color: var(--text-main);
          border-color: var(--border-focus);
        }
        .subtab-btn.active {
          background: rgba(99, 102, 241, 0.12);
          color: var(--brand-primary);
          border-color: var(--brand-primary);
        }
        .flashcard-screen-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          max-width: 580px;
          margin: 0 auto;
        }
        .flashcard-tracker-bar {
          display: flex;
          justify-content: space-between;
          width: 100%;
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .flashcard-3d-box {
          width: 100%;
          height: 340px;
          perspective: 1000px;
          cursor: pointer;
          position: relative;
        }
        .flashcard-face {
          position: absolute;
          inset: 0;
          background: var(--bg-card);
          border: 2px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          box-shadow: var(--shadow-lg);
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .flashcard-front {
          transform: rotateY(0deg);
        }
        .flashcard-back {
          transform: rotateY(180deg);
          text-align: left;
          align-items: flex-start;
          justify-content: flex-start;
          overflow-y: auto;
        }
        .flashcard-3d-box.flipped .flashcard-front {
          transform: rotateY(-180deg);
        }
        .flashcard-3d-box.flipped .flashcard-back {
          transform: rotateY(0deg);
        }
        .flip-hint {
          position: absolute;
          top: 1rem;
          font-size: 0.72rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .card-front-word {
          font-size: 2.75rem;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 0.5rem;
        }
        .card-phonetic-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        .card-phonetic-text {
          font-size: 1.1rem;
          color: var(--brand-primary);
        }
        .mt-3 { margin-top: 0.75rem; }
        .back-definition-group, .back-example-group {
          margin-bottom: 1rem;
          width: 100%;
        }
        .def-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          display: block;
          margin-bottom: 0.25rem;
        }
        .def-text {
          font-size: 1.05rem;
          color: var(--text-main);
          line-height: 1.45;
        }
        .example-text {
          font-size: 0.95rem;
          font-style: italic;
          color: var(--text-secondary);
        }
        .synonyms-tags-row {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          flex-wrap: wrap;
        }
        .syn-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
        }
        .syn-tag {
          font-size: 0.75rem;
          padding: 0.2rem 0.55rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-sm);
          color: var(--brand-primary);
          border: 1px solid var(--border-color);
        }
        .flashcard-nav-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
          width: 100%;
          justify-content: space-between;
        }
        .vocab-quiz-container {
          padding: 1.75rem;
          max-width: 800px;
          margin: 0 auto;
        }
        .quiz-header-box {
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .quiz-stream {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .quiz-card-box {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1.25rem;
        }
        .quiz-q-title {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.35rem;
        }
        .quiz-options-list {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
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
          font-size: 0.9rem;
          text-align: left;
          cursor: pointer;
        }
        .opt-selected { border-color: var(--brand-primary); background: rgba(99, 102, 241, 0.12); }
        .opt-correct { border-color: #10b981; background: rgba(16, 185, 129, 0.15); }
        .opt-wrong { border-color: #f43f5e; background: rgba(244, 63, 94, 0.15); }
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
        .bank-filters-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          margin-bottom: 1.5rem;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .search-input-box {
          position: relative;
          flex: 1;
          min-width: 240px;
        }
        .search-icon {
          position: absolute;
          left: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }
        .search-input {
          padding-left: 2.35rem;
          width: 100%;
        }
        .filters-right {
          display: flex;
          gap: 0.75rem;
        }
        .select-sm {
          padding: 0.6rem 0.85rem;
          font-size: 0.85rem;
        }
        .words-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.25rem;
        }
        .word-entry-card {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
        }
        .word-card-top-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }
        .entry-word {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .entry-phonetic {
          font-size: 0.85rem;
          color: var(--brand-primary);
        }
        .word-tags-row {
          display: flex;
          gap: 0.45rem;
          margin-bottom: 0.85rem;
        }
        .badge-secondary {
          background: var(--bg-secondary);
          color: var(--text-muted);
          border: 1px solid var(--border-color);
        }
        .word-meaning-text {
          font-size: 0.9rem;
          color: var(--text-main);
          margin-bottom: 0.5rem;
          line-height: 1.45;
        }
        .word-example-text {
          font-size: 0.82rem;
          font-style: italic;
          color: var(--text-secondary);
          margin-bottom: 1rem;
          flex: 1;
        }
        .word-card-footer {
          display: flex;
          justify-content: flex-end;
          border-top: 1px solid var(--border-color);
          padding-top: 0.75rem;
        }
      `}</style>
    </div>
  );
}
