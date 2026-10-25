import React from 'react';
import {
  Compass,
  Briefcase,
  GraduationCap,
  Utensils,
  Plane,
  Headphones,
  ShoppingBag,
  Users,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Award
} from 'lucide-react';

export default function RealLifeView({ onLaunchScenario }) {
  const scenarios = [
    {
      id: 'job_interview',
      title: 'Global Tech Job Interview',
      category: 'Career & Professional',
      level: 'B2',
      duration: '15 min',
      xp: 120,
      icon: Briefcase,
      description: 'Defend your past engineering challenges, explain conflict resolution, and pitch your candidacy to an executive recruiter.',
      objectives: ['Introduce yourself using the STAR framework', 'Describe a technical bottleneck you overcame', 'Ask 2 insightful questions about team culture']
    },
    {
      id: 'college',
      title: 'Professor Office Hours & Defense',
      category: 'Academic Life',
      level: 'B1-B2',
      duration: '15 min',
      xp: 100,
      icon: GraduationCap,
      description: 'Discuss seminar grades, clarify confusing paper concepts, and negotiate research deadlines respectfully.',
      objectives: ['Formally state your academic inquiry', 'Cite specific seminar notes', 'Agree on revised milestone deliverables']
    },
    {
      id: 'casual',
      title: 'Cafe Catch-up with International Friend',
      category: 'Social Communication',
      level: 'A2-B1',
      duration: '10 min',
      xp: 80,
      icon: Users,
      description: 'Break the ice with spontaneous small talk, share weekend adventures, discuss favorite cinema, and plan future meetups.',
      objectives: ['Ask open-ended follow-up questions', 'Share an anecdote about your week', 'Suggest a weekend activity']
    },
    {
      id: 'restaurant',
      title: 'Fine Dining & Special Dietary Orders',
      category: 'Everyday Practical',
      level: 'A2',
      duration: '10 min',
      xp: 70,
      icon: Utensils,
      description: 'Inquire about gluten or allergy safety, ask server recommendations, request extra sauces, and request the check politely.',
      objectives: ['Inquire about chef specialties', 'Ask if a dish contains specific ingredients', 'Politely request the itemized bill']
    },
    {
      id: 'travel',
      title: 'Airport Customs & Connecting Gate Inquiry',
      category: 'Travel & Mobility',
      level: 'A2-B1',
      duration: '10 min',
      xp: 75,
      icon: Plane,
      description: 'Answer border control questions, declare items, find gate transfer shuttles, and rebook flight delays.',
      objectives: ['State trip purpose and accommodation length', 'Ask for directions to connecting Terminal B', 'Verify boarding pass status']
    },
    {
      id: 'customer_service',
      title: 'Resolving Defective Online Delivery',
      category: 'Commercial Dialogue',
      level: 'B1',
      duration: '12 min',
      xp: 90,
      icon: Headphones,
      description: 'Explain a damaged delivery calmly, provide tracking numbers, and assertively negotiate expedited replacement or full refund.',
      objectives: ['Provide order and invoice reference', 'Describe condition of item accurately', 'Negotiate a replacement delivery']
    },
    {
      id: 'shopping',
      title: 'Apparel Fitting & Discount Negotiation',
      category: 'Everyday Practical',
      level: 'A1-A2',
      duration: '8 min',
      xp: 60,
      icon: ShoppingBag,
      description: 'Ask for alternate sizes, inquire about current seasonal promotional sales, and ask about store return policies.',
      objectives: ['Ask if medium or large is available in stock', 'Enquire about return window', 'Ask where the fitting rooms are']
    },
    {
      id: 'group_discussion',
      title: 'College Seminar: Renewable Energy Debate',
      category: 'Academic Discussion',
      level: 'B2-C1',
      duration: '15 min',
      xp: 110,
      icon: Users,
      description: 'Participate in a university seminar debate. State your hypothesis, politely counter an opposing peer, and synthesize arguments.',
      objectives: ['State your thesis clearly', 'Use formal transition phrases (Conversely, Furthermore)', 'Summarize key common ground']
    }
  ];

  return (
    <div className="reallife-view-container">
      <div className="view-title-block">
        <div className="title-icon-badge">
          <Compass size={24} className="text-indigo" />
        </div>
        <div>
          <h2>Real-Life Scenario Simulation</h2>
          <p className="view-subtitle">
            Bridge classroom theory and genuine social confidence. Step into authentic workplace, travel, and academic roleplays with AI.
          </p>
        </div>
      </div>

      <div className="scenarios-matrix-grid">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          return (
            <div key={sc.id} className="scenario-feature-card glass-panel">
              <div className="card-top-row">
                <div className="scenario-icon-circle">
                  <Icon size={22} className="text-indigo" />
                </div>
                <div className="card-top-tags">
                  <span className="badge-pill badge-indigo">{sc.level}</span>
                  <span className="badge-pill badge-amber">+{sc.xp} XP</span>
                </div>
              </div>

              <span className="scenario-category-label">{sc.category}</span>
              <h3 className="scenario-card-title">{sc.title}</h3>
              <p className="scenario-card-description">{sc.description}</p>

              <div className="scenario-checklist-box">
                <span className="checklist-heading">Mission Objectives:</span>
                <ul className="checklist-items">
                  {sc.objectives.map((obj, i) => (
                    <li key={i}>
                      <CheckCircle2 size={13} className="text-emerald check-icon" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="scenario-card-bottom">
                <span className="scenario-duration-note">
                  <Clock size={13} /> Est. {sc.duration}
                </span>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onLaunchScenario(sc.id)}
                >
                  Enter Scenario <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .reallife-view-container {
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
        .scenarios-matrix-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }
        .scenario-feature-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          transition: transform var(--transition-normal), border-color var(--transition-normal);
        }
        .scenario-feature-card:hover {
          transform: translateY(-3px);
          border-color: var(--brand-primary);
        }
        .card-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        .scenario-icon-circle {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-md);
          background: rgba(99, 102, 241, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card-top-tags {
          display: flex;
          gap: 0.35rem;
        }
        .scenario-category-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--brand-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .scenario-card-title {
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0.25rem 0 0.5rem;
          color: var(--text-main);
        }
        .scenario-card-description {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.45;
          margin-bottom: 1rem;
        }
        .scenario-checklist-box {
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          padding: 0.85rem;
          margin-bottom: 1.25rem;
          flex: 1;
        }
        .checklist-heading {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          display: block;
          margin-bottom: 0.45rem;
        }
        .checklist-items {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .checklist-items li {
          display: flex;
          align-items: flex-start;
          gap: 0.45rem;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .check-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }
        .scenario-card-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border-color);
          padding-top: 0.85rem;
        }
        .scenario-duration-note {
          font-size: 0.78rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
      `}</style>
    </div>
  );
}
