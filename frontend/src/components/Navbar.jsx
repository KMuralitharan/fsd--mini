import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Flame, 
  Zap, 
  Sun, 
  Moon, 
  LogOut, 
  Menu, 
  Award,
  Sparkles,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export default function Navbar({ onToggleSidebar, activeTab, setActiveTab }) {
  const { user, logout, theme, toggleTheme, setShowPlacementModal } = useAuth();

  const profile = user?.profile || {};
  const englishLevel = profile.english_level || 'B1';
  const totalXp = profile.total_xp || 2450;
  const streak = profile.current_streak || 12;

  return (
    <header className="navbar-wrapper">
      <div className="navbar-left">
        <button 
          className="btn-icon mobile-menu-btn" 
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <Menu size={22} />
        </button>

        <div className="brand-logo" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
          <div className="logo-icon-bg">
            <Sparkles size={20} className="logo-sparkle" />
          </div>
          <div className="logo-text-group">
            <span className="brand-name">English<span className="brand-gradient-text">Connect</span></span>
            <span className="brand-tagline">AI Fluency Platform</span>
          </div>
        </div>
      </div>

      <div className="navbar-right">
        {user?.role === 'student' && (
          <>
            {/* Level Pill */}
            <div 
              className="stat-pill level-pill" 
              onClick={() => setShowPlacementModal(true)}
              title="Click to retake CEFR Placement Test"
              style={{ cursor: 'pointer' }}
            >
              <Award size={16} className="text-indigo" />
              <span className="stat-label">Level:</span>
              <span className="stat-value level-highlight">{englishLevel}</span>
            </div>

            {/* Streak Counter */}
            <div className="stat-pill streak-pill" title={`${streak} Day Learning Streak!`}>
              <Flame size={17} className="flame-icon animated-flame" />
              <span className="stat-value">{streak}</span>
              <span className="stat-label">days</span>
            </div>

            {/* XP Counter */}
            <div className="stat-pill xp-pill" title="Total Experience Points">
              <Zap size={16} className="text-amber" />
              <span className="stat-value">{totalXp.toLocaleString()}</span>
              <span className="stat-label">XP</span>
            </div>
          </>
        )}

        {user?.role === 'admin' && (
          <div className="stat-pill admin-pill">
            <ShieldCheck size={16} className="text-emerald" />
            <span className="stat-value">Admin Portal</span>
          </div>
        )}

        {/* Dark/Light Mode Switcher */}
        <button 
          className="btn-icon theme-toggle-btn" 
          onClick={toggleTheme} 
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={19} className="text-amber" /> : <Moon size={19} className="text-indigo" />}
        </button>

        {/* User Profile Pill & Logout */}
        <div className="user-profile-widget">
          <img 
            src={user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user?.full_name || 'User')}`} 
            alt={user?.full_name} 
            className="user-avatar-small"
          />
          <div className="user-info-text">
            <span className="user-name-label">{user?.full_name}</span>
            <span className="user-role-label">{user?.role === 'admin' ? 'Administrator' : `CEFR ${englishLevel} Learner`}</span>
          </div>
          <button 
            className="btn-icon logout-btn" 
            onClick={logout} 
            title="Sign Out"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>

      <style>{`
        .navbar-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 2rem;
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 40;
          transition: background-color var(--transition-normal), border-color var(--transition-normal);
        }
        .navbar-left, .navbar-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          user-select: none;
        }
        .logo-icon-bg {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          background: var(--brand-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: 0 4px 12px var(--brand-glow);
        }
        .logo-text-group {
          display: flex;
          flex-direction: column;
        }
        .brand-name {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.25rem;
          letter-spacing: -0.02em;
          color: var(--text-main);
          line-height: 1.1;
        }
        .brand-gradient-text {
          background: var(--brand-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .brand-tagline {
          font-size: 0.68rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .stat-pill {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          padding: 0.35rem 0.85rem;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          transition: transform var(--transition-fast), border-color var(--transition-fast);
        }
        .stat-pill:hover {
          border-color: var(--border-focus);
          transform: translateY(-1px);
        }
        .stat-label {
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 500;
        }
        .stat-value {
          font-weight: 700;
          color: var(--text-main);
        }
        .level-highlight {
          color: var(--brand-primary);
          background: rgba(99, 102, 241, 0.12);
          padding: 0.1rem 0.45rem;
          border-radius: 6px;
        }
        .flame-icon {
          color: #f97316;
        }
        .animated-flame {
          animation: flameWiggle 2s infinite ease-in-out;
        }
        @keyframes flameWiggle {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.15) rotate(5deg); }
        }
        .text-indigo { color: var(--brand-primary); }
        .text-amber { color: var(--accent-amber); }
        .text-emerald { color: var(--accent-emerald); }
        .user-profile-widget {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.25rem 0.65rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
        }
        .user-avatar-small {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          border: 1.5px solid var(--brand-primary);
        }
        .user-info-text {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
          text-align: left;
        }
        .user-name-label {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-main);
        }
        .user-role-label {
          font-size: 0.7rem;
          color: var(--text-muted);
        }
        .btn-icon {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.4rem;
          border-radius: var(--radius-sm);
          transition: color var(--transition-fast), background var(--transition-fast);
        }
        .btn-icon:hover {
          color: var(--text-main);
          background: rgba(99, 102, 241, 0.1);
        }
        .mobile-menu-btn {
          display: none;
        }
        @media (max-width: 900px) {
          .navbar-wrapper {
            padding: 0.75rem 1rem;
          }
          .mobile-menu-btn {
            display: flex;
          }
          .stat-pill.level-pill, .stat-pill.xp-pill, .user-info-text {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
