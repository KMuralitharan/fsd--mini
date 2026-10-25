import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { triggerCelebration } from '../utils/speech';
import {
  Flame,
  Zap,
  Award,
  Clock,
  CheckCircle2,
  Circle,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  BookOpen,
  Mic,
  Headphones,
  GraduationCap,
  Calendar,
  Layers
} from 'lucide-react';

export default function DashboardView({ onNavigate }) {
  const { user, refreshUser, setShowPlacementModal } = useAuth();
  const [data, setData] = useState(null);
  const [dailyPlan, setDailyPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, planRes] = await Promise.all([
        apiRequest('/student/dashboard'),
        apiRequest('/student/daily-plan')
      ]);
      setData(dashRes);
      setDailyPlan(planRes);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDailyStep = async (stepId, currentStatus) => {
    if (currentStatus) return; // already done
    try {
      await apiRequest('/student/daily-plan/complete-step', 'POST', {
        stepId,
        xpEarned: 50
      });
      triggerCelebration('medium');
      // Reload updated data
      loadDashboard();
      refreshUser();
    } catch (err) {
      console.error('Failed to toggle step:', err);
    }
  };

  if (loading && !data) {
    return (
      <div className="view-loading-state">
        <div className="spinner"></div>
        <p>Calibrating your personalized EnglishConnect dashboard...</p>
      </div>
    );
  }

  const profile = data?.profile || user?.profile || {};
  const skills = data?.skillsMap || {};
  const strongAreas = data?.strongAreas || [];
  const weakAreas = data?.weakAreas || [];
  const recommendation = data?.aiRecommendation || {};
  const recommendedLessons = data?.recommendedLessons || [];
  const recentActivities = data?.recentActivities || [];
  const badges = data?.badges || [];

  return (
    <div className="dashboard-content-wrapper">
      {/* Welcome Banner */}
      <div className="welcome-banner glass-panel">
        <div className="welcome-text-side">
          <div className="welcome-pill">
            <Sparkles size={14} className="text-indigo" />
            <span>AI Learning Journey Active</span>
          </div>
          <h1 className="welcome-heading">
            Welcome back, <span className="brand-gradient-text">{user?.full_name?.split(' ')[0] || 'Scholar'}</span>!
          </h1>
          <p className="welcome-subtext">
            You're on a <strong className="text-orange">{profile.current_streak || 12}-day streak</strong>. Today’s goal: 
            complete your 4-step focus plan to elevate fluency toward level <strong>B2</strong>.
          </p>
          <div className="welcome-cta-row">
            <button className="btn btn-primary" onClick={() => onNavigate('speaking')}>
              <Mic size={17} /> Practice Speaking Now
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('conversation')}>
              <Sparkles size={17} className="text-indigo" /> Talk with AI
            </button>
          </div>
        </div>

        <div className="welcome-level-card">
          <div className="cefr-badge-large" onClick={() => setShowPlacementModal(true)} title="Click to retake Placement Assessment">
            <span className="cefr-badge-sub">CEFR LEVEL</span>
            <span className="cefr-badge-main">{profile.english_level || 'B1'}</span>
            <span className="cefr-badge-retake">Tap to Recalibrate</span>
          </div>
          <div className="level-xp-progress">
            <div className="level-xp-header">
              <span>Overall Progress</span>
              <span className="font-bold text-main">{data?.overallProgress || 76}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${data?.overallProgress || 76}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="stats-grid-row">
        <div className="metric-card glass-panel">
          <div className="metric-card-top">
            <span className="metric-title">CURRENT STREAK</span>
            <div className="metric-icon-box bg-orange-soft">
              <Flame size={20} className="flame-icon animated-flame" />
            </div>
          </div>
          <div className="metric-value-row">
            <span className="metric-big-num">{profile.current_streak || 12}</span>
            <span className="metric-unit">Days</span>
          </div>
          <span className="metric-footnote text-emerald">🔥 In top 8% of active learners</span>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-card-top">
            <span className="metric-title">TOTAL EXPERIENCE</span>
            <div className="metric-icon-box bg-indigo-soft">
              <Zap size={20} className="text-indigo" />
            </div>
          </div>
          <div className="metric-value-row">
            <span className="metric-big-num">{(profile.total_xp || 2450).toLocaleString()}</span>
            <span className="metric-unit">XP</span>
          </div>
          <span className="metric-footnote">Level {profile.level_number || 4} Scholar</span>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-card-top">
            <span className="metric-title">DAILY STUDY GOAL</span>
            <div className="metric-icon-box bg-emerald-soft">
              <Clock size={20} className="text-emerald" />
            </div>
          </div>
          <div className="metric-value-row">
            <span className="metric-big-num">{profile.daily_goal_minutes || 20}</span>
            <span className="metric-unit">Minutes</span>
          </div>
          <span className="metric-footnote text-emerald">Active today: 15 / 20 min</span>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-card-top">
            <span className="metric-title">BADGES UNLOCKED</span>
            <div className="metric-icon-box bg-amber-soft">
              <Award size={20} className="text-amber" />
            </div>
          </div>
          <div className="metric-value-row">
            <span className="metric-big-num">{badges.length || 4}</span>
            <span className="metric-unit">/ 8</span>
          </div>
          <span className="metric-footnote text-indigo">Next: Fortnight Master (14d)</span>
        </div>
      </div>

      {/* Main 2-Column Split: Daily Learning Plan & AI Diagnostics */}
      <div className="dashboard-main-columns">
        {/* Left Column: Daily Learning Plan */}
        <div className="dashboard-column">
          <div className="glass-panel card-section">
            <div className="section-header-row">
              <div className="section-title-wrap">
                <Calendar size={18} className="text-indigo" />
                <h3>Today's Learning Plan</h3>
              </div>
              <span className="badge-pill badge-indigo">
                {dailyPlan?.completedCount || 0} of {dailyPlan?.plan?.length || 4} Completed
              </span>
            </div>

            <p className="section-description">
              AI-generated curriculum tailored to balance your active skills across 40 minutes today.
            </p>

            <div className="daily-plan-items-list">
              {dailyPlan?.plan?.map((step) => (
                <div 
                  key={step.id} 
                  className={`plan-item-row ${step.completed ? 'plan-item-completed' : ''}`}
                >
                  <button 
                    className="plan-check-btn"
                    onClick={() => handleToggleDailyStep(step.id, step.completed)}
                    title={step.completed ? 'Completed' : 'Click to complete step'}
                  >
                    {step.completed ? (
                      <CheckCircle2 size={22} className="text-emerald check-completed" />
                    ) : (
                      <Circle size={22} className="text-muted check-empty" />
                    )}
                  </button>

                  <div className="plan-item-info" onClick={() => onNavigate(step.path.replace('/', ''))}>
                    <div className="plan-item-top">
                      <span className="plan-item-title">{step.title}</span>
                      <span className="plan-item-duration">{step.durationMinutes} min</span>
                    </div>
                    <p className="plan-item-desc">{step.description}</p>
                  </div>

                  <div className="plan-item-reward">
                    <span className="badge-pill badge-amber">+{step.xpReward} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Lessons */}
          <div className="glass-panel card-section mt-6">
            <div className="section-header-row">
              <div className="section-title-wrap">
                <Sparkles size={18} className="text-amber" />
                <h3>AI Recommended Lessons</h3>
              </div>
            </div>

            <div className="recommended-list">
              {recommendedLessons.map((lesson) => (
                <div key={lesson.id} className="rec-lesson-card">
                  <div className="rec-lesson-left">
                    <div className="rec-category-tag">{lesson.category}</div>
                    <h4 className="rec-title">{lesson.title}</h4>
                    <span className="rec-meta">{lesson.duration} • +{lesson.xp} XP</span>
                  </div>
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => onNavigate(lesson.path.replace('/', ''))}
                  >
                    Start <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Skill Breakdown, Weak/Strong Areas, Badges */}
        <div className="dashboard-column">
          {/* AI Skill Diagnostic Card */}
          <div className="glass-panel card-section">
            <div className="section-header-row">
              <div className="section-title-wrap">
                <TrendingUp size={18} className="text-indigo" />
                <h3>Active Skill Diagnostics</h3>
              </div>
              <span className="badge-pill badge-emerald">Real-time</span>
            </div>

            {/* AI Recommendation Banner */}
            <div className="ai-insight-banner">
              <div className="ai-insight-header">
                <Sparkles size={16} className="text-indigo" />
                <span className="font-bold">{recommendation.title || 'AI Recommendation'}</span>
              </div>
              <p className="ai-insight-text">{recommendation.message}</p>
            </div>

            {/* Weak Areas & Strong Areas Comparison */}
            <div className="strengths-weakness-grid">
              <div className="sw-box strong-box">
                <span className="sw-box-title text-emerald">
                  <CheckCircle2 size={15} /> STRONG AREAS
                </span>
                {strongAreas.map((s, idx) => (
                  <div key={idx} className="sw-item">
                    <span className="sw-name">{s.skill}</span>
                    <span className="sw-pct text-emerald">{s.score}%</span>
                  </div>
                ))}
              </div>

              <div className="sw-box weak-box">
                <span className="sw-box-title text-rose">
                  <AlertTriangle size={15} /> WEAK AREAS
                </span>
                {weakAreas.map((w, idx) => (
                  <div key={idx} className="sw-item">
                    <span className="sw-name">{w.skill}</span>
                    <span className="sw-pct text-rose">{w.score}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Bars */}
            <div className="skills-meter-list mt-4">
              {Object.entries(skills).map(([skill, score]) => (
                <div key={skill} className="skill-meter-row">
                  <div className="skill-meter-labels">
                    <span className="skill-name capitalize">{skill}</span>
                    <span className="skill-score">{score}%</span>
                  </div>
                  <div className="meter-track">
                    <div 
                      className={`meter-fill ${score >= 80 ? 'fill-emerald' : score < 70 ? 'fill-rose' : 'fill-indigo'}`}
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Badges Showcase */}
          <div className="glass-panel card-section mt-6">
            <div className="section-header-row">
              <div className="section-title-wrap">
                <Award size={18} className="text-amber" />
                <h3>Recent Badges</h3>
              </div>
              <button className="text-link-sm" onClick={() => onNavigate('challenges')}>
                View All
              </button>
            </div>

            <div className="badges-mini-grid">
              {badges.slice(0, 4).map((badge) => (
                <div key={badge.id} className="badge-mini-card" title={badge.description}>
                  <div className="badge-mini-icon-circle">
                    <Award size={20} className="text-amber" />
                  </div>
                  <span className="badge-mini-name">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-content-wrapper {
          padding: 1.75rem 2rem;
          max-width: 1350px;
          margin: 0 auto;
        }
        .welcome-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2rem 2.25rem;
          margin-bottom: 1.75rem;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%), var(--bg-card);
        }
        .welcome-text-side {
          max-width: 650px;
        }
        .welcome-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.25rem 0.75rem;
          background: rgba(99, 102, 241, 0.12);
          border: 1px solid rgba(99, 102, 241, 0.25);
          border-radius: var(--radius-full);
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--brand-primary);
          margin-bottom: 0.85rem;
        }
        .welcome-heading {
          font-size: 2.1rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          line-height: 1.2;
        }
        .welcome-subtext {
          font-size: 1rem;
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }
        .welcome-cta-row {
          display: flex;
          gap: 0.85rem;
          flex-wrap: wrap;
        }
        .welcome-level-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.25rem 1.75rem;
          min-width: 220px;
        }
        .cefr-badge-large {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: transform var(--transition-fast);
        }
        .cefr-badge-large:hover {
          transform: scale(1.05);
        }
        .cefr-badge-sub {
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.08em;
        }
        .cefr-badge-main {
          font-family: var(--font-heading);
          font-size: 2.75rem;
          font-weight: 800;
          background: var(--brand-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1;
        }
        .cefr-badge-retake {
          font-size: 0.7rem;
          color: var(--brand-primary);
          margin-top: 0.2rem;
          text-decoration: underline;
        }
        .level-xp-progress {
          width: 100%;
        }
        .level-xp-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 0.35rem;
        }
        .stats-grid-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
          margin-bottom: 1.75rem;
        }
        .metric-card {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
        }
        .metric-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }
        .metric-title {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }
        .metric-icon-box {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bg-orange-soft { background: rgba(249, 115, 22, 0.12); }
        .bg-indigo-soft { background: rgba(99, 102, 241, 0.12); }
        .bg-emerald-soft { background: rgba(16, 185, 129, 0.12); }
        .bg-amber-soft { background: rgba(245, 158, 11, 0.12); }
        .metric-value-row {
          display: flex;
          align-items: baseline;
          gap: 0.35rem;
          margin-bottom: 0.35rem;
        }
        .metric-big-num {
          font-family: var(--font-heading);
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-main);
          line-height: 1;
        }
        .metric-unit {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        .metric-footnote {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .dashboard-main-columns {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 1.5rem;
        }
        .card-section {
          padding: 1.5rem;
        }
        .section-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .section-title-wrap {
          display: flex;
          align-items: center;
          gap: 0.55rem;
        }
        .section-title-wrap h3 {
          font-size: 1.15rem;
        }
        .section-description {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 1.25rem;
        }
        .daily-plan-items-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .plan-item-row {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.85rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }
        .plan-item-row:hover {
          border-color: var(--border-focus);
          transform: translateY(-1px);
        }
        .plan-item-completed {
          opacity: 0.75;
          background: rgba(16, 185, 129, 0.05);
          border-color: rgba(16, 185, 129, 0.25);
        }
        .plan-check-btn {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .plan-item-info {
          flex: 1;
          cursor: pointer;
        }
        .plan-item-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.2rem;
        }
        .plan-item-title {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-main);
        }
        .plan-item-duration {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        .plan-item-desc {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.35;
        }
        .mt-6 { margin-top: 1.5rem; }
        .recommended-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .rec-lesson-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }
        .rec-category-tag {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--brand-primary);
          text-transform: uppercase;
        }
        .rec-title {
          font-size: 0.95rem;
          font-weight: 600;
          margin: 0.15rem 0;
        }
        .rec-meta {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .ai-insight-banner {
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.25);
          border-radius: var(--radius-md);
          padding: 0.85rem 1rem;
          margin-bottom: 1.25rem;
        }
        .ai-insight-header {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.88rem;
          color: var(--brand-primary);
          margin-bottom: 0.25rem;
        }
        .ai-insight-text {
          font-size: 0.82rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }
        .strengths-weakness-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .sw-box {
          padding: 0.75rem;
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
        }
        .strong-box { border-left: 3px solid #10b981; }
        .weak-box { border-left: 3px solid #f43f5e; }
        .sw-box-title {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          margin-bottom: 0.4rem;
        }
        .sw-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          padding: 0.2rem 0;
        }
        .sw-name { color: var(--text-secondary); }
        .sw-pct { font-weight: 700; }
        .skill-meter-row {
          margin-bottom: 0.75rem;
        }
        .skill-meter-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          margin-bottom: 0.25rem;
        }
        .capitalize { text-transform: capitalize; }
        .skill-score { font-weight: 700; }
        .meter-track {
          height: 6px;
          background: var(--bg-secondary);
          border-radius: 999px;
          overflow: hidden;
        }
        .meter-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.4s ease;
        }
        .fill-emerald { background: var(--accent-emerald); }
        .fill-rose { background: var(--accent-rose); }
        .fill-indigo { background: var(--brand-primary); }
        .badges-mini-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
        }
        .badge-mini-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.75rem 0.4rem;
        }
        .badge-mini-icon-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(245, 158, 11, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.35rem;
        }
        .badge-mini-name {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-main);
          line-height: 1.2;
        }
        .text-orange { color: #f97316; }
        .text-link-sm {
          font-size: 0.8rem;
          color: var(--brand-primary);
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 600;
        }
        @media (max-width: 1024px) {
          .stats-grid-row {
            grid-template-columns: repeat(2, 1fr);
          }
          .dashboard-main-columns {
            grid-template-columns: 1fr;
          }
          .welcome-banner {
            flex-direction: column;
            gap: 1.5rem;
          }
        }
        @media (max-width: 600px) {
          .dashboard-content-wrapper {
            padding: 1rem;
          }
          .stats-grid-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
