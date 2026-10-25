import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import {
  BarChart3,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  Zap,
  Target
} from 'lucide-react';

export default function AnalyticsView({ onNavigate }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/student/analytics');
      setAnalytics(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="view-loading-state">
        <div className="spinner"></div>
        <p>Synthesizing your multi-skill fluency analytics...</p>
      </div>
    );
  }

  const skills = analytics?.skills || [];
  const weeklyStudy = analytics?.weeklyStudyHours || [];
  const levelHistory = analytics?.levelHistory || [];
  const weakAreas = analytics?.weakAreas || [];
  const strongAreas = analytics?.strongAreas || [];
  const maxWeeklyMinutes = Math.max(...weeklyStudy.map(w => w.minutes), 45);

  return (
    <div className="analytics-view-container">
      <div className="view-title-block">
        <div className="title-icon-badge">
          <BarChart3 size={24} className="text-indigo" />
        </div>
        <div>
          <h2>Fluency Analytics & AI Recommendations</h2>
          <p className="view-subtitle">
            Comprehensive diagnostic analysis tracking Speaking, Listening, Reading, Writing, Grammar, Vocabulary, and Pronunciation.
          </p>
        </div>
      </div>

      {/* AI Action Plan Strategic Callout */}
      <div className="ai-plan-banner glass-panel">
        <div className="ai-plan-icon-wrap">
          <Sparkles size={24} className="text-amber" />
        </div>
        <div className="ai-plan-text">
          <h3 className="ai-plan-title">AI Personalized Study Plan</h3>
          <p className="ai-plan-body">{analytics?.aiActionPlan}</p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('grammar')}>
          Launch Tenses Path <ArrowRight size={15} />
        </button>
      </div>

      {/* 2-Column Grid */}
      <div className="analytics-layout-grid">
        {/* Left Column: 7 Skills Diagnostic Spectrum */}
        <div className="analytics-col">
          <div className="glass-panel pane-card">
            <div className="card-header-row">
              <div className="card-title-group">
                <Target size={18} className="text-indigo" />
                <h3>7-Core Skill Competency Spectrum</h3>
              </div>
              <span className="badge-pill badge-indigo">CEFR Mapped</span>
            </div>

            <div className="skills-spectrum-list">
              {skills.map((s, idx) => (
                <div key={idx} className="spectrum-skill-row">
                  <div className="spectrum-top">
                    <div className="spectrum-name-group">
                      <span className="spectrum-name">{s.skill}</span>
                      <span className="spectrum-benchmark text-muted">({s.benchmarks})</span>
                    </div>
                    <span className="spectrum-score" style={{ color: s.color }}>{s.score}%</span>
                  </div>

                  <div className="progress-track spectrum-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${s.score}%`, backgroundColor: s.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Practice Rhythm Chart */}
          <div className="glass-panel pane-card mt-6">
            <div className="card-header-row">
              <div className="card-title-group">
                <Calendar size={18} className="text-emerald" />
                <h3>Weekly Study Rhythm</h3>
              </div>
              <span className="text-muted text-xs">Total: 210 minutes</span>
            </div>

            <div className="weekly-bar-chart">
              {weeklyStudy.map((d, i) => {
                const heightPercent = Math.round((d.minutes / maxWeeklyMinutes) * 100);
                return (
                  <div key={i} className="bar-column-wrap">
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ height: `${heightPercent}%` }}
                        title={`${d.day}: ${d.minutes} min, +${d.xp} XP`}
                      >
                        <span className="bar-val-tooltip">{d.minutes}m</span>
                      </div>
                    </div>
                    <span className="bar-day-label">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Strengths vs Weaknesses & CEFR Timeline */}
        <div className="analytics-col">
          {/* Diagnostic Breakdown */}
          <div className="glass-panel pane-card">
            <h3 className="card-section-title mb-4">Diagnostic Strengths vs Weaknesses</h3>

            {/* Strong Areas */}
            <div className="sw-box strong-box mb-4">
              <span className="sw-box-title text-emerald">
                <CheckCircle2 size={16} /> STRONG AREAS (&gt;80%)
              </span>
              <div className="sw-items-col">
                {strongAreas.map((sa, i) => (
                  <div key={i} className="sw-detail-row">
                    <span className="font-bold text-main">{sa.area}</span>
                    <span className="sw-badge-score text-emerald">{sa.score}%</span>
                    <p className="text-xs text-muted mt-1">{sa.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Weak Areas */}
            <div className="sw-box weak-box">
              <span className="sw-box-title text-rose">
                <AlertTriangle size={16} /> WEAK AREAS (&lt;70%)
              </span>
              <div className="sw-items-col">
                {weakAreas.map((wa, i) => (
                  <div key={i} className="sw-detail-row">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-main">{wa.area}</span>
                      <span className="sw-badge-score text-rose">{wa.score}%</span>
                    </div>
                    <p className="text-xs text-secondary mt-1">
                      <strong>AI Tip:</strong> {wa.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CEFR Level Timeline */}
          <div className="glass-panel pane-card mt-6">
            <div className="card-header-row">
              <div className="card-title-group">
                <TrendingUp size={18} className="text-indigo" />
                <h3>CEFR Proficiency Timeline</h3>
              </div>
            </div>

            <div className="timeline-trail">
              {levelHistory.map((step, i) => (
                <div key={i} className="timeline-node">
                  <div className="node-marker-wrap">
                    <div className="node-circle active-node">
                      <span>{step.level}</span>
                    </div>
                    {i < levelHistory.length - 1 && <div className="node-line"></div>}
                  </div>
                  <div className="node-info">
                    <span className="node-month">{step.month}</span>
                    <span className="node-label">{step.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .analytics-view-container {
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
        .ai-plan-banner {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem 2rem;
          margin-bottom: 1.75rem;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%), var(--bg-card);
          border-left: 4px solid var(--brand-primary);
        }
        .ai-plan-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-md);
          background: rgba(245, 158, 11, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ai-plan-text {
          flex: 1;
        }
        .ai-plan-title {
          font-size: 1.15rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }
        .ai-plan-body {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.45;
        }
        .analytics-layout-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 1.5rem;
        }
        .pane-card {
          padding: 1.5rem;
        }
        .card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }
        .card-title-group {
          display: flex;
          align-items: center;
          gap: 0.55rem;
        }
        .card-title-group h3 {
          font-size: 1.15rem;
        }
        .skills-spectrum-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .spectrum-skill-row {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .spectrum-top {
          display: flex;
          justify-content: space-between;
          font-size: 0.88rem;
        }
        .spectrum-name {
          font-weight: 700;
          color: var(--text-main);
        }
        .spectrum-benchmark {
          margin-left: 0.45rem;
          font-size: 0.78rem;
        }
        .spectrum-score {
          font-weight: 800;
        }
        .spectrum-track {
          height: 7px;
        }
        .weekly-bar-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          height: 160px;
          padding: 1.5rem 0 0.5rem;
          gap: 0.75rem;
        }
        .bar-column-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }
        .bar-track {
          flex: 1;
          width: 28px;
          display: flex;
          align-items: flex-end;
          background: var(--bg-secondary);
          border-radius: 6px;
          overflow: hidden;
        }
        .bar-fill {
          width: 100%;
          background: var(--brand-gradient);
          border-radius: 6px;
          transition: height 0.5s ease;
          position: relative;
        }
        .bar-val-tooltip {
          position: absolute;
          top: -22px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-muted);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .bar-column-wrap:hover .bar-val-tooltip {
          opacity: 1;
        }
        .bar-day-label {
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-top: 0.5rem;
          font-weight: 600;
        }
        .card-section-title {
          font-size: 1.1rem;
        }
        .mb-4 { margin-bottom: 1rem; }
        .mt-6 { margin-top: 1.5rem; }
        .sw-box {
          padding: 1rem;
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
        }
        .strong-box { border-left: 3px solid #10b981; }
        .weak-box { border-left: 3px solid #f43f5e; }
        .sw-box-title {
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 0.75rem;
        }
        .sw-items-col {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .sw-detail-row {
          background: var(--bg-card);
          padding: 0.65rem 0.85rem;
          border-radius: var(--radius-sm);
        }
        .sw-badge-score {
          font-weight: 800;
          font-size: 0.9rem;
          float: right;
        }
        .timeline-trail {
          display: flex;
          flex-direction: column;
          gap: 0;
          padding-left: 0.5rem;
        }
        .timeline-node {
          display: flex;
          gap: 1rem;
          position: relative;
        }
        .node-marker-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .node-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--bg-secondary);
          border: 2px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.85rem;
          color: var(--text-main);
          z-index: 2;
        }
        .active-node {
          background: var(--brand-gradient);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 0 12px var(--brand-glow);
        }
        .node-line {
          width: 2px;
          height: 36px;
          background: var(--border-color);
          margin: 2px 0;
        }
        .node-info {
          padding-top: 6px;
        }
        .node-month {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 700;
          display: block;
        }
        .node-label {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-main);
        }
        @media (max-width: 900px) {
          .analytics-layout-grid {
            grid-template-columns: 1fr;
          }
          .ai-plan-banner {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
