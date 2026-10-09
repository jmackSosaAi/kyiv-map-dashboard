import { useRef, useState } from 'react';
import { placesToCsv, csvToPlaces, downloadCsv } from '../utils/csv';
import kyivSeedCsv from '../data/kyivSeed.csv?raw';

export default function StoragePanel({ allPlaces, onImportPlaces, onResetData }) {
  const fileRef = useRef(null);
  const [status, setStatus] = useState(null);

  function handleExport() {
    const ts = new Date().toISOString().slice(0, 10);
    downloadCsv(`kyiv-places-${ts}.csv`, placesToCsv(allPlaces));
    setStatus(`Exported ${allPlaces.length} places.`);
  }

  function handlePickFile() {
    fileRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => setStatus('Could not read the file.');
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const { places, warnings } = csvToPlaces(text);
        if (places.length === 0) {
          setStatus(warnings.join(' ') || 'No rows imported.');
          return;
        }
        onImportPlaces(places);
        const msg = `Imported ${places.length} place${places.length === 1 ? '' : 's'}.`;
        setStatus(warnings.length ? `${msg}\n${warnings.length} warning${warnings.length === 1 ? '' : 's'}:\n- ${warnings.join('\n- ')}` : msg);
      } catch (err) {
        setStatus(`Import failed: ${err.message || err}`);
      }
    };
    reader.readAsText(file);
  }

  function handleLoadSeed() {
    if (!window.confirm('Add the Kyiv seed list (~30 places) to your local data?')) return;
    const { places, warnings } = csvToPlaces(kyivSeedCsv);
    onImportPlaces(places);
    const msg = `Loaded ${places.length} seed places.`;
    setStatus(warnings.length ? `${msg}\n${warnings.length} warning${warnings.length === 1 ? '' : 's'}` : msg);
  }

  function handleReset() {
    const ok = window.confirm(
      'Reset all local data?\n\nThis clears your saved places, filters, status flags, and preferences.\n\n' +
      'Click "Export CSV" first if you want a backup.'
    );
    if (!ok) return;
    onResetData();
  }

  return (
    <div className="filter">
      <div className="filter-header"><span>Storage</span></div>
      <div className="storage-grid">
        <button className="btn small" onClick={handleExport}>Export CSV</button>
        <button className="btn small" onClick={handlePickFile}>Import CSV…</button>
        <button className="btn small" onClick={handleLoadSeed}>Load Kyiv seed</button>
        <button className="btn small danger" onClick={handleReset}>Reset local data</button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {status && <pre className="storage-status">{status}</pre>}
    </div>
  );
}
