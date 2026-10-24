import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePrefs } from './prefs';
import { applyCloakChrome, matchesShortcut, restoreChrome } from './cloak';

interface CloakContextValue {
  active: boolean;
  activate: () => void;
  deactivate: () => void;
  toggle: () => void;
  /** Panic redirect to the user-chosen site (if set). */
  redirect: () => void;
  hasRedirect: boolean;
}

const CloakContext = createContext<CloakContextValue | null>(null);

/** Tell every iframe on the page to pause/resume. Local games listen for these
 *  messages (see public/games/shell.js). Cross-origin frames ignore them; the
 *  Browser page separately blanks its proxy frame while cloaked. */
function broadcast(type: 'orbit-pause' | 'orbit-resume') {
  document.querySelectorAll('iframe').forEach((f) => {
    try {
      f.contentWindow?.postMessage({ type }, '*');
    } catch {
      /* cross-origin frame: ignore */
    }
  });
}

export function CloakProvider({ children }: { children: ReactNode }) {
  const { prefs } = usePrefs();
  const [active, setActive] = useState(false);

  const activate = useCallback(() => {
    setActive(true);
    applyCloakChrome(prefs.cloak.title, prefs.cloak.faviconEmoji);
    broadcast('orbit-pause');
  }, [prefs.cloak.title, prefs.cloak.faviconEmoji]);

  const deactivate = useCallback(() => {
    setActive(false);
    restoreChrome();
    broadcast('orbit-resume');
  }, []);

  const toggle = useCallback(() => {
    setActive((cur) => {
      if (cur) {
        restoreChrome();
        broadcast('orbit-resume');
        return false;
      }
      applyCloakChrome(prefs.cloak.title, prefs.cloak.faviconEmoji);
      broadcast('orbit-pause');
      return true;
    });
  }, [prefs.cloak.title, prefs.cloak.faviconEmoji]);

  const redirect = useCallback(() => {
    const url = prefs.cloak.redirectUrl.trim();
    if (!url) return;
    try {
      window.location.assign(url);
    } catch {
      /* ignore */
    }
  }, [prefs.cloak.redirectUrl]);

  // Global keyboard shortcut. A plain (modifier-less) key is ignored while the
  // user is typing in a field, so it can still be typed normally.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!matchesShortcut(e, prefs.cloak.shortcut)) return;
      const noMod = !prefs.cloak.shortcut.ctrl && !prefs.cloak.shortcut.alt;
      const el = document.activeElement as HTMLElement | null;
      const editable =
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.isContentEditable);
      if (noMod && editable && !active) return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prefs.cloak.shortcut, toggle, active]);

  const value = useMemo<CloakContextValue>(
    () => ({
      active,
      activate,
      deactivate,
      toggle,
      redirect,
      hasRedirect: prefs.cloak.redirectUrl.trim().length > 0,
    }),
    [active, activate, deactivate, toggle, redirect, prefs.cloak.redirectUrl],
  );

  return <CloakContext.Provider value={value}>{children}</CloakContext.Provider>;
}

export function useCloak(): CloakContextValue {
  const ctx = useContext(CloakContext);
  if (!ctx) throw new Error('useCloak must be used within CloakProvider');
  return ctx;
}
