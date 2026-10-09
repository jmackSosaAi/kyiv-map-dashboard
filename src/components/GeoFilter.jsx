import { GEO_FILTERS } from '../utils/placeFilters';
import { NEAR_RADIUS_M, BETWEEN_CORRIDOR_M, formatMeters } from '../utils/geo';

export default function GeoFilter({ value, onChange, hasHome, hasOffice }) {
  const disabledFor = (id) => {
    if (id === 'nearHome' && !hasHome) return true;
    if (id === 'nearOffice' && !hasOffice) return true;
    if (id === 'between' && (!hasHome || !hasOffice)) return true;
    return false;
  };

  return (
    <div className="filter">
      <div className="filter-header">
        <span>Location filter</span>
      </div>
      <ul className="filter-list">
        {GEO_FILTERS.map((f) => {
          const disabled = disabledFor(f.id);
          const on = value === f.id;
          return (
            <li key={f.id}>
              <label className={`filter-row${on ? ' on' : ''}${disabled ? ' disabled' : ''}`}>
                <input
                  type="radio"
                  name="geo-filter"
                  checked={on}
                  disabled={disabled}
                  onChange={() => onChange(f.id)}
                />
                <span className="label">{f.label}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="filter-hint">
        Near = within {formatMeters(NEAR_RADIUS_M)}. Between = within {formatMeters(BETWEEN_CORRIDOR_M)} of the Home↔Office line.
      </p>
    </div>
  );
}
