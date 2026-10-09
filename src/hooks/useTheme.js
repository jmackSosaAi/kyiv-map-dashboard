import { useCallback, useEffect, useState } from 'react';

const KEY = 'kmd.v2.theme';

function readPref() {
  if (typeof window === 'undefined') return 'auto';
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === null) return 'auto';
    const v = JSON.parse(raw);
    return v === 'light' || v === 'dark' || v === 'auto' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

function writePref(v) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    // ignore
  }
}

function systemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function resolve(pref) {
  return pref === 'auto' ? systemTheme() : pref;
}

export function useTheme() {
  const [pref, setPref] = useState(readPref);
  const [theme, setThemeState] = useState(() => resolve(readPref()));

  // Listen for system changes when in auto mode.
  useEffect(() => {
    if (pref !== 'auto') {
      setThemeState(pref);
      return;
    }
    setThemeState(systemTheme());
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (e) => setThemeState(e.matches ? 'light' : 'dark');
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, [pref]);

  // Apply data-theme to <html>.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = useCallback((v) => {
    const next = v === 'light' || v === 'dark' || v === 'auto' ? v : 'auto';
    writePref(next);
    setPref(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme, isAuto: pref === 'auto' };
}
