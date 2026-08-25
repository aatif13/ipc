import React, { useState, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Simulator from './pages/Simulator';
import ComparisonPage from './pages/Comparison';
import ArchitecturePage from './pages/Architecture';
import HowItWorksPage from './pages/HowItWorks';
import ProjectGuidePage from './pages/ProjectGuide';
import ApplicationsPage from './pages/Applications';
import HistoryPage from './pages/History';
import AboutPage from './pages/About';
import HackathonDemo from './pages/HackathonDemo';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  const navigate = useCallback((page: string) => {
    setCurrentPage(page);
    setDemoMode(false);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

  const startDemo = useCallback(() => {
    setDemoMode(true);
  }, []);

  const exitDemo = useCallback(() => {
    setDemoMode(false);
  }, []);

  if (demoMode) {
    return <HackathonDemo onExit={exitDemo} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={navigate} onRunDemo={startDemo} />;
      case 'simulator': return <Simulator />;
      case 'comparison': return <ComparisonPage />;
      case 'architecture': return <ArchitecturePage />;
      case 'how-it-works': return <HowItWorksPage />;
      case 'guide': return <ProjectGuidePage />;
      case 'applications': return <ApplicationsPage />;
      case 'history': return <HistoryPage />;
      case 'about': return <AboutPage />;
      default: return <Dashboard onNavigate={navigate} onRunDemo={startDemo} />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={navigate}
      darkMode={darkMode}
      onToggleDarkMode={toggleDarkMode}
    >
      {renderPage()}
    </Layout>
  );
}
