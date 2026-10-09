import { CATEGORIES } from '../utils/categoryStyles';

export default function CategoryFilter({ enabled, onToggle, onSetAll }) {
  return (
    <div className="filter">
      <div className="filter-header">
        <span>Categories</span>
        <div className="filter-actions">
          <button onClick={() => onSetAll(true)}>All</button>
          <button onClick={() => onSetAll(false)}>None</button>
        </div>
      </div>
      <ul className="filter-list">
        {CATEGORIES.map((c) => {
          const on = enabled.includes(c.id);
          return (
            <li key={c.id}>
              <label className={on ? 'filter-row on' : 'filter-row'}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => onToggle(c.id)}
                />
                <span className="dot" style={{ background: c.color }} />
                <span className="label">{c.label}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
