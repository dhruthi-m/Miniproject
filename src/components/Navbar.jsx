import React, { useState } from 'react';
import { Activity, LogOut, Menu, X, User, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activePage, onNavigate }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (pageId, e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    onNavigate(pageId);
  };

  const handleLogout = () => {
    logout();
    onNavigate('landing');
  };

  const openChatbot = () => {
    window.dispatchEvent(new CustomEvent('open-mindwave-chat'));
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand Text (No logo) */}
        <a 
          href="#home" 
          className="navbar-brand"
          onClick={(e) => handleNavClick('landing', e)}
        >
          <span>MindWave</span>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="navbar-nav">
          <a
            href="#home"
            className={`nav-link ${activePage === 'landing' ? 'active' : ''}`}
            onClick={(e) => handleNavClick('landing', e)}
          >
            Home
          </a>
          {isAuthenticated && (
            <>
              <a
                href="#dashboard"
                className={`nav-link ${activePage === 'dashboard' ? 'active' : ''}`}
                onClick={(e) => handleNavClick('dashboard', e)}
              >
                Dashboard
              </a>
              <a
                href="#screening"
                className={`nav-link ${['screening-select', 'screening-setup', 'quiz', 'result', 'detailed-responses'].includes(activePage) ? 'active' : ''}`}
                onClick={(e) => handleNavClick('screening-select', e)}
              >
                Screening
              </a>
              <a
                href="#journal"
                className={`nav-link ${activePage === 'journal' ? 'active' : ''}`}
                onClick={(e) => handleNavClick('journal', e)}
              >
                Journal
              </a>
              <a
                href="#care"
                className={`nav-link ${activePage === 'find-care' ? 'active' : ''}`}
                onClick={(e) => handleNavClick('find-care', e)}
              >
                Find Care
              </a>
            </>
          )}
          <a
            href="#about"
            className={`nav-link ${activePage === 'about' ? 'active' : ''}`}
            onClick={(e) => handleNavClick('about', e)}
          >
            About
          </a>
          <a
            href="#contact"
            className={`nav-link ${activePage === 'contact' ? 'active' : ''}`}
            onClick={(e) => handleNavClick('contact', e)}
          >
            Contact
          </a>
        </nav>

        {/* Right Action: Auth or Profile + Companion */}
        <div className="navbar-actions">
          <button
            type="button"
            className="nav-chat-btn"
            onClick={openChatbot}
            title="Open MindWave Chat Companion"
          >
            <MessageSquare size={16} />
            <span>Companion</span>
          </button>

          {isAuthenticated ? (
            <>
              <button 
                className="user-badge" 
                onClick={() => onNavigate('settings')}
                title="Manage Settings"
              >
                <div className="user-avatar-circle">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <span>{user?.name ? user.name.split(' ')[0] : 'User'}</span>
              </button>
              <button 
                className="btn-logout" 
                onClick={handleLogout}
                title="Log Out"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => onNavigate('auth')}
            >
              Sign In
            </button>
          )}

          {/* Mobile hamburger toggle */}
          <button 
            className="icon-btn mobile-menu-toggle"
            style={{ display: 'none' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          padding: '1rem',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          <a href="#home" className="nav-link" onClick={(e) => handleNavClick('landing', e)}>Home</a>
          {isAuthenticated && (
            <>
              <a href="#dashboard" className="nav-link" onClick={(e) => handleNavClick('dashboard', e)}>Dashboard</a>
              <a href="#screening" className="nav-link" onClick={(e) => handleNavClick('screening-select', e)}>Screening</a>
              <a href="#journal" className="nav-link" onClick={(e) => handleNavClick('journal', e)}>Journal</a>
              <a href="#care" className="nav-link" onClick={(e) => handleNavClick('find-care', e)}>Find Care</a>
            </>
          )}
          <a href="#about" className="nav-link" onClick={(e) => handleNavClick('about', e)}>About</a>
          <a href="#contact" className="nav-link" onClick={(e) => handleNavClick('contact', e)}>Contact</a>
          <button 
            type="button" 
            className="nav-chat-btn" 
            style={{ width: 'fit-content' }}
            onClick={() => { setMobileMenuOpen(false); openChatbot(); }}
          >
            <MessageSquare size={16} />
            <span>Open AI Companion</span>
          </button>
          {!isAuthenticated && (
            <a href="#auth" className="nav-link" style={{ fontWeight: 600, color: 'var(--color-primary)' }} onClick={(e) => handleNavClick('auth', e)}>Sign In</a>
          )}
        </div>
      )}
    </header>
  );
}
