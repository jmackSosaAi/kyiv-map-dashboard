import { formatMeters, formatSeconds } from '../utils/geo';

export default function RoutePanel({ result, error, onClear }) {
  if (!result && !error) return null;

  return (
    <div className="route-panel">
      {error ? (
        <>
          <strong>Route error:</strong> {error}
        </>
      ) : (
        <>
          <div className="route-line">
            <span className="route-od">{result.originName}</span>
            <span className="route-arrow">→</span>
            <span className="route-od">{result.destName}</span>
          </div>
          <div className="route-stats">
            <span><strong>{formatSeconds(result.durationSeconds)}</strong></span>
            <span>{formatMeters(result.distanceMeters)}</span>
            <span className="mode-tag">{result.mode}</span>
          </div>
        </>
      )}
      <button className="btn small" onClick={onClear}>Clear route</button>
    </div>
  );
}
