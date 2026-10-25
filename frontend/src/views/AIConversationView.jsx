import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../utils/api';
import { createSpeechRecognizer, speakText, stopSpeaking, triggerCelebration } from '../utils/speech';
import {
  MessageSquare,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  Award,
  RefreshCw,
  CheckCircle,
  Lightbulb,
  X,
  Coffee,
  Briefcase,
  GraduationCap,
  Utensils,
  Plane,
  Headphones,
  ShoppingBag,
  Users
} from 'lucide-react';

const SCENARIO_ICONS = {
  casual: Coffee,
  job_interview: Briefcase,
  college: GraduationCap,
  restaurant: Utensils,
  travel: Plane,
  customer_service: Headphones,
  shopping: ShoppingBag,
  group_discussion: Users
};

export default function AIConversationView() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [sending, setSending] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [latestTip, setLatestTip] = useState(null);

  const messagesEndRef = useRef(null);
  const recognizerRef = useRef(null);

  useEffect(() => {
    loadScenarios();
    return () => {
      stopSpeaking();
      if (recognizerRef.current) recognizerRef.current.stop();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadScenarios = async () => {
    try {
      const res = await apiRequest('/conversation/scenarios');
      setScenarios(res.scenarios || []);
      if (res.scenarios?.length > 0) {
        startScenario(res.scenarios[0]);
      }
    } catch (err) {
      console.error('Failed to load conversation scenarios:', err);
    }
  };

  const startScenario = (sc) => {
    setSelectedScenario(sc);
    setEvaluation(null);
    setLatestTip(null);
    setShowSummaryModal(false);

    const initial = [
      {
        id: 1,
        sender: 'ai',
        text: sc.initialGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(initial);

    if (autoSpeak) {
      speakText(sc.initialGreeting);
    }
  };

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputText).trim();
    if (!text || sending) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setSending(true);

    try {
      const historyPayload = messages.map(m => ({
        role: m.sender === 'ai' ? 'assistant' : 'user',
        content: m.text
      }));

      const res = await apiRequest('/conversation/chat', 'POST', {
        scenarioType: selectedScenario?.id || 'casual',
        conversationHistory: historyPayload,
        message: text
      });

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);

      if (res.correctionTip) {
        setLatestTip(res.correctionTip);
      }

      if (autoSpeak) {
        speakText(res.reply);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setSending(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognizerRef.current) recognizerRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognizerRef.current = createSpeechRecognizer({
        onResult: (final, interim) => {
          if (final) {
            setInputText(prev => (prev ? prev + ' ' + final : final).trim());
          }
        },
        onError: () => setIsRecording(false),
        onEnd: () => setIsRecording(false)
      });
      recognizerRef.current.start();
    }
  };

  const handleEndSession = async () => {
    try {
      const res = await apiRequest('/conversation/end', 'POST', {
        scenarioType: selectedScenario?.id || 'casual',
        messages
      });
      setEvaluation(res.evaluation);
      setShowSummaryModal(true);
      triggerCelebration('high');
    } catch (err) {
      alert('Failed to evaluate conversation: ' + err.message);
    }
  };

  const handlePlayAiAudio = (text) => {
    speakText(text);
  };

  return (
    <div className="conversation-view-container">
      {/* View Header */}
      <div className="view-title-block">
        <div className="title-icon-badge">
          <MessageSquare size={24} className="text-indigo" />
        </div>
        <div>
          <h2>AI English Conversation Partner</h2>
          <p className="view-subtitle">
            Immerse yourself in authentic contextual dialogues with speech recognition, natural voice synthesis, and real-time correction.
          </p>
        </div>
      </div>

      <div className="conversation-grid">
        {/* Left Side: Scenarios Picker */}
        <div className="conversation-scenarios-pane">
          <div className="glass-panel pane-card">
            <h3 className="pane-title">Choose Scenario</h3>
            <div className="scenarios-list">
              {scenarios.map((sc) => {
                const IconComponent = SCENARIO_ICONS[sc.id] || Coffee;
                const isSelected = selectedScenario?.id === sc.id;
                return (
                  <div
                    key={sc.id}
                    className={`scenario-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => startScenario(sc)}
                  >
                    <div className="sc-icon-box">
                      <IconComponent size={20} className="text-indigo" />
                    </div>
                    <div className="sc-info">
                      <div className="sc-header">
                        <span className="sc-title">{sc.title}</span>
                        <span className="badge-pill badge-indigo">{sc.level}</span>
                      </div>
                      <p className="sc-desc">{sc.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Dialogue Box */}
        <div className="conversation-chat-pane">
          <div className="glass-panel chat-studio-card">
            {/* Chat Top Bar */}
            <div className="chat-top-bar">
              <div className="chat-partner-info">
                <div className="ai-avatar-circle">
                  <Sparkles size={18} className="text-indigo" />
                </div>
                <div>
                  <h4 className="partner-name">EnglishConnect AI Partner</h4>
                  <span className="partner-status">
                    <span className="status-dot"></span> Active in {selectedScenario?.title}
                  </span>
                </div>
              </div>

              <div className="chat-bar-actions">
                <button
                  className={`btn-icon ${autoSpeak ? 'text-indigo' : 'text-muted'}`}
                  onClick={() => setAutoSpeak(!autoSpeak)}
                  title={autoSpeak ? 'Mute AI Auto-Speech' : 'Enable AI Voice Out Loud'}
                >
                  {autoSpeak ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>

                <button className="btn btn-emerald btn-sm" onClick={handleEndSession} disabled={messages.length < 2}>
                  <Award size={15} /> End Session & Evaluate
                </button>
              </div>
            </div>

            {/* Scenario Checklist Objectives */}
            {selectedScenario?.objectives && (
              <div className="scenario-goals-bar">
                <span className="goals-label">Conversation Goals:</span>
                <div className="goals-badges-row">
                  {selectedScenario.objectives.map((obj, i) => (
                    <span key={i} className="badge-pill badge-amber">
                      ✓ {obj}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Inline AI Grammar/Phraing Tip Banner */}
            {latestTip && (
              <div className="inline-tip-banner">
                <div className="tip-header">
                  <Lightbulb size={16} className="text-amber" />
                  <span className="tip-title">Grammar Tip from last message:</span>
                </div>
                <p className="tip-body">
                  Instead of "<em>{latestTip.original}</em>", say "<strong>{latestTip.improved}</strong>". {latestTip.explanation}
                </p>
                <button className="tip-dismiss-btn" onClick={() => setLatestTip(null)}>
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="messages-stream">
              {messages.map((m) => {
                const isAi = m.sender === 'ai';
                return (
                  <div key={m.id} className={`message-bubble-row ${isAi ? 'ai-row' : 'user-row'}`}>
                    {isAi && (
                      <div className="msg-ai-icon">
                        <Sparkles size={14} color="#fff" />
                      </div>
                    )}
                    <div className={`message-bubble ${isAi ? 'ai-bubble' : 'user-bubble'}`}>
                      <p className="message-text">{m.text}</p>
                      <div className="msg-meta-row">
                        <span className="msg-time">{m.timestamp}</span>
                        {isAi && (
                          <button className="btn-msg-listen" onClick={() => handlePlayAiAudio(m.text)} title="Listen to this sentence">
                            <Volume2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {sending && (
                <div className="message-bubble-row ai-row">
                  <div className="msg-ai-icon">
                    <Sparkles size={14} color="#fff" />
                  </div>
                  <div className="message-bubble ai-bubble typing-bubble">
                    <div className="audio-wave"><span></span><span></span><span></span></div>
                    <span className="typing-text">AI is formulating thoughtful response...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="chat-input-bar">
              <button
                type="button"
                className={`btn-icon-round ${isRecording ? 'recording mic-recording' : ''}`}
                onClick={toggleRecording}
                title={isRecording ? 'Stop Recording' : 'Speak via Microphone'}
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <input
                type="text"
                className="chat-text-input form-input"
                placeholder={isRecording ? 'Listening to your voice...' : 'Type your reply in English...'}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
              />

              <button
                type="button"
                className="btn btn-primary chat-send-btn"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || sending}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* End Session Summary Modal */}
      {showSummaryModal && evaluation && (
        <div className="modal-backdrop">
          <div className="modal-card eval-modal">
            <div className="modal-header">
              <div className="modal-title-group">
                <Award size={22} className="text-indigo" />
                <h3>Conversation Mastery Report</h3>
              </div>
              <button className="btn-icon" onClick={() => setShowSummaryModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body text-center">
              <div className="overall-score-circle">
                <span className="overall-score-num">{evaluation.overallScore}</span>
                <span className="overall-score-lbl">OVERALL</span>
              </div>

              <h4 className="eval-headline">Exceptional Conversational Flow!</h4>
              <p className="eval-subtext">{evaluation.feedbackSummary}</p>

              <div className="eval-scores-grid">
                <div className="eval-stat-box">
                  <span className="stat-num text-indigo">{evaluation.grammarScore}%</span>
                  <span className="stat-lbl">Grammar Accuracy</span>
                </div>
                <div className="eval-stat-box">
                  <span className="stat-num text-emerald">{evaluation.vocabularyScore}%</span>
                  <span className="stat-lbl">Vocabulary Variety</span>
                </div>
                <div className="eval-stat-box">
                  <span className="stat-num text-amber">{evaluation.fluencyScore}%</span>
                  <span className="stat-lbl">Conversational Fluency</span>
                </div>
              </div>

              <div className="session-reward-pill">
                <Award size={18} className="text-amber" />
                <span>+120 XP Added to Scholar Profile</span>
              </div>

              <button className="btn btn-primary btn-lg w-full mt-4" onClick={() => setShowSummaryModal(false)}>
                Return to Conversation
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .conversation-view-container {
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
        .conversation-grid {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 1.5rem;
          height: calc(100vh - 200px);
          min-height: 600px;
        }
        .conversation-scenarios-pane {
          height: 100%;
        }
        .pane-card {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 1.25rem;
        }
        .pane-title {
          font-size: 1.1rem;
          margin-bottom: 1rem;
        }
        .scenarios-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          overflow-y: auto;
          padding-right: 4px;
        }
        .scenario-card {
          display: flex;
          gap: 0.85rem;
          padding: 0.85rem;
          background: var(--bg-secondary);
          border: 1.5px solid var(--border-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .scenario-card:hover {
          border-color: var(--brand-primary);
        }
        .scenario-card.selected {
          border-color: var(--brand-primary);
          background: rgba(99, 102, 241, 0.08);
          box-shadow: 0 0 0 1px var(--brand-primary);
        }
        .sc-icon-box {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-sm);
          background: rgba(99, 102, 241, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sc-info {
          flex: 1;
        }
        .sc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.2rem;
        }
        .sc-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .sc-desc {
          font-size: 0.75rem;
          color: var(--text-muted);
          line-height: 1.35;
        }
        .chat-studio-card {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 0;
          overflow: hidden;
        }
        .chat-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }
        .chat-partner-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .ai-avatar-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--brand-gradient);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .partner-name {
          font-size: 0.95rem;
          font-weight: 700;
        }
        .partner-status {
          font-size: 0.75rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
        }
        .chat-bar-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .scenario-goals-bar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 1.5rem;
          background: rgba(99, 102, 241, 0.04);
          border-bottom: 1px solid var(--border-color);
          overflow-x: auto;
        }
        .goals-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          white-space: nowrap;
        }
        .goals-badges-row {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .inline-tip-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 1.5rem;
          background: rgba(245, 158, 11, 0.12);
          border-bottom: 1px solid rgba(245, 158, 11, 0.3);
          font-size: 0.82rem;
          color: var(--text-main);
          position: relative;
        }
        .tip-header {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-weight: 700;
          color: #b45309;
          white-space: nowrap;
        }
        .tip-body {
          flex: 1;
        }
        .tip-dismiss-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }
        .messages-stream {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.15rem;
        }
        .message-bubble-row {
          display: flex;
          gap: 0.75rem;
          max-width: 80%;
        }
        .ai-row {
          align-self: flex-start;
        }
        .user-row {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .msg-ai-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--brand-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 4px;
        }
        .message-bubble {
          padding: 0.85rem 1.15rem;
          border-radius: var(--radius-lg);
          font-size: 0.95rem;
          line-height: 1.5;
        }
        .ai-bubble {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-main);
          border-top-left-radius: 4px;
        }
        .user-bubble {
          background: var(--brand-gradient);
          color: #fff;
          border-top-right-radius: 4px;
          box-shadow: 0 4px 14px var(--brand-glow);
        }
        .msg-meta-row {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.45rem;
          margin-top: 0.35rem;
          font-size: 0.7rem;
          opacity: 0.75;
        }
        .btn-msg-listen {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          opacity: 0.8;
          display: flex;
          align-items: center;
        }
        .btn-msg-listen:hover { opacity: 1; }
        .typing-bubble {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }
        .typing-text {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .chat-input-bar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: var(--bg-secondary);
          border-top: 1px solid var(--border-color);
        }
        .btn-icon-round {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1.5px solid var(--border-color);
          background: var(--bg-card);
          color: var(--text-main);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .btn-icon-round:hover {
          border-color: var(--brand-primary);
          color: var(--brand-primary);
        }
        .btn-icon-round.recording {
          background: #f43f5e;
          color: #fff;
          border-color: #f43f5e;
        }
        .chat-text-input {
          flex: 1;
        }
        .chat-send-btn {
          height: 44px;
          padding: 0 1.25rem;
        }
        .eval-modal {
          max-width: 520px;
        }
        .overall-score-circle {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: var(--brand-gradient);
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          box-shadow: var(--shadow-glow);
        }
        .overall-score-num {
          font-size: 2.2rem;
          font-weight: 800;
          line-height: 1;
        }
        .overall-score-lbl {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.08em;
        }
        .eval-headline {
          font-size: 1.35rem;
          margin-bottom: 0.35rem;
        }
        .eval-subtext {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
        }
        .eval-scores-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .eval-stat-box {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.85rem 0.5rem;
        }
        .stat-num {
          font-size: 1.4rem;
          font-weight: 800;
          display: block;
        }
        .stat-lbl {
          font-size: 0.7rem;
          color: var(--text-muted);
        }
        .session-reward-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.4rem 1rem;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 700;
          color: #d97706;
        }
        @media (max-width: 900px) {
          .conversation-grid {
            grid-template-columns: 1fr;
            height: auto;
          }
          .conversation-scenarios-pane {
            max-height: 250px;
          }
        }
      `}</style>
    </div>
  );
}
