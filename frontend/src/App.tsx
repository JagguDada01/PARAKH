import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, ScreenId } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectExplorerPage } from './pages/ProjectExplorerPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { RiskCenterPage } from './pages/RiskCenterPage';
import { GisMapPage } from './pages/GisMapPage';
import { InvestigationCenterPage } from './pages/InvestigationCenterPage';
import { ModelAnalyticsPage } from './pages/ModelAnalyticsPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { DataIngestionPage } from './pages/DataIngestionPage';
import { LoginPage } from './pages/LoginPage';
import { FloatingAiWidget } from './components/FloatingAiWidget';
import { api } from './services/api';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, role } = useAuth();
  const [activeScreen, setActiveScreen] = useState<ScreenId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [assistantInitialQuery, setAssistantInitialQuery] = useState<string>('');
  const [gisFocusProjectId, setGisFocusProjectId] = useState<string | undefined>(undefined);

  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [criticalRiskCount, setCriticalRiskCount] = useState(0);

  // Poll overview periodically for sidebar badge counters
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchCounters = async () => {
      try {
        const res = await api.getOverview();
        setActiveAlertsCount(res.active_alerts_count);
        setCriticalRiskCount(res.critical_risk_count);
      } catch (err) {
        // ignore background poll errors
      }
    };
    fetchCounters();
    const interval = setInterval(fetchCounters, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setActiveScreen('dashboard')} />;
  }

  const handleSelectProject = (pid: string) => {
    setSelectedProjectId(pid);
    setActiveScreen('project-detail');
  };

  const handleOpenGis = (pid: string) => {
    setGisFocusProjectId(pid);
    setActiveScreen('gis');
  };

  const handleAskAi = (prompt: string) => {
    setAssistantInitialQuery(prompt);
    setActiveScreen('assistant');
  };

  const screenTitles: Record<ScreenId, string> = {
    dashboard: 'National Monitoring & Anomaly Overview',
    projects: 'MPLADS Project Explorer',
    'project-detail': `Project File: ${selectedProjectId || 'Details'}`,
    risk: 'Risk Scoring Engine & Threshold Sandbox',
    gis: 'Geospatial Intelligence Map & Duplicate Vectors',
    investigation: 'Vigilance Investigation & Alert Triage',
    models: 'Machine Learning Model Benchmark Analytics',
    assistant: 'Natural Language AI Vigilance Assistant',
    ingestion: 'Data Ingestion & Multi-field Normalization Hub',
  };

  // Role permissions checker
  const canAccessScreen = (screen: ScreenId): boolean => {
    switch (screen) {
      case 'ingestion':
        return role === 'ADMIN';
      case 'investigation':
        return ['ADMIN', 'INVESTIGATOR'].includes(role);
      case 'models':
        return ['ADMIN', 'ANALYST'].includes(role);
      case 'risk':
        return ['ADMIN', 'INVESTIGATOR', 'ANALYST'].includes(role);
      default:
        return true;
    }
  };

  const renderRestrictedNotice = (requiredRoleDesc: string) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-lg mx-auto text-center space-y-4 shadow-xs mt-12">
      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-base font-bold text-slate-900">Access Restricted for Your Role</h3>
        <p className="text-xs text-slate-600 mt-1">
          You are currently signed in as <span className="font-mono font-bold text-slate-800 uppercase">[{role}]</span>. This module requires <span className="font-semibold text-slate-900">{requiredRoleDesc}</span> access permissions.
        </p>
      </div>
      <button
        onClick={() => setActiveScreen('dashboard')}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition inline-flex items-center space-x-2"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Dashboard</span>
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Sidebar with Role-Filtered Navigation */}
      <Sidebar
        activeScreen={activeScreen}
        onSelectScreen={(screen) => {
          setActiveScreen(screen);
          if (screen !== 'project-detail') {
            setSelectedProjectId(null);
          }
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeAlertsCount={activeAlertsCount}
        criticalRiskCount={criticalRiskCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar activeScreenTitle={screenTitles[activeScreen]} />

        <main className="flex-1 overflow-y-auto p-6">
          {activeScreen === 'dashboard' && (
            <DashboardPage
              onSelectProject={handleSelectProject}
              onNavigateScreen={(scr) => setActiveScreen(scr)}
            />
          )}

          {activeScreen === 'projects' && (
            <ProjectExplorerPage onSelectProject={handleSelectProject} />
          )}

          {activeScreen === 'project-detail' && selectedProjectId && (
            <ProjectDetailPage
              projectId={selectedProjectId}
              onBack={() => setActiveScreen('projects')}
              onSelectProject={handleSelectProject}
              onOpenGis={handleOpenGis}
              onAskAi={handleAskAi}
            />
          )}

          {activeScreen === 'gis' && (
            <GisMapPage
              initialProjectId={gisFocusProjectId}
              onSelectProject={handleSelectProject}
            />
          )}

          {activeScreen === 'assistant' && (
            <AiAssistantPage
              initialQuery={assistantInitialQuery}
              onSelectProject={handleSelectProject}
            />
          )}

          {activeScreen === 'risk' && (
            canAccessScreen('risk')
              ? <RiskCenterPage onSelectProject={handleSelectProject} />
              : renderRestrictedNotice('National Nodal Admin, Investigator, or Data Analyst')
          )}

          {activeScreen === 'investigation' && (
            canAccessScreen('investigation')
              ? <InvestigationCenterPage onSelectProject={handleSelectProject} />
              : renderRestrictedNotice('Central Vigilance Investigator or Administrator')
          )}

          {activeScreen === 'models' && (
            canAccessScreen('models')
              ? <ModelAnalyticsPage />
              : renderRestrictedNotice('Chief Data Analyst / ML Engineer or Administrator')
          )}

          {activeScreen === 'ingestion' && (
            canAccessScreen('ingestion')
              ? <DataIngestionPage />
              : renderRestrictedNotice('National Nodal Administrator')
          )}
        </main>
      </div>

      {/* Floating Circular AI Assistant Widget (Bottom Right Corner) */}
      <FloatingAiWidget
        onOpenFullAssistant={(q) => {
          if (q) setAssistantInitialQuery(q);
          setActiveScreen('assistant');
        }}
        onSelectProject={handleSelectProject}
        activeScreen={activeScreen}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
