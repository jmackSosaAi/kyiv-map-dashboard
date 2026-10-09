import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../utils/loadGoogleMaps';

export default function StreetViewPano({ lat, lng, onClose }) {
  const containerRef = useRef(null);
  const mountedRef = useRef(false);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    // Guard against React StrictMode double-mount
    if (mountedRef.current) return;
    mountedRef.current = true;

    let cancelled = false;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled) return;
        const service = new google.maps.StreetViewService();
        service.getPanorama(
          {
            location: { lat, lng },
            radius: 100,
            source: google.maps.StreetViewSource.OUTDOOR,
          },
          (data, svStatus) => {
            if (cancelled) return;
            if (svStatus === google.maps.StreetViewStatus.OK) {
              const position = data.location.latLng;
              const heading = data.tiles?.centerHeading ?? 0;
              new google.maps.StreetViewPanorama(containerRef.current, {
                position,
                pov: { heading, pitch: 0 },
                zoom: 1,
                addressControl: false,
                fullscreenControl: false,
                motionTracking: false,
                motionTrackingControl: false,
                panControl: true,
                zoomControl: true,
              });
              setStatus('ready');
            } else {
              setStatus('noCoverage');
            }
          }
        );
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return (
    <div className="street-view-wrap">
      {status === 'loading' && (
        <div className="street-view-loading">Loading panorama…</div>
      )}
      {status === 'noCoverage' && (
        <div className="street-view-empty">
          <p>📷 No Street View coverage at this exact spot.</p>
          <p className="muted small">Try the external link below for the closest viewable area.</p>
        </div>
      )}
      {status === 'error' && (
        <div className="street-view-empty">
          <p>Couldn't load Street View — check Google Maps API key &amp; Maps JavaScript API.</p>
        </div>
      )}
      <div
        ref={containerRef}
        className="street-view-canvas"
        style={{ display: status === 'ready' ? 'block' : 'none' }}
      />
      <button
        className="street-view-close"
        onClick={onClose}
        aria-label="Close Street View"
      >
        ×
      </button>
    </div>
  );
}
