import { Plus, X, Loader2 } from 'lucide-react';
import { useBrowserStore } from '../store/browserStore';
import type { Tab } from '../types';

interface TabBarProps {
  onNewTab: () => void;
  onCloseTab: (tabId: string) => void;
  onSelectTab: (tabId: string) => void;
}

function getFaviconUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}/favicon.ico`;
  } catch {
    return null;
  }
}

function TabItem({
  tab,
  isActive,
  onSelect,
  onClose,
}: {
  tab: Tab;
  isActive: boolean;
  onSelect: () => void;
  onClose: (e: React.MouseEvent) => void;
}) {
  const favicon = tab.favicon ?? getFaviconUrl(tab.url);

  return (
    <div
      className={`tab-item ${isActive ? 'active' : ''}`}
      onClick={onSelect}
      title={tab.title || tab.url}
      role="tab"
      aria-selected={isActive}
    >
      {/* Favicon / loader */}
      <span style={{ width: 14, height: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {tab.loading ? (
          <Loader2 size={12} className="loading-spinner" />
        ) : favicon ? (
          <img
            src={favicon}
            width={12}
            height={12}
            alt=""
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : null}
      </span>

      <span className="tab-title">
        {tab.title || (tab.url ? tab.url : 'New Tab')}
      </span>

      <button
        className="tab-close"
        onClick={onClose}
        aria-label={`Close ${tab.title || 'tab'}`}
        tabIndex={-1}
      >
        <X size={11} />
      </button>
    </div>
  );
}

export function TabBar({ onNewTab, onCloseTab, onSelectTab }: TabBarProps) {
  const tabs = useBrowserStore((s) => s.tabs);
  const activeTabId = useBrowserStore((s) => s.activeTabId);
  const activeTaskId = useBrowserStore((s) => s.activeTaskId);

  // Only show tabs for the active task
  const visibleTabs = tabs.filter((t) => t.taskId === activeTaskId);

  return (
    <div className="tab-bar" role="tablist" aria-label="Browser tabs">
      {visibleTabs.map((tab) => (
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
          onSelect={() => onSelectTab(tab.id)}
          onClose={(e) => {
            e.stopPropagation();
            onCloseTab(tab.id);
          }}
        />
      ))}

      {/* New tab button */}
      <button
        className="nav-btn"
        onClick={onNewTab}
        title="New Tab (Ctrl+T)"
        aria-label="Open new tab"
        style={{ flexShrink: 0, marginLeft: 2 }}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
