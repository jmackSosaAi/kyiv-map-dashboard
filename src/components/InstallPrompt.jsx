import { useEffect, useState } from 'react';

const LS_KEY = 'kmd.v2.installDismissed';

function isIosSafari() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosBanner, setShowIosBanner] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(LS_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (dismissed) return;

    if (isIosSafari()) {
      // On iOS, check if already running as standalone (already installed)
      if (!window.navigator.standalone) {
        setShowIosBanner(true);
      }
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(LS_KEY, 'true');
    } catch {}
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIosBanner(false);
  };

  const handleInstall = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      setDeferredPrompt(null);
    });
  };

  if (dismissed) return null;
  if (!deferredPrompt && !showIosBanner) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: '#1e293b',
        color: '#f1f5f9',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        maxWidth: 'calc(100vw - 32px)',
        width: '360px',
        fontSize: '14px',
      }}
      role="banner"
      aria-label="Install app prompt"
    >
      <span style={{ fontSize: '22px' }}>📲</span>
      <span style={{ flex: 1, lineHeight: 1.4 }}>
        {showIosBanner
          ? 'Tap Share → Add to Home Screen to install.'
          : 'Install Kyiv Dashboard — Get one-tap access'}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
        {deferredPrompt && (
          <button
            onClick={handleInstall}
            style={{
              background: '#facc15',
              color: '#0b1220',
              border: 'none',
              borderRadius: '6px',
              padding: '5px 12px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Install
          </button>
        )}
        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            color: '#94a3b8',
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '5px 12px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
