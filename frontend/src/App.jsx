import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PlacementModal from './components/PlacementModal';

// Views
import AuthModal from './views/AuthModal';
import DashboardView from './views/DashboardView';
import SpeakingPracticeView from './views/SpeakingPracticeView';
import AIConversationView from './views/AIConversationView';
import ListeningPracticeView from './views/ListeningPracticeView';
import ReadingPracticeView from './views/ReadingPracticeView';
import WritingPracticeView from './views/WritingPracticeView';
import VocabularyView from './views/VocabularyView';
import GrammarLabView from './views/GrammarLabView';
import RealLifeView from './views/RealLifeView';
import GamificationView from './views/GamificationView';
import AnalyticsView from './views/AnalyticsView';
import AdminPortalView from './views/AdminPortalView';

function MainLayout() {
  const { user, loading, showPlacementModal, setShowPlacementModal } = useAuth();
  const [activeTab, setActiveTab] = useState(() => (user?.role === 'admin' ? 'admin_dashboard' : 'dashboard'));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // If loading session
  if (loading) {
    return (
      <div className="app-splash-loader">
        <div className="splash-card">
          <div className="spinner"></div>
          <h2 className="mt-4 font-bold">EnglishConnect</h2>
          <p className="text-muted text-sm">Initializing AI Fluency Platform...</p>
        </div>
      </div>
    );
  }

  // If not logged in, render authentication modal
  if (!user) {
    return <AuthModal onLoginSuccess={() => setActiveTab('dashboard')} />;
  }

  // Switcher for Real Life to Conversation
  const handleLaunchScenario = (scenarioId) => {
    setActiveTab('conversation');
  };

  const renderActiveView = () => {
    // Admin Views
    if (activeTab.startsWith('admin_')) {
      return <AdminPortalView />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;
      case 'speaking':
        return <SpeakingPracticeView />;
      case 'conversation':
        return <AIConversationView />;
      case 'listening':
        return <ListeningPracticeView />;
      case 'reading':
        return <ReadingPracticeView />;
      case 'writing':
        return <WritingPracticeView />;
      case 'vocabulary':
        return <VocabularyView />;
      case 'grammar':
        return <GrammarLabView />;
      case 'reallife':
        return <RealLifeView onLaunchScenario={handleLaunchScenario} />;
      case 'challenges':
        return <GamificationView />;
      case 'analytics':
        return <AnalyticsView onNavigate={(tab) => setActiveTab(tab)} />;
      default:
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="app-shell">
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="app-layout-body">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <main className="app-main-content">
          {renderActiveView()}
        </main>
      </div>

      {/* Placement Test Assessment Modal */}
      <PlacementModal
        isOpen={showPlacementModal}
        onClose={() => setShowPlacementModal(false)}
      />

      <style>{`
        .app-shell {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .app-layout-body {
          display: flex;
          flex: 1;
          position: relative;
        }
        .app-main-content {
          flex: 1;
          overflow-y: auto;
          background: var(--bg-primary);
          min-height: calc(100vh - 65px);
        }
        .app-splash-loader {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
        }
        .splash-card {
          text-align: center;
          padding: 2.5rem;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
