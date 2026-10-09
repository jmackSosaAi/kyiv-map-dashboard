import { useEffect, useRef, useState } from 'react';

// Simple JSON-backed localStorage state. Safe under SSR / blocked storage.
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Skip the very first write so we don't clobber existing keys with the default.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Quota / privacy mode -- silently ignore.
    }
  }, [key, value]);

  return [value, setValue];
}
