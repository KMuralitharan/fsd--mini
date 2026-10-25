import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import {
  ShieldCheck,
  Users,
  Layers,
  GraduationCap,
  BookOpen,
  Mic,
  Trash2,
  Plus,
  BarChart3,
  CheckCircle,
  Clock,
  Sparkles,
  Search
} from 'lucide-react';

export default function AdminPortalView() {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'students' | 'grammar' | 'vocab' | 'reading' | 'speaking'
  const [grammarList, setGrammarList] = useState([]);
  const [vocabList, setVocabList] = useState([]);
  const [readingList, setReadingList] = useState([]);
  const [speakingList, setSpeakingList] = useState([]);
  const [loading, setLoading] = useState(true);

  // New content modals / forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [formType, setFormType] = useState('grammar');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, studentsRes, grammarRes, vocabRes, readingRes, speakingRes] = await Promise.all([
        apiRequest('/admin/stats'),
        apiRequest('/admin/students'),
        apiRequest('/admin/grammar'),
        apiRequest('/admin/vocabulary'),
        apiRequest('/admin/reading'),
        apiRequest('/admin/speaking')
      ]);
      setStats(statsRes);
      setStudents(studentsRes.students || []);
      setGrammarList(grammarRes.lessons || []);
      setVocabList(vocabRes.words || []);
      setReadingList(readingRes.passages || []);
      setSpeakingList(speakingRes.topics || []);
    } catch (err) {
      console.error('Admin data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!confirm('Are you sure you want to delete this student account?')) return;
    try {
      await apiRequest(`/admin/students/${id}`, 'DELETE');
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert('Failed to delete student: ' + err.message);
    }
  };

  const handleDeleteItem = async (type, id) => {
    if (!confirm(`Delete this ${type} item?`)) return;
    try {
      await apiRequest(`/admin/${type}/${id}`, 'DELETE');
      if (type === 'grammar') setGrammarList(prev => prev.filter(i => i.id !== id));
      if (type === 'vocabulary') setVocabList(prev => prev.filter(i => i.id !== id));
      if (type === 'reading') setReadingList(prev => prev.filter(i => i.id !== id));
      if (type === 'speaking') setSpeakingList(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleCreateContent = async (e) => {
    e.preventDefault();
    try {
      await apiRequest(`/admin/${formType}`, 'POST', formData);
      setShowAddModal(false);
      setFormData({});
      loadAllAdminData();
      alert(`New ${formType} content successfully added to database!`);
    } catch (err) {
      alert('Failed to create content: ' + err.message);
    }
  };

  return (
    <div className="admin-view-container">
      <div className="view-title-block">
        <div className="title-icon-badge">
          <ShieldCheck size={24} className="text-emerald" />
        </div>
        <div>
          <h2>EnglishConnect Administrator Portal</h2>
          <p className="view-subtitle">
            Manage global student cohort, inspect CEFR distributions, and author interactive curriculum modules.
          </p>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="admin-subtabs">
        <button
          className={`subtab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} /> Platform Overview
        </button>
        <button
          className={`subtab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <Users size={16} /> Students Directory ({students.length})
        </button>
        <button
          className={`subtab-btn ${activeTab === 'grammar' ? 'active' : ''}`}
          onClick={() => setActiveTab('grammar')}
        >
          <Layers size={16} /> Grammar Lessons ({grammarList.length})
        </button>
        <button
          className={`subtab-btn ${activeTab === 'vocab' ? 'active' : ''}`}
          onClick={() => setActiveTab('vocab')}
        >
          <GraduationCap size={16} /> Vocabulary Words ({vocabList.length})
        </button>
        <button
          className={`subtab-btn ${activeTab === 'reading' ? 'active' : ''}`}
          onClick={() => setActiveTab('reading')}
        >
          <BookOpen size={16} /> Reading Passages ({readingList.length})
        </button>
        <button
          className={`subtab-btn ${activeTab === 'speaking' ? 'active' : ''}`}
          onClick={() => setActiveTab('speaking')}
        >
          <Mic size={16} /> Speaking Prompts ({speakingList.length})
        </button>
      </div>

      {/* 1. Overview */}
      {activeTab === 'overview' && stats && (
        <div className="admin-overview-wrap">
          <div className="admin-stats-grid">
            <div className="admin-stat-card glass-panel">
              <span className="astat-label">TOTAL REGISTERED STUDENTS</span>
              <span className="astat-num text-indigo">{stats.stats?.totalStudents || 0}</span>
              <span className="astat-note text-emerald">Active enrolled scholars</span>
            </div>

            <div className="admin-stat-card glass-panel">
              <span className="astat-label">GRAMMAR MODULES</span>
              <span className="astat-num text-emerald">{stats.stats?.totalGrammarLessons || 0}</span>
              <span className="astat-note">Interactive lessons & rules</span>
            </div>

            <div className="admin-stat-card glass-panel">
              <span className="astat-label">VOCABULARY ITEMS</span>
              <span className="astat-num text-amber">{stats.stats?.totalVocabularyWords || 0}</span>
              <span className="astat-note">With audio phonetics</span>
            </div>

            <div className="admin-stat-card glass-panel">
              <span className="astat-label">COMPLETED SESSIONS</span>
              <span className="astat-num text-rose">{stats.stats?.totalCompletedSessions || 0}</span>
              <span className="astat-note">Recorded attempts & quizzes</span>
            </div>
          </div>

          {/* CEFR Distribution */}
          <div className="glass-panel pane-card mt-6">
            <h3 className="font-bold text-lg mb-4">Student CEFR Level Distribution</h3>
            <div className="cefr-dist-grid">
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => {
                const item = stats.cefrDistribution?.find(c => c.english_level === lvl);
                const count = item ? item.count : 0;
                return (
                  <div key={lvl} className="cefr-dist-card">
                    <span className="cefr-dist-level">{lvl}</span>
                    <span className="cefr-dist-count">{count} Students</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. Students Directory */}
      {activeTab === 'students' && (
        <div className="admin-table-card glass-panel">
          <div className="table-top-bar">
            <h3>Registered Student Accounts</h3>
            <span className="badge-pill badge-indigo">{students.length} Accounts</span>
          </div>

          <div className="table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Avatar & Name</th>
                  <th>Email</th>
                  <th>CEFR Level</th>
                  <th>XP</th>
                  <th>Streak</th>
                  <th>Sessions Completed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="student-profile-cell">
                        <img src={s.avatar} alt={s.full_name} className="admin-avatar" />
                        <span className="font-bold text-main">{s.full_name}</span>
                      </div>
                    </td>
                    <td>{s.email}</td>
                    <td>
                      <span className="badge-pill badge-indigo">{s.english_level || 'B1'}</span>
                    </td>
                    <td className="font-bold text-main">{(s.total_xp || 0).toLocaleString()}</td>
                    <td>{s.current_streak || 1}d</td>
                    <td>{s.lessons_completed || 0}</td>
                    <td>
                      <button
                        className="btn-icon text-rose"
                        onClick={() => handleDeleteStudent(s.id)}
                        title="Delete Student Account"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Grammar Manager */}
      {activeTab === 'grammar' && (
        <div className="admin-table-card glass-panel">
          <div className="table-top-bar">
            <h3>Grammar Lessons Manager</h3>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { setFormType('grammar'); setFormData({ level: 'B1' }); setShowAddModal(true); }}
            >
              <Plus size={15} /> Add Grammar Lesson
            </button>
          </div>

          <div className="table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Topic</th>
                  <th>Title</th>
                  <th>Level</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {grammarList.map((g) => (
                  <tr key={g.id}>
                    <td>#{g.id}</td>
                    <td className="font-bold text-indigo">{g.topic}</td>
                    <td>{g.title}</td>
                    <td><span className="badge-pill badge-indigo">{g.level}</span></td>
                    <td>
                      <button
                        className="btn-icon text-rose"
                        onClick={() => handleDeleteItem('grammar', g.id)}
                        title="Delete Lesson"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Vocabulary Manager */}
      {activeTab === 'vocab' && (
        <div className="admin-table-card glass-panel">
          <div className="table-top-bar">
            <h3>Vocabulary Bank Manager</h3>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { setFormType('vocabulary'); setFormData({ level: 'B1' }); setShowAddModal(true); }}
            >
              <Plus size={15} /> Add Word
            </button>
          </div>

          <div className="table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Word</th>
                  <th>Phonetic</th>
                  <th>Part of Speech</th>
                  <th>Meaning</th>
                  <th>Level</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vocabList.map((v) => (
                  <tr key={v.id}>
                    <td className="font-bold text-main">{v.word}</td>
                    <td className="text-muted">{v.phonetic}</td>
                    <td>{v.part_of_speech}</td>
                    <td className="max-w-xs truncate">{v.meaning}</td>
                    <td><span className="badge-pill badge-indigo">{v.level}</span></td>
                    <td>
                      <button
                        className="btn-icon text-rose"
                        onClick={() => handleDeleteItem('vocabulary', v.id)}
                        title="Delete Word"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Reading Passages Manager */}
      {activeTab === 'reading' && (
        <div className="admin-table-card glass-panel">
          <div className="table-top-bar">
            <h3>Reading Passages Manager</h3>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { setFormType('reading'); setFormData({ level: 'B1', word_count: 250 }); setShowAddModal(true); }}
            >
              <Plus size={15} /> Add Passage
            </button>
          </div>

          <div className="table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Word Count</th>
                  <th>Level</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {readingList.map((r) => (
                  <tr key={r.id}>
                    <td className="font-bold text-main">{r.title}</td>
                    <td>{r.topic_category}</td>
                    <td>{r.word_count} words</td>
                    <td><span className="badge-pill badge-indigo">{r.level}</span></td>
                    <td>
                      <button
                        className="btn-icon text-rose"
                        onClick={() => handleDeleteItem('reading', r.id)}
                        title="Delete Passage"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Speaking Prompts Manager */}
      {activeTab === 'speaking' && (
        <div className="admin-table-card glass-panel">
          <div className="table-top-bar">
            <h3>Speaking Prompts Manager</h3>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { setFormType('speaking'); setFormData({ level: 'B1', duration_seconds: 60 }); setShowAddModal(true); }}
            >
              <Plus size={15} /> Add Speaking Topic
            </button>
          </div>

          <div className="table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Topic Title</th>
                  <th>Category</th>
                  <th>Target Time</th>
                  <th>Level</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {speakingList.map((s) => (
                  <tr key={s.id}>
                    <td className="font-bold text-main">{s.title}</td>
                    <td>{s.category}</td>
                    <td>{s.duration_seconds}s</td>
                    <td><span className="badge-pill badge-indigo">{s.level}</span></td>
                    <td>
                      <button
                        className="btn-icon text-rose"
                        onClick={() => handleDeleteItem('speaking', s.id)}
                        title="Delete Topic"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Content Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="font-bold">Add New {formType.toUpperCase()} Content</h3>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateContent} className="modal-body">
              {formType === 'grammar' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Lesson Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mastered Relative Clauses"
                      className="form-input"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Grammar Topic Category</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Clauses"
                      className="form-input"
                      value={formData.topic || ''}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rule Explanation</label>
                    <textarea
                      required
                      rows={3}
                      className="form-textarea"
                      placeholder="Explain the grammar rule clearly..."
                      value={formData.rule_explanation || ''}
                      onChange={(e) => setFormData({ ...formData, rule_explanation: e.target.value })}
                    />
                  </div>
                </>
              )}

              {formType === 'vocabulary' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Word</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Eloquent"
                      className="form-input"
                      value={formData.word || ''}
                      onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phonetic Notation</label>
                    <input
                      type="text"
                      placeholder="/ˈel.ə.kwənt/"
                      className="form-input"
                      value={formData.phonetic || ''}
                      onChange={(e) => setFormData({ ...formData, phonetic: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Meaning / Definition</label>
                    <textarea
                      required
                      rows={2}
                      className="form-textarea"
                      placeholder="Accurate definition..."
                      value={formData.meaning || ''}
                      onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Example Sentence</label>
                    <input
                      type="text"
                      required
                      placeholder="Example sentence demonstrating usage..."
                      className="form-input"
                      value={formData.example_sentence || ''}
                      onChange={(e) => setFormData({ ...formData, example_sentence: e.target.value })}
                    />
                  </div>
                </>
              )}

              {formType === 'speaking' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Topic Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Describe Your Dream Journey"
                      className="form-input"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Prompt Instructions</label>
                    <textarea
                      required
                      rows={3}
                      className="form-textarea"
                      placeholder="What should the student speak about..."
                      value={formData.prompt || ''}
                      onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    />
                  </div>
                </>
              )}

              {formType === 'reading' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Passage Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. The Future of Sustainable Aviation"
                      className="form-input"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Passage Text</label>
                    <textarea
                      required
                      rows={5}
                      className="form-textarea"
                      placeholder="Full reading passage text..."
                      value={formData.passage_text || ''}
                      onChange={(e) => setFormData({ ...formData, passage_text: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">CEFR Level</label>
                <select
                  className="form-select"
                  value={formData.level || 'B1'}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                >
                  <option value="A1">A1 - Beginner</option>
                  <option value="A2">A2 - Elementary</option>
                  <option value="B1">B1 - Intermediate</option>
                  <option value="B2">B2 - Upper Intermediate</option>
                  <option value="C1">C1 - Advanced</option>
                  <option value="C2">C2 - Proficient</option>
                </select>
              </div>

              <div className="modal-footer mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .admin-view-container {
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
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .view-subtitle {
          font-size: 0.9rem;
          color: var(--text-muted);
        }
        .admin-subtabs {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
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
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
          border-color: #10b981;
        }
        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
        }
        .admin-stat-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
        }
        .astat-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          margin-bottom: 0.4rem;
        }
        .astat-num {
          font-family: var(--font-heading);
          font-size: 2.25rem;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 0.4rem;
        }
        .astat-note {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .cefr-dist-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 1rem;
        }
        .cefr-dist-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1rem;
          text-align: center;
        }
        .cefr-dist-level {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--brand-primary);
          display: block;
        }
        .cefr-dist-count {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .admin-table-card {
          padding: 1.5rem;
        }
        .table-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }
        .admin-data-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .admin-data-table th {
          padding: 0.75rem 1rem;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border-color);
        }
        .admin-data-table td {
          padding: 0.85rem 1rem;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.88rem;
        }
        .student-profile-cell {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }
        .admin-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }
        @media (max-width: 1024px) {
          .admin-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .cefr-dist-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
