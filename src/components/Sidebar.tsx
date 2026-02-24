
import { X, Bookmark, Clock, Settings, LayoutGrid } from 'lucide-react';
import { useBrowserStore } from '../store/browserStore';
import { BookmarksPanel } from './BookmarksPanel';
import { HistoryPanel } from './HistoryPanel';
import { SettingsPanel } from './SettingsPanel';
import { TasksPanel } from './TasksPanel';
import type { SidebarPanel } from '../types';

interface SidebarProps {
  onNavigate: (url: string) => void;
  onCreateTask: (name: string) => void;
  onSwitchTask: (taskId: string) => void;
  onCloseTask: (taskId: string) => void;
}

const PANEL_TITLES: Record<NonNullable<SidebarPanel>, string> = {
  bookmarks: 'Bookmarks',
  history: 'History',
  settings: 'Settings',
  tasks: 'Tasks',
};

export function Sidebar({
  onNavigate,
  onCreateTask,
  onSwitchTask,
  onCloseTask,
}: SidebarProps) {
  const sidebarOpen = useBrowserStore((s) => s.sidebarOpen);
  const sidebarPanel = useBrowserStore((s) => s.sidebarPanel);
  const closeSidebar = useBrowserStore((s) => s.closeSidebar);

  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : ''}`} aria-hidden={!sidebarOpen}>
      {/* Header */}
      <div className="sidebar-header">
        <span>{sidebarPanel ? PANEL_TITLES[sidebarPanel] : 'Menu'}</span>
        <button
          onClick={closeSidebar}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: 'var(--browser-text-muted)',
            padding: 4,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Close sidebar"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="sidebar-content">
        {sidebarPanel === 'bookmarks' && (
          <BookmarksPanel onNavigate={(url) => { onNavigate(url); closeSidebar(); }} />
        )}
        {sidebarPanel === 'history' && (
          <HistoryPanel onNavigate={(url) => { onNavigate(url); closeSidebar(); }} />
        )}
        {sidebarPanel === 'settings' && <SettingsPanel />}
        {sidebarPanel === 'tasks' && (
          <TasksPanel
            onCreateTask={onCreateTask}
            onSwitchTask={(taskId) => { onSwitchTask(taskId); closeSidebar(); }}
            onCloseTask={onCloseTask}
          />
        )}
      </div>
    </div>
  );
}

// ─── Sidebar toggle buttons (shown in the navigation bar) ─────────────────────

interface SidebarButtonsProps {
  onToggle: (panel: SidebarPanel) => void;
}

export function SidebarButtons({ onToggle }: SidebarButtonsProps) {
  const sidebarPanel = useBrowserStore((s) => s.sidebarPanel);
  const sidebarOpen = useBrowserStore((s) => s.sidebarOpen);

  const isActive = (panel: NonNullable<SidebarPanel>) =>
    sidebarOpen && sidebarPanel === panel;

  const btnStyle = (panel: NonNullable<SidebarPanel>) => ({
    background: isActive(panel) ? 'var(--browser-active)' : 'transparent',
    color: isActive(panel) ? 'var(--browser-accent)' : 'var(--browser-text-muted)',
  });

  return (
    <div style={{ display: 'flex', gap: 2 }}>
      <button
        className="nav-btn"
        onClick={() => onToggle('tasks')}
        style={btnStyle('tasks')}
        title="Tasks (Ctrl+Shift+T)"
        aria-label="Tasks"
      >
        <LayoutGrid size={15} />
      </button>
      <button
        className="nav-btn"
        onClick={() => onToggle('bookmarks')}
        style={btnStyle('bookmarks')}
        title="Bookmarks (Ctrl+Shift+B)"
        aria-label="Bookmarks"
      >
        <Bookmark size={15} />
      </button>
      <button
        className="nav-btn"
        onClick={() => onToggle('history')}
        style={btnStyle('history')}
        title="History (Ctrl+Shift+H)"
        aria-label="History"
      >
        <Clock size={15} />
      </button>
      <button
        className="nav-btn"
        onClick={() => onToggle('settings')}
        style={btnStyle('settings')}
        title="Settings"
        aria-label="Settings"
      >
        <Settings size={15} />
      </button>
    </div>
  );
}
