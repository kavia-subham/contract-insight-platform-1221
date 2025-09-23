import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import ContractDetail from './components/ContractDetail';

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Simple routing based on hash: #/ (dashboard) and #/contract?contractId=...
  const [hash, setHash] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handler = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  // parse contractId from search
  const currentPath = useMemo(() => {
    const [path, search = ''] = hash.replace(/^#/, '').split('?');
    const params = new URLSearchParams(search);
    return { path: path || '/', params };
  }, [hash]);

  return (
    <div className="App">
      <header className="App-header" style={{ minHeight: 'auto', padding: '1rem' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <nav style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <a className="App-link" href="#/">Dashboard</a>
            <a className="App-link" href="#/contract">Contract Detail</a>
          </nav>
        </div>
      </header>

      <main>
        {currentPath.path === '/' && <Dashboard />}
        {currentPath.path === '/contract' && (
          <ContractDetail contractId={currentPath.params.get('contractId') || ''} />
        )}
      </main>
    </div>
  );
}

export default App;
