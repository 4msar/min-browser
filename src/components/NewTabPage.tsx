import React, { useState } from 'react';
import { Search, Globe, Clock, Bookmark } from 'lucide-react';
import { useBrowserStore } from '../store/browserStore';

interface NewTabPageProps {
  onNavigate: (url: string) => void;
}

const QUICK_LINKS = [
  { label: 'DuckDuckGo', url: 'https://duckduckgo.com' },
  { label: 'GitHub', url: 'https://github.com' },
  { label: 'Wikipedia', url: 'https://en.wikipedia.org' },
  { label: 'YouTube', url: 'https://youtube.com' },
];

export function NewTabPage({ onNavigate }: NewTabPageProps) {
  const [query, setQuery] = useState('');
  const bookmarks = useBrowserStore((s) => s.bookmarks);
  const history = useBrowserStore((s) => s.history);

  const recentHistory = history.slice(0, 5);
  const recentBookmarks = bookmarks.slice(0, 5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onNavigate(query.trim());
      setQuery('');
    }
  };

  return (
    <div className="new-tab-page">
      {/* Logo / Title */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--browser-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}
        >
          <Globe size={24} color="#fff" />
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: 'var(--browser-text)',
            margin: 0,
          }}
        >
          Min Browser
        </h1>
        <p style={{ color: 'var(--browser-text-muted)', marginTop: 4, fontSize: 13 }}>
          Fast, minimal, private
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 500 }}>
        <div className="new-tab-search">
          <Search size={18} style={{ color: 'var(--browser-text-muted)', flexShrink: 0 }} />
          <input
            className="new-tab-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or enter address…"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </form>

      {/* Quick links */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: 500,
        }}
      >
        {QUICK_LINKS.map((link) => (
          <button
            key={link.url}
            onClick={() => onNavigate(link.url)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--browser-border)',
              background: 'var(--browser-surface)',
              color: 'var(--browser-text)',
              cursor: 'pointer',
              fontSize: 13,
              transition: 'background-color 0.1s',
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLButtonElement).style.backgroundColor =
                'var(--browser-hover)')
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLButtonElement).style.backgroundColor =
                'var(--browser-surface)')
            }
          >
            {link.label}
          </button>
        ))}
      </div>

      {/* Recent history / bookmarks */}
      {(recentHistory.length > 0 || recentBookmarks.length > 0) && (
        <div
          style={{
            display: 'flex',
            gap: 24,
            maxWidth: 500,
            width: '100%',
          }}
        >
          {recentHistory.length > 0 && (
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8,
                  color: 'var(--browser-text-muted)',
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <Clock size={12} /> Recent
              </div>
              {recentHistory.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => onNavigate(entry.url)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--browser-text)',
                    cursor: 'pointer',
                    fontSize: 12,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) =>
                    ((e.target as HTMLButtonElement).style.backgroundColor =
                      'var(--browser-hover)')
                  }
                  onMouseLeave={(e) =>
                    ((e.target as HTMLButtonElement).style.backgroundColor =
                      'transparent')
                  }
                  title={entry.url}
                >
                  {entry.title || entry.url}
                </button>
              ))}
            </div>
          )}

          {recentBookmarks.length > 0 && (
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8,
                  color: 'var(--browser-text-muted)',
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <Bookmark size={12} /> Bookmarks
              </div>
              {recentBookmarks.map((bm) => (
                <button
                  key={bm.id}
                  onClick={() => onNavigate(bm.url)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--browser-text)',
                    cursor: 'pointer',
                    fontSize: 12,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) =>
                    ((e.target as HTMLButtonElement).style.backgroundColor =
                      'var(--browser-hover)')
                  }
                  onMouseLeave={(e) =>
                    ((e.target as HTMLButtonElement).style.backgroundColor =
                      'transparent')
                  }
                  title={bm.url}
                >
                  {bm.title || bm.url}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
