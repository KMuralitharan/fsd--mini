import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, User, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';

export default function AuthModal({ onLoginSuccess }) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [initialLevel, setInitialLevel] = useState('B1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password, fullName, initialLevel);
      } else {
        await login(email, password);
      }
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoStudent = () => {
    setEmail('alex@englishconnect.com');
    setPassword('student123');
    setIsRegister(false);
    setError('');
  };

  const fillDemoAdmin = () => {
    setEmail('admin@englishconnect.com');
    setPassword('admin123');
    setIsRegister(false);
    setError('');
  };

  return (
    <div className="auth-hero-backdrop">
      <div className="auth-card-container glass-panel">
        <div className="auth-brand-badge">
          <div className="auth-logo-bg">
            <Sparkles size={24} color="#fff" />
          </div>
          <h2>English<span className="brand-gradient-text">Connect</span></h2>
          <p className="auth-subtitle">AI-Powered English Communication & Fluency Platform</p>
        </div>

        {/* Demo Fast Login Bar */}
        <div className="demo-credentials-box">
          <span className="demo-box-label">QUICK TEST ACCOUNTS:</span>
          <div className="demo-buttons-group">
            <button type="button" className="btn btn-secondary btn-sm" onClick={fillDemoStudent}>
              <User size={14} className="text-indigo" /> Demo Student
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={fillDemoAdmin}>
              <ShieldCheck size={14} className="text-emerald" /> Demo Admin
            </button>
          </div>
        </div>

        {/* Auth Mode Toggle */}
        <div className="auth-tabs">
          <button 
            className={`auth-tab-btn ${!isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(false); setError(''); }}
          >
            Sign In
          </button>
          <button 
            className={`auth-tab-btn ${isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(true); setError(''); }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="auth-error-alert">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Gonzalez"
                  className="form-input with-icon"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                required
                placeholder="alex@englishconnect.com"
                className="form-input with-icon"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="form-input with-icon"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {isRegister && (
            <div className="form-group">
              <label className="form-label">Target English Level</label>
              <select 
                className="form-select"
                value={initialLevel}
                onChange={(e) => setInitialLevel(e.target.value)}
              >
                <option value="A1">A1 - Beginner (Basic foundations)</option>
                <option value="A2">A2 - Elementary (Everyday situations)</option>
                <option value="B1">B1 - Intermediate (Conversational confidence)</option>
                <option value="B2">B2 - Upper Intermediate (Professional & Academic)</option>
                <option value="C1">C1 - Advanced (Fluent & Spontaneous)</option>
                <option value="C2">C2 - Proficient (Native-like mastery)</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg w-full mt-2" disabled={loading}>
            {loading ? 'Please wait...' : isRegister ? 'Register & Start Learning' : 'Sign In to Portal'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-feature-bullets">
          <div className="feature-item"><CheckCircle size={15} className="text-emerald" /> AI Speech & Pronunciation Evaluation</div>
          <div className="feature-item"><CheckCircle size={15} className="text-emerald" /> Real-Life Conversational Roleplay</div>
          <div className="feature-item"><CheckCircle size={15} className="text-emerald" /> Gamified XP, Streaks & Badges</div>
        </div>
      </div>

      <style>{`
        .auth-hero-backdrop {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          background: radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.12) 0%, transparent 60%);
        }
        .auth-card-container {
          width: 100%;
          max-width: 480px;
          padding: 2.25rem;
          border-radius: var(--radius-lg);
        }
        .auth-brand-badge {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .auth-logo-bg {
          width: 52px;
          height: 52px;
          background: var(--brand-gradient);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 0.85rem;
          box-shadow: var(--shadow-glow);
        }
        .auth-brand-badge h2 {
          font-size: 1.75rem;
          margin-bottom: 0.25rem;
        }
        .auth-subtitle {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .demo-credentials-box {
          background: var(--bg-secondary);
          border: 1px dashed var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.75rem 1rem;
          margin-bottom: 1.25rem;
          text-align: center;
        }
        .demo-box-label {
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--text-muted);
          display: block;
          margin-bottom: 0.45rem;
          letter-spacing: 0.05em;
        }
        .demo-buttons-group {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }
        .auth-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--bg-secondary);
          padding: 4px;
          border-radius: var(--radius-md);
          margin-bottom: 1.25rem;
        }
        .auth-tab-btn {
          padding: 0.65rem;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-weight: 600;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .auth-tab-btn.active {
          background: var(--bg-card);
          color: var(--text-main);
          box-shadow: var(--shadow-sm);
        }
        .auth-error-alert {
          background: rgba(244, 63, 94, 0.12);
          border: 1px solid rgba(244, 63, 94, 0.3);
          color: #f43f5e;
          padding: 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          margin-bottom: 1.25rem;
        }
        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 1rem;
          color: var(--text-muted);
          pointer-events: none;
        }
        .form-input.with-icon {
          padding-left: 2.75rem;
          width: 100%;
        }
        .auth-feature-bullets {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          margin-top: 1.75rem;
          padding-top: 1.25rem;
          border-top: 1px solid var(--border-color);
        }
        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
