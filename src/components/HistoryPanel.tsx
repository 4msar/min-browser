import { useState } from 'react';
import { Search, X, Trash2, Clock } from 'lucide-react';
import { useBrowserStore } from '../store/browserStore';
import { clearHistory, searchHistory } from '../hooks/useTauri';

interface HistoryPanelProps {
  onNavigate: (url: string) => void;
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  } catch {
    return '';
  }
}

export function HistoryPanel({ onNavigate }: HistoryPanelProps) {
  const history = useBrowserStore((s) => s.history);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<typeof history | null>(null);

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (q.trim()) {
      const results = await searchHistory(q);
      setSearchResults(results);
    } else {
      setSearchResults(null);
    }
  };

  const handleClearHistory = async () => {
    if (confirm('Clear all browsing history?')) {
      await clearHistory();
    }
  };

  const displayed = searchResults ?? history;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
      {/* Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '0 8px',
          background: 'var(--browser-bg)',
          borderRadius: 6,
          border: '1px solid var(--browser-border)',
          height: 32,
        }}
      >
        <Search size={12} style={{ color: 'var(--browser-text-muted)', flexShrink: 0 }} />
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search history…"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 12,
            color: 'var(--browser-text)',
          }}
        />
        {search && (
          <button
            onClick={() => handleSearch('')}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--browser-text-muted)', padding: 0 }}
          >
            <X size={11} />
          </button>
        )}
      </div>

      {/* Clear all */}
      {history.length > 0 && (
        <button
          onClick={handleClearHistory}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 8px',
            border: '1px solid var(--browser-border)',
            borderRadius: 6,
            background: 'transparent',
            color: 'var(--browser-text-muted)',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          <Trash2 size={12} /> Clear History
        </button>
      )}

      {/* History list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {displayed.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 0',
              color: 'var(--browser-text-muted)',
              fontSize: 12,
            }}
          >
            {search ? 'No history matches your search' : 'No history yet'}
          </div>
        ) : (
          displayed.map((entry) => (
            <button
              key={entry.id}
              onClick={() => onNavigate(entry.url)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                textAlign: 'left',
                padding: '8px 4px',
                border: 'none',
                borderBottom: '1px solid var(--browser-border)',
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: 4,
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  'var(--browser-hover)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  'transparent')
              }
            >
              <Clock
                size={12}
                style={{ color: 'var(--browser-text-muted)', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--browser-text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.title || entry.url}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--browser-text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.url}
                </div>
              </div>
              <span style={{ fontSize: 10, color: 'var(--browser-text-muted)', flexShrink: 0 }}>
                {formatDate(entry.visited_at)}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
