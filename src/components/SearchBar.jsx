import { useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import { getCategory } from '../utils/categoryStyles';

export default function SearchBar({ places, value, onChange, onSelectPlace }) {
  const [activeIdx, setActiveIdx] = useState(-1);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const fuse = useMemo(
    () =>
      new Fuse(places, {
        keys: [
          { name: 'name', weight: 0.7 },
          { name: 'address', weight: 0.15 },
          { name: 'neighborhood', weight: 0.1 },
          { name: 'category', weight: 0.05 }
        ],
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 2
      }),
    [places]
  );

  const suggestions = useMemo(() => {
    if (value.trim().length < 2) return [];
    return fuse.search(value).slice(0, 8).map((r) => r.item);
  }, [fuse, value]);

  const showDrop = open && suggestions.length > 0;

  function select(place) {
    onSelectPlace(place.id);
    onChange('');
    setOpen(false);
    setActiveIdx(-1);
  }

  function handleKeyDown(e) {
    if (!showDrop) {
      if (e.key === 'Escape') { onChange(''); setActiveIdx(-1); }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = activeIdx >= 0 ? suggestions[activeIdx] : suggestions[0];
      if (target) select(target);
    } else if (e.key === 'Escape') {
      onChange('');
      setOpen(false);
      setActiveIdx(-1);
    }
  }

  function handleChange(e) {
    onChange(e.target.value);
    setOpen(true);
    setActiveIdx(-1);
  }

  function handleBlur() {
    setTimeout(() => { setOpen(false); setActiveIdx(-1); }, 150);
  }

  return (
    <div className="search-wrap" role="combobox" aria-expanded={showDrop} aria-haspopup="listbox">
      <input
        ref={inputRef}
        className="search-input"
        type="search"
        placeholder="Search restaurants, bars, theaters…"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        aria-autocomplete="list"
        aria-controls="search-suggestions-list"
      />
      {showDrop && (
        <ul className="search-suggestions" id="search-suggestions-list" role="listbox">
          {suggestions.map((place, i) => {
            const cat = getCategory(place.category);
            return (
              <li
                key={place.id}
                className={`search-suggestion${i === activeIdx ? ' highlighted' : ''}`}
                role="option"
                aria-selected={i === activeIdx}
                onMouseDown={() => select(place)}
                onMouseEnter={() => setActiveIdx(i)}
              >
                <span className="dot" style={{ background: cat.color, flexShrink: 0 }} />
                <span className="search-suggestion-text">
                  <span className="search-suggestion-name">{place.name}</span>
                  <span className="search-suggestion-meta">
                    {cat.label}{place.neighborhood ? ` • ${place.neighborhood}` : ''}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
