import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { readJSON, removeKeys, writeJSON } from './storage';
import type {
  Accent,
  AppEntry,
  BackendConfig,
  CloakSettings,
  Prefs,
  RecentEntry,
} from '../types';

const KEY = 'orbit:prefs:v1';
const MAX_RECENTS = 24;

export const DEFAULT_CLOAK: CloakSettings = {
  title: 'New Tab',
  faviconEmoji: '📄',
  shortcut: { key: '`', ctrl: false, alt: false, shift: false },
  redirectUrl: '',
};

const DEFAULT_BACKEND: BackendConfig = { url: '', token: '' };

function systemReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function defaults(): Prefs {
  return {
    accent: 'purple',
    reducedMotion: systemReducedMotion(),
    favorites: [],
    recents: [],
    cloak: DEFAULT_CLOAK,
    backend: DEFAULT_BACKEND,
    customApps: [],
    cloakNote: '',
  };
}

function load(): Prefs {
  const base = defaults();
  const saved = readJSON<Partial<Prefs>>(KEY, {});
  return {
    ...base,
    ...saved,
    cloak: { ...base.cloak, ...(saved.cloak ?? {}) },
    backend: { ...base.backend, ...(saved.backend ?? {}) },
    favorites: saved.favorites ?? base.favorites,
    recents: saved.recents ?? base.recents,
    customApps: saved.customApps ?? base.customApps,
  };
}

interface PrefsContextValue {
  prefs: Prefs;
  setAccent: (a: Accent) => void;
  setReducedMotion: (v: boolean) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  pushRecent: (id: string) => void;
  clearRecents: () => void;
  setCloak: (patch: Partial<CloakSettings>) => void;
  setBackend: (patch: Partial<BackendConfig>) => void;
  setCloakNote: (note: string) => void;
  addCustomApp: (app: Omit<AppEntry, 'id' | 'custom'>) => void;
  removeCustomApp: (id: string) => void;
  exportPrefs: () => string;
  importPrefs: (json: string) => boolean;
  clearAll: () => void;
}

const PrefsContext = createContext<PrefsContextValue | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(load);

  // Persist on every change.
  useEffect(() => {
    writeJSON(KEY, prefs);
  }, [prefs]);

  // Reflect accent + reduced-motion onto <html> so CSS can react.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-accent', prefs.accent);
    root.setAttribute('data-reduced-motion', String(prefs.reducedMotion));
  }, [prefs.accent, prefs.reducedMotion]);

  const setAccent = useCallback((accent: Accent) => {
    setPrefs((p) => ({ ...p, accent }));
  }, []);

  const setReducedMotion = useCallback((reducedMotion: boolean) => {
    setPrefs((p) => ({ ...p, reducedMotion }));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setPrefs((p) => {
      const has = p.favorites.includes(id);
      return {
        ...p,
        favorites: has ? p.favorites.filter((f) => f !== id) : [...p.favorites, id],
      };
    });
  }, []);

  const isFavorite = useCallback((id: string) => prefs.favorites.includes(id), [prefs.favorites]);

  const pushRecent = useCallback((id: string) => {
    setPrefs((p) => {
      const entry: RecentEntry = { id, at: Date.now() };
      const rest = p.recents.filter((r) => r.id !== id);
      return { ...p, recents: [entry, ...rest].slice(0, MAX_RECENTS) };
    });
  }, []);

  const clearRecents = useCallback(() => setPrefs((p) => ({ ...p, recents: [] })), []);

  const setCloak = useCallback((patch: Partial<CloakSettings>) => {
    setPrefs((p) => ({ ...p, cloak: { ...p.cloak, ...patch } }));
  }, []);

  const setBackend = useCallback((patch: Partial<BackendConfig>) => {
    setPrefs((p) => ({ ...p, backend: { ...p.backend, ...patch } }));
  }, []);

  const setCloakNote = useCallback((cloakNote: string) => {
    setPrefs((p) => ({ ...p, cloakNote }));
  }, []);

  const addCustomApp = useCallback((app: Omit<AppEntry, 'id' | 'custom'>) => {
    setPrefs((p) => ({
      ...p,
      customApps: [
        ...p.customApps,
        { ...app, id: `custom-${Date.now().toString(36)}`, custom: true },
      ],
    }));
  }, []);

  const removeCustomApp = useCallback((id: string) => {
    setPrefs((p) => ({ ...p, customApps: p.customApps.filter((a) => a.id !== id) }));
  }, []);

  const exportPrefs = useCallback(() => JSON.stringify(prefs, null, 2), [prefs]);

  const importPrefs = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json) as Partial<Prefs>;
      if (typeof parsed !== 'object' || parsed === null) return false;
      const base = defaults();
      setPrefs({
        ...base,
        ...parsed,
        cloak: { ...base.cloak, ...(parsed.cloak ?? {}) },
        backend: { ...base.backend, ...(parsed.backend ?? {}) },
        favorites: parsed.favorites ?? [],
        recents: parsed.recents ?? [],
        customApps: parsed.customApps ?? [],
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const clearAll = useCallback(() => {
    removeKeys([KEY]);
    setPrefs(defaults());
  }, []);

  const value = useMemo<PrefsContextValue>(
    () => ({
      prefs,
      setAccent,
      setReducedMotion,
      toggleFavorite,
      isFavorite,
      pushRecent,
      clearRecents,
      setCloak,
      setBackend,
      setCloakNote,
      addCustomApp,
      removeCustomApp,
      exportPrefs,
      importPrefs,
      clearAll,
    }),
    [
      prefs,
      setAccent,
      setReducedMotion,
      toggleFavorite,
      isFavorite,
      pushRecent,
      clearRecents,
      setCloak,
      setBackend,
      setCloakNote,
      addCustomApp,
      removeCustomApp,
      exportPrefs,
      importPrefs,
      clearAll,
    ],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): PrefsContextValue {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs must be used within PrefsProvider');
  return ctx;
}
