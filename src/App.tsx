import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import CloakOverlay from './components/CloakOverlay';
import Home from './pages/Home';
import Games from './pages/Games';
import Apps from './pages/Apps';
import Browser from './pages/Browser';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';
import Play from './pages/Play';
import NotFound from './pages/NotFound';
import { CloakProvider } from './lib/cloak-context';

export default function App() {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  return (
    <CloakProvider>
      <div className="app-shell">
        <Sidebar open={navOpen} />
        <div className={`scrim ${navOpen ? 'show' : ''}`} onClick={() => setNavOpen(false)} />
        <div className="main">
          <TopBar onMenu={() => setNavOpen((v) => !v)} />
          <div className="route-fade" key={location.pathname}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/games" element={<Games />} />
              <Route path="/apps" element={<Apps />} />
              <Route path="/browser" element={<Browser />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/play/:id" element={<Play />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
      </div>
      <CloakOverlay />
    </CloakProvider>
  );
}
