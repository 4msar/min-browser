import { useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Search,
  X,
  ExternalLink,
  Tag,
  Trash2,
} from 'lucide-react';
import { useBrowserStore } from '../store/browserStore';
import { addBookmark, removeBookmark } from '../hooks/useTauri';

interface BookmarksPanelProps {
  onNavigate: (url: string) => void;
}

export function BookmarksPanel({ onNavigate }: BookmarksPanelProps) {
  const bookmarks = useBrowserStore((s) => s.bookmarks);
  const activeTab = useBrowserStore((s) => s.getActiveTab());
  const [search, setSearch] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [addingTags, setAddingTags] = useState<string[]>([]);

  const filtered = bookmarks.filter(
    (b) =>
      !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.url.toLowerCase().includes(search.toLowerCase()) ||
      b.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const isCurrentBookmarked = bookmarks.some(
    (b) => b.url === activeTab?.url
  );

  const handleBookmarkCurrent = async () => {
    if (!activeTab?.url || activeTab.url === 'about:blank') return;
    if (isCurrentBookmarked) {
      const bm = bookmarks.find((b) => b.url === activeTab.url);
      if (bm) await removeBookmark(bm.id);
    } else {
      await addBookmark(activeTab.url, activeTab.title || activeTab.url, addingTags);
      setAddingTags([]);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !addingTags.includes(tag)) {
      setAddingTags((prev) => [...prev, tag]);
    }
    setTagInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
      {/* Bookmark current page */}
      {activeTab?.url && activeTab.url !== 'about:blank' && (
        <div
          style={{
            padding: '10px 8px',
            borderRadius: 8,
            background: 'var(--browser-bg)',
            border: '1px solid var(--browser-border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--browser-text)' }}>
              {isCurrentBookmarked ? 'Bookmarked' : 'Bookmark this page'}
            </span>
            <button
              onClick={handleBookmarkCurrent}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 6,
                border: 'none',
                background: isCurrentBookmarked ? 'var(--browser-accent)' : 'var(--browser-border)',
                color: isCurrentBookmarked ? '#fff' : 'var(--browser-text)',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              {isCurrentBookmarked ? (
                <><BookmarkCheck size={12} /> Remove</>
              ) : (
                <><Bookmark size={12} /> Add</>
              )}
            </button>
          </div>

          {/* Tags input */}
          {!isCurrentBookmarked && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {addingTags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 2,
                    padding: '2px 6px',
                    borderRadius: 100,
                    background: 'var(--browser-active)',
                    fontSize: 11,
                    color: 'var(--browser-text)',
                  }}
                >
                  {tag}
                  <button
                    onClick={() =>
                      setAddingTags((prev) => prev.filter((t) => t !== tag))
                    }
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={9} />
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag…"
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: 11,
                  color: 'var(--browser-text)',
                  minWidth: 60,
                }}
              />
            </div>
          )}
        </div>
      )}

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
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search bookmarks…"
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
            onClick={() => setSearch('')}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--browser-text-muted)', padding: 0 }}
          >
            <X size={11} />
          </button>
        )}
      </div>

      {/* Bookmark list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 0',
              color: 'var(--browser-text-muted)',
              fontSize: 12,
            }}
          >
            {search ? 'No bookmarks match your search' : 'No bookmarks yet'}
          </div>
        ) : (
          filtered.map((bookmark) => (
            <div
              key={bookmark.id}
              style={{
                padding: '8px 4px',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                borderBottom: '1px solid var(--browser-border)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <button
                  onClick={() => onNavigate(bookmark.url)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'var(--browser-text)',
                    fontSize: 12,
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={bookmark.url}
                >
                  {bookmark.title || bookmark.url}
                </button>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--browser-text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: 1,
                  }}
                >
                  {bookmark.url}
                </div>
                {bookmark.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                    {bookmark.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 2,
                          padding: '1px 6px',
                          borderRadius: 100,
                          background: 'var(--browser-active)',
                          fontSize: 10,
                          color: 'var(--browser-text-muted)',
                        }}
                      >
                        <Tag size={8} /> {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button
                  onClick={() => onNavigate(bookmark.url)}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: 'var(--browser-text-muted)',
                    padding: 2,
                    borderRadius: 4,
                  }}
                  title="Open"
                  aria-label={`Open ${bookmark.title}`}
                >
                  <ExternalLink size={12} />
                </button>
                <button
                  onClick={() => removeBookmark(bookmark.id)}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: 'var(--browser-text-muted)',
                    padding: 2,
                    borderRadius: 4,
                  }}
                  title="Remove bookmark"
                  aria-label={`Remove bookmark ${bookmark.title}`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
