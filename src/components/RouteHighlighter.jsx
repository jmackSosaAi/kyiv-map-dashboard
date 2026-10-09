export default function RouteHighlighter({
  routeMode,
  onStartRouteMode,
  onCancelRouteMode,
  onClearRoute,
  originPlace,
  hasActiveRoute
}) {
  if (routeMode?.stage === 'pickOrigin') {
    return (
      <div className="route-highlighter filter">
        <p className="route-step">Pick an origin — click any place on the map or sidebar.</p>
        <button className="btn block small" onClick={onCancelRouteMode}>Cancel</button>
      </div>
    );
  }

  if (routeMode?.stage === 'pickDest') {
    return (
      <div className="route-highlighter filter">
        <p className="route-step">From: <strong>{originPlace?.name ?? '…'}</strong> — pick a destination.</p>
        <button className="btn block small" onClick={onCancelRouteMode}>Cancel</button>
      </div>
    );
  }

  if (hasActiveRoute) {
    return (
      <div className="route-highlighter filter">
        <button className="btn block small" onClick={onClearRoute}>Clear route</button>
      </div>
    );
  }

  return (
    <div className="route-highlighter filter">
      <button className="btn block" onClick={onStartRouteMode}>🗺️ Create route</button>
    </div>
  );
}
