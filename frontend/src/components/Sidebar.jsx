import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Mic,
  MessageSquare,
  Headphones,
  BookOpen,
  PenTool,
  GraduationCap,
  Sparkles,
  Compass,
  Trophy,
  BarChart3,
  FileCheck,
  Users,
  Database,
  Layers,
  X
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose, activeTab, setActiveTab }) {
  const { user, setShowPlacementModal } = useAuth();
  const isAdmin = user?.role === 'admin';

  const studentNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'speaking', label: 'Speaking Practice', icon: Mic, badge: 'AI Voice' },
    { id: 'conversation', label: 'AI Conversation', icon: MessageSquare, badge: 'Roleplay' },
    { id: 'listening', label: 'Listening Practice', icon: Headphones },
    { id: 'reading', label: 'Reading Practice', icon: BookOpen },
    { id: 'writing', label: 'Writing Practice', icon: PenTool, badge: 'AI Review' },
    { id: 'vocabulary', label: 'Vocabulary Builder', icon: GraduationCap },
    { id: 'grammar', label: 'Grammar Lab', icon: Layers },
    { id: 'reallife', label: 'Real-Life Practice', icon: Compass },
    { id: 'challenges', label: 'Challenges & Ranks', icon: Trophy },
    { id: 'analytics', label: 'Progress & Analytics', icon: BarChart3 }
  ];

  const adminNavItems = [
    { id: 'admin_dashboard', label: 'Platform Overview', icon: LayoutDashboard },
    { id: 'admin_students', label: 'Manage Students', icon: Users },
    { id: 'admin_grammar', label: 'Grammar Lessons', icon: Layers },
    { id: 'admin_vocabulary', label: 'Vocabulary Bank', icon: GraduationCap },
    { id: 'admin_reading', label: 'Reading Passages', icon: BookOpen },
    { id: 'admin_speaking', label: 'Speaking Prompts', icon: Mic }
  ];

  const items = isAdmin ? adminNavItems : studentNavItems;

  const handleSelect = (id) => {
    setActiveTab(id);
    if (window.innerWidth < 900) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar-container ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-section-title">
            {isAdmin ? 'ADMINISTRATION' : 'LEARNING PATH'}
          </span>
          <button className="sidebar-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleSelect(item.id)}
              >
                <div className="nav-item-icon-wrapper">
                  <Icon size={19} className="nav-icon" />
                </div>
                <span className="nav-item-text">{item.label}</span>
                {item.badge && (
                  <span className={`nav-pill-badge ${isActive ? 'pill-active' : ''}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {!isAdmin && (
          <div className="sidebar-footer">
            <div className="placement-card-promo">
              <div className="placement-promo-header">
                <FileCheck size={18} className="text-indigo" />
                <span>Placement Test</span>
              </div>
              <p className="placement-promo-desc">
                Evaluate CEFR proficiency (A1-C2) and update your level.
              </p>
              <button 
                className="btn btn-outline btn-sm w-full"
                onClick={() => {
                  setShowPlacementModal(true);
                  if (window.innerWidth < 900) onClose();
                }}
              >
                Retake Assessment
              </button>
            </div>
          </div>
        )}
      </aside>

      <style>{`
        .sidebar-container {
          width: 270px;
          background: var(--bg-card);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          height: calc(100vh - 65px);
          position: sticky;
          top: 65px;
          z-index: 35;
          padding: 1.25rem 0.85rem;
          overflow-y: auto;
          transition: transform var(--transition-normal);
        }
        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 0.75rem 0.75rem 0.75rem;
        }
        .sidebar-section-title {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--text-muted);
        }
        .sidebar-close-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          flex: 1;
        }
        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 0.85rem;
          border-radius: var(--radius-md);
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          cursor: pointer;
          font-weight: 500;
          font-size: 0.92rem;
          text-align: left;
          transition: all var(--transition-fast);
          width: 100%;
        }
        .sidebar-nav-item:hover {
          background: var(--bg-secondary);
          color: var(--text-main);
          border-color: var(--border-color);
        }
        .sidebar-nav-item.active {
          background: rgba(99, 102, 241, 0.12);
          color: var(--brand-primary);
          border-color: rgba(99, 102, 241, 0.35);
          font-weight: 600;
        }
        .nav-item-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sidebar-nav-item.active .nav-icon {
          color: var(--brand-primary);
        }
        .nav-item-text {
          flex: 1;
        }
        .nav-pill-badge {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          background: var(--bg-secondary);
          color: var(--text-muted);
          padding: 0.15rem 0.45rem;
          border-radius: 6px;
          border: 1px solid var(--border-color);
        }
        .nav-pill-badge.pill-active {
          background: var(--brand-primary);
          color: #fff;
          border-color: var(--brand-primary);
        }
        .sidebar-footer {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }
        .placement-card-promo {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.9rem;
        }
        .placement-promo-header {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-weight: 700;
          font-size: 0.85rem;
          margin-bottom: 0.35rem;
          color: var(--text-main);
        }
        .placement-promo-desc {
          font-size: 0.75rem;
          color: var(--text-muted);
          line-height: 1.4;
          margin-bottom: 0.75rem;
        }
        .w-full {
          width: 100%;
        }
        .sidebar-backdrop {
          display: none;
        }
        @media (max-width: 900px) {
          .sidebar-container {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            transform: translateX(-100%);
            box-shadow: var(--shadow-xl);
          }
          .sidebar-container.sidebar-open {
            transform: translateX(0);
          }
          .sidebar-close-btn {
            display: block;
          }
          .sidebar-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.55);
            backdrop-filter: blur(4px);
            z-index: 34;
          }
        }
      `}</style>
    </>
  );
}
