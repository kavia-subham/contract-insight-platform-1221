import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import './layout.css';
import Dashboard from './components/Dashboard';
import ContractDetail from './components/ContractDetail';

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Simple routing based on hash
  const [hash, setHash] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handler = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const currentPath = useMemo(() => {
    const [path, search = ''] = (hash || '#/').replace(/^#/, '').split('?');
    const params = new URLSearchParams(search);
    return { path: path || '/', params };
  }, [hash]);

  function goto(path) {
    window.location.hash = path;
  }

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <div className="logo-dot" aria-hidden="true" />
          <div className="brand-name">Contract Insight</div>
        </div>
        <nav className="nav">
          <a
            className={`nav-link ${currentPath.path === '/' ? 'active' : ''}`}
            href="#/"
          >
            <span className="nav-ico" aria-hidden="true">🏠</span>
            <span>Dashboard</span>
          </a>
          <a
            className={`nav-link ${currentPath.path === '/contract' ? 'active' : ''}`}
            href="#/contract"
          >
            <span className="nav-ico" aria-hidden="true">📄</span>
            <span>Contract</span>
          </a>
        </nav>
        <div className="sidebar-footer">
          <a className="nav-link muted" href="https://docs.kavia.ai" target="_blank" rel="noreferrer">
            <span className="nav-ico" aria-hidden="true">📘</span>
            <span>Docs</span>
          </a>
        </div>
      </aside>

      {/* Main area */}
      <div className="main-area">
        {/* Top bar with user/profile actions */}
        <header className="topbar" aria-label="Top bar">
          <div className="topbar-left">
            <button className="ghost-btn" onClick={() => goto('#/')} title="Go to Dashboard">Dashboard</button>
            <span className="sep" />
            <button className="ghost-btn" onClick={() => goto('#/contract')} title="Go to Contract">Contract</button>
          </div>
          <div className="topbar-right">
            <button
              className="chip-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title="Toggle theme"
            >
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
            <div className="profile">
              <div className="avatar" aria-hidden="true">👤</div>
              <div className="who">
                <div className="who-name">Guest</div>
                <div className="who-sub">viewer</div>
              </div>
            </div>
          </div>
        </header>

        <main className="content">
          {currentPath.path === '/' && <Dashboard />}
          {currentPath.path === '/contract' && (
            <ContractDetail contractId={currentPath.params.get('contractId') || ''} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
