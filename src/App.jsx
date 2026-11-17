import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ConversationalChatbot from './components/ConversationalChatbot';

// Pages
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ScreeningSelectPage from './pages/ScreeningSelectPage';
import ScreeningSetupPage from './pages/ScreeningSetupPage';
import QuestionnairePage from './pages/QuestionnairePage';
import ResultPage from './pages/ResultPage';
import DetailedResponsesPage from './pages/DetailedResponsesPage';
import JournalPage from './pages/JournalPage';
import ProgressReportsPage from './pages/ProgressReportsPage';
import ContactPage from './pages/ContactPage';
import SettingsPage from './pages/SettingsPage';
import CareLocatorPage from './pages/CareLocatorPage';

// Contexts
import { AuthProvider, useAuth } from './context/AuthContext';
import { ScreeningProvider } from './context/ScreeningContext';
import { JournalProvider } from './context/JournalContext';

const PUBLIC_PAGES = ['landing', 'about', 'contact', 'auth'];

function MainAppContent() {
  const { isAuthenticated } = useAuth();

  // Detect initial route based on URL path or hash
  const [activePage, setActivePage] = useState(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    let initial = 'landing';
    if (path.includes('dashboard') || hash.includes('dashboard')) initial = 'dashboard';
    else if (path.includes('screening') || hash.includes('screening')) initial = 'screening-select';
    else if (path.includes('journal') || hash.includes('journal')) initial = 'journal';
    else if (path.includes('login') || hash.includes('login') || hash.includes('auth')) initial = 'auth';
    else if (path.includes('schizophrenia') || path.includes('bipolar')) initial = 'screening-setup';
    else if (path.includes('result') || hash.includes('result')) initial = 'result';
    else if (hash.includes('about')) initial = 'about';
    else if (hash.includes('contact')) initial = 'contact';
    else if (hash.includes('care') || hash.includes('map') || hash.includes('hospital') || path.includes('care')) initial = 'find-care';
    else if (hash.includes('progress') || path.includes('progress')) initial = 'progress';
    else if (hash.includes('settings')) initial = 'settings';

    // Guard initial route: If not authenticated, only public pages (landing, about, contact, auth) can open
    const storedToken = localStorage.getItem('mindwave_token');
    const storedUser = localStorage.getItem('mindwave_user');
    const isInitiallyLoggedIn = !!(storedToken && storedUser);

    if (!isInitiallyLoggedIn && !PUBLIC_PAGES.includes(initial)) {
      return 'auth';
    }
    return initial;
  });

  // Listen to hash changes and popstate with strict authentication protection
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      let target = 'landing';
      if (path.includes('dashboard') || hash.includes('dashboard')) target = 'dashboard';
      else if (path.includes('screening') || hash.includes('screening')) target = 'screening-select';
      else if (path.includes('journal') || hash.includes('journal')) target = 'journal';
      else if (path.includes('login') || hash.includes('login') || hash.includes('auth')) target = 'auth';
      else if (path.includes('schizophrenia') || path.includes('bipolar')) target = 'screening-setup';
      else if (path.includes('result') || hash.includes('result')) target = 'result';
      else if (hash.includes('about')) target = 'about';
      else if (hash.includes('contact')) target = 'contact';
      else if (hash.includes('care') || hash.includes('map') || hash.includes('hospital') || path.includes('care')) target = 'find-care';
      else if (hash.includes('progress')) target = 'progress';
      else if (hash.includes('settings')) target = 'settings';
      else if (path === '/' || hash === '#home') target = 'landing';

      // If user is not logged in, forbid access to tabs like journal, screening, findcare, dashboard, etc.
      if (!isAuthenticated && !PUBLIC_PAGES.includes(target)) {
        setActivePage('auth');
      } else {
        setActivePage(target);
      }
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [isAuthenticated]);

  const handleNavigate = (page) => {
    // If user is not logged in, block protected tabs and redirect to auth
    if (!isAuthenticated && !PUBLIC_PAGES.includes(page)) {
      setActivePage('auth');
    } else {
      setActivePage(page);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      {/* Decorative ambient background */}
      <div className="abstract-bg" aria-hidden="true">
        <div className="abstract-blob abstract-blob-1" />
        <div className="abstract-blob abstract-blob-2" />
        <div className="abstract-blob abstract-blob-3" />
      </div>

      {/* Global Navigation Bar */}
      <Navbar activePage={activePage} onNavigate={handleNavigate} />

      {/* Main Content Area */}
      <main className="main-content">
        {(!isAuthenticated && !PUBLIC_PAGES.includes(activePage)) ? (
          <AuthPage onNavigate={handleNavigate} />
        ) : (
          <>
            {activePage === 'landing' && <LandingPage onNavigate={handleNavigate} />}
            {activePage === 'about' && <AboutPage onNavigate={handleNavigate} />}
            {activePage === 'auth' && <AuthPage onNavigate={handleNavigate} />}
            {activePage === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
            {activePage === 'screening-select' && <ScreeningSelectPage onNavigate={handleNavigate} />}
            {activePage === 'screening-setup' && <ScreeningSetupPage onNavigate={handleNavigate} />}
            {activePage === 'quiz' && <QuestionnairePage onNavigate={handleNavigate} />}
            {activePage === 'result' && <ResultPage onNavigate={handleNavigate} />}
            {activePage === 'detailed-responses' && <DetailedResponsesPage onNavigate={handleNavigate} />}
            {activePage === 'journal' && <JournalPage />}
            {activePage === 'progress' && <ProgressReportsPage onNavigate={handleNavigate} />}
            {activePage === 'reports' && <ProgressReportsPage onNavigate={handleNavigate} />}
            {activePage === 'contact' && <ContactPage />}
            {activePage === 'settings' && <SettingsPage onNavigate={handleNavigate} />}
            {activePage === 'find-care' && <CareLocatorPage onNavigate={handleNavigate} />}
          </>
        )}
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Conversational Mental Health Chatbot */} 
      <ConversationalChatbot />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ScreeningProvider>
        <JournalProvider>
          <MainAppContent />
        </JournalProvider>
      </ScreeningProvider>
    </AuthProvider>
  );
}

