import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { PrefsProvider } from './lib/prefs';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrefsProvider>
      {/* HashRouter keeps routing working under a GitHub Pages subdirectory
          with no server rewrites. */}
      <HashRouter>
        <App />
      </HashRouter>
    </PrefsProvider>
  </React.StrictMode>,
);
