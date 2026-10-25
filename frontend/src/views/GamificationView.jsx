import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  Trophy,
  Flame,
  Zap,
  Award,
  CheckCircle,
  Clock,
  Sparkles,
  Lock,
  Star,
  Users,
  Calendar,
  Mic,
  BookOpen
} from 'lucide-react';

export default function GamificationView() {
  const { user } = useAuth();
  const [badges, setBadges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [activeTab, setActiveTab] = useState('badges'); // 'badges' | 'leaderboard' | 'challenges'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGamificationData();
  }, []);

  const loadGamificationData = async () => {
    setLoading(true);
    try {
      const [badgesRes, leadRes, challRes] = await Promise.all([
        apiRequest('/gamification/badges'),
        apiRequest('/gamification/leaderboard'),
        apiRequest('/gamification/challenges')
      ]);
      setBadges(badgesRes.badges || []);
      setLeaderboard(leadRes.leaderboard || []);
      setChallenges(challRes.challenges || []);
    } catch (err) {
      console.error('Failed to load gamification data:', err);
    } finally {
      setLoading(false);
    }
  };

  const profile = user?.profile || {};
  const currentXp = profile.total_xp || 2450;
  const currentStreak = profile.current_streak || 12;
  const scholarLevel = profile.level_number || 4;

  return (
    <div className="gamification-view-container">
      <div className="view-title-block">
        <div className="title-icon-badge">
          <Trophy size={24} className="text-amber" />
        </div>
        <div>
          <h2>Gamification, Badges & Leaderboard</h2>
          <p className="view-subtitle">
            Celebrate daily consistency, unlock prestigious fluency credentials, and climb the international scholar rankings.
          </p>
        </div>
      </div>

      {/* Gamification Trophy Ribbon */}
      <div className="hero-gamify-banner glass-panel">
        <div className="hero-stat-item">
          <div className="hero-icon-box bg-orange-soft">
            <Flame size={24} className="flame-icon animated-flame" />
          </div>
          <div>
            <span className="hero-stat-val">{currentStreak} Days</span>
            <span className="hero-stat-lbl">Active Streak</span>
          </div>
        </div>

        <div className="hero-stat-divider"></div>

        <div className="hero-stat-item">
          <div className="hero-icon-box bg-indigo-soft">
            <Zap size={24} className="text-indigo" />
          </div>
          <div>
            <span className="hero-stat-val">{currentXp.toLocaleString()} XP</span>
            <span className="hero-stat-lbl">Level {scholarLevel} Scholar</span>
          </div>
        </div>

        <div className="hero-stat-divider"></div>

        <div className="hero-stat-item">
          <div className="hero-icon-box bg-amber-soft">
            <Award size={24} className="text-amber" />
          </div>
          <div>
            <span className="hero-stat-val">
              {badges.filter(b => b.is_unlocked).length} / {badges.length}
            </span>
            <span className="hero-stat-lbl">Badges Unlocked</span>
          </div>
        </div>
      </div>

      {/* Subtabs */}
      <div className="gamify-subtabs">
        <button
          className={`subtab-btn ${activeTab === 'badges' ? 'active' : ''}`}
          onClick={() => setActiveTab('badges')}
        >
          <Award size={16} /> Badges Showcase ({badges.filter(b => b.is_unlocked).length})
        </button>
        <button
          className={`subtab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <Users size={16} /> Global Leaderboard
        </button>
        <button
          className={`subtab-btn ${activeTab === 'challenges' ? 'active' : ''}`}
          onClick={() => setActiveTab('challenges')}
        >
          <Calendar size={16} /> Daily Challenges
        </button>
      </div>

      {/* 1. Badges Showcase */}
      {activeTab === 'badges' && (
        <div className="badges-gallery-grid">
          {badges.map((b) => {
            const unlocked = Boolean(b.is_unlocked);
            return (
              <div key={b.id} className={`badge-master-card glass-panel ${unlocked ? 'unlocked' : 'locked'}`}>
                <div className="badge-card-icon-wrap">
                  <div className={`badge-halo ${unlocked ? 'halo-active' : 'halo-inactive'}`}>
                    {unlocked ? (
                      <Award size={34} className="badge-svg-icon" />
                    ) : (
                      <Lock size={26} className="text-muted" />
                    )}
                  </div>
                </div>

                <div className="badge-meta-block">
                  <div className="badge-status-row">
                    <span className="badge-cat-label">{b.category}</span>
                    {unlocked ? (
                      <span className="badge-pill badge-emerald">Unlocked</span>
                    ) : (
                      <span className="badge-pill badge-secondary">Locked</span>
                    )}
                  </div>
                  <h4 className="badge-heading">{b.name}</h4>
                  <p className="badge-rule-desc">{b.description}</p>
                </div>

                <div className="badge-criteria-footer">
                  {unlocked ? (
                    <span className="text-xs text-emerald flex items-center gap-1 font-semibold">
                      <CheckCircle size={13} /> Acquired
                    </span>
                  ) : (
                    <span className="text-xs text-muted">
                      Requires: {b.xp_required > 0 ? `${b.xp_required} XP` : `${b.streak_required}-Day Streak`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Global Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="leaderboard-table-card glass-panel">
          <div className="table-top-bar">
            <h3>Top EnglishConnect Scholars</h3>
            <span className="text-sm text-muted">Ranked by cumulative practice XP</span>
          </div>

          <div className="table-responsive">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Scholar</th>
                  <th>CEFR Level</th>
                  <th>Streak</th>
                  <th>Total Experience</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((item) => (
                  <tr key={item.user_id} className={item.isCurrentUser ? 'current-user-row' : ''}>
                    <td className="rank-cell">
                      {item.rank === 1 ? '🥇 1' : item.rank === 2 ? '🥈 2' : item.rank === 3 ? '🥉 3' : `#${item.rank}`}
                    </td>
                    <td>
                      <div className="scholar-user-cell">
                        <img src={item.avatar} alt={item.full_name} className="scholar-avatar" />
                        <div>
                          <span className="scholar-name">{item.full_name}</span>
                          {item.isCurrentUser && <span className="badge-pill badge-indigo ml-2">You</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge-pill badge-indigo">{item.english_level}</span>
                    </td>
                    <td>
                      <span className="streak-tag">
                        <Flame size={14} className="text-orange" /> {item.current_streak}d
                      </span>
                    </td>
                    <td className="font-bold text-main">
                      {item.total_xp.toLocaleString()} XP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Daily Challenges */}
      {activeTab === 'challenges' && (
        <div className="challenges-wrapper glass-panel">
          <div className="challenges-header">
            <h3>Today's Focus Quests</h3>
            <span className="badge-pill badge-emerald">Resets in 6h 25m</span>
          </div>

          <div className="challenges-list">
            {challenges.map((c) => (
              <div key={c.id} className={`challenge-row-card ${c.completed ? 'completed' : ''}`}>
                <div className="challenge-icon-box">
                  {c.completed ? (
                    <CheckCircle size={22} className="text-emerald" />
                  ) : (
                    <Clock size={22} className="text-amber" />
                  )}
                </div>

                <div className="challenge-info">
                  <div className="challenge-title-row">
                    <h4 className="challenge-name">{c.title}</h4>
                    <span className="badge-pill badge-amber">+{c.xpReward} XP</span>
                  </div>
                  <p className="challenge-desc">{c.description}</p>
                  <div className="challenge-progress-line">
                    <div className="progress-track">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${Math.min((c.current / c.target) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="progress-fraction">{c.current} / {c.target}</span>
                  </div>
                </div>

                <div className="challenge-action-col">
                  {c.completed ? (
                    <span className="badge-pill badge-emerald">Claimed</span>
                  ) : (
                    <span className="badge-pill badge-secondary">In Progress</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .gamification-view-container {
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
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .view-subtitle {
          font-size: 0.9rem;
          color: var(--text-muted);
        }
        .hero-gamify-banner {
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 1.5rem 2rem;
          margin-bottom: 1.75rem;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%), var(--bg-card);
        }
        .hero-stat-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .hero-icon-box {
          width: 50px;
          height: 50px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hero-stat-val {
          font-family: var(--font-heading);
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-main);
          display: block;
          line-height: 1.1;
        }
        .hero-stat-lbl {
          font-size: 0.78rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .hero-stat-divider {
          width: 1px;
          height: 45px;
          background: var(--border-color);
        }
        .gamify-subtabs {
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
        .badges-gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.25rem;
        }
        .badge-master-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
        }
        .badge-master-card.locked {
          opacity: 0.65;
        }
        .badge-card-icon-wrap {
          margin-bottom: 1rem;
        }
        .badge-halo {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .halo-active {
          background: rgba(245, 158, 11, 0.15);
          border: 2px solid rgba(245, 158, 11, 0.4);
          box-shadow: 0 0 20px rgba(245, 158, 11, 0.25);
        }
        .badge-svg-icon {
          color: #f59e0b;
        }
        .halo-inactive {
          background: var(--bg-secondary);
          border: 2px dashed var(--border-color);
        }
        .badge-meta-block {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }
        .badge-status-row {
          display: flex;
          justify-content: space-between;
          width: 100%;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .badge-cat-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .badge-heading {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 0.35rem;
          color: var(--text-main);
        }
        .badge-rule-desc {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.35;
          margin-bottom: 1rem;
        }
        .badge-criteria-footer {
          width: 100%;
          border-top: 1px solid var(--border-color);
          padding-top: 0.65rem;
        }
        .leaderboard-table-card {
          padding: 1.5rem;
        }
        .table-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }
        .table-responsive {
          overflow-x: auto;
        }
        .leaderboard-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .leaderboard-table th {
          padding: 0.75rem 1rem;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border-color);
        }
        .leaderboard-table td {
          padding: 0.9rem 1rem;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.9rem;
        }
        .current-user-row {
          background: rgba(99, 102, 241, 0.12);
        }
        .rank-cell {
          font-weight: 800;
          font-size: 1rem;
        }
        .scholar-user-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .scholar-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1.5px solid var(--brand-primary);
        }
        .scholar-name {
          font-weight: 600;
          color: var(--text-main);
        }
        .streak-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-weight: 600;
        }
        .challenges-wrapper {
          padding: 1.5rem;
        }
        .challenges-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }
        .challenges-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .challenge-row-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }
        .challenge-row-card.completed {
          opacity: 0.8;
          border-color: rgba(16, 185, 129, 0.3);
        }
        .challenge-info {
          flex: 1;
        }
        .challenge-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }
        .challenge-name {
          font-size: 0.95rem;
          font-weight: 700;
        }
        .challenge-desc {
          font-size: 0.82rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }
        .challenge-progress-line {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .challenge-progress-line .progress-track {
          flex: 1;
          height: 6px;
        }
        .progress-fraction {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
