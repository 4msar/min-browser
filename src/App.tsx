import { useEffect } from 'react';
import { useBrowserStore } from './store/browserStore';
import {
  useTauri,
  useTabManager,
  useKeyboardShortcuts,
} from './hooks/useTauri';
import { TabBar } from './components/TabBar';
import { NavigationBar } from './components/NavigationBar';
import { NewTabPage } from './components/NewTabPage';
import { Sidebar, SidebarButtons } from './components/Sidebar';
import type { SidebarPanel } from './types';

function App() {
  // Load data from Tauri backend
  useTauri();

  const settings = useBrowserStore((s) => s.settings);
  const activeTab = useBrowserStore((s) => s.getActiveTab());
  const toggleSidebar = useBrowserStore((s) => s.toggleSidebar);
  const createTask = useBrowserStore((s) => s.createTask);
  const setActiveTask = useBrowserStore((s) => s.setActiveTask);
  const removeTask = useBrowserStore((s) => s.removeTask);

  const tabManager = useTabManager();
  useKeyboardShortcuts(tabManager);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    const { theme } = settings;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  // Listen to system theme changes
  useEffect(() => {
    if (settings.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings.theme]);

  const handleNavigate = (query: string) => {
    if (!activeTab) {
      tabManager.openTab(query);
    } else {
      tabManager.navigate(query);
    }
  };

  const handleNewTab = () => {
    tabManager.openTab('');
  };

  const handleCloseTab = (tabId: string) => {
    tabManager.closeTab(tabId);
  };

  const handleSelectTab = (tabId: string) => {
    tabManager.activateTab(tabId);
  };

  const handleBack = () => tabManager.goBack();
  const handleForward = () => tabManager.goForward();
  const handleReload = () => tabManager.reload();
  const handleHome = () => {
    const homeUrl = settings.homepage || '';
    handleNavigate(homeUrl || '');
  };

  const handleToggleSidebar = (panel: SidebarPanel) => {
    toggleSidebar(panel);
  };

  const handleCreateTask = (name: string) => {
    const taskId = createTask(name);
    tabManager.openTab('', taskId);
  };

  const handleSwitchTask = (taskId: string) => {
    setActiveTask(taskId);
  };

  const handleCloseTask = (taskId: string) => {
    removeTask(taskId);
  };

  // Determine if we show the new tab page
  const showNewTabPage = !activeTab?.url || activeTab.url === 'about:blank';

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--browser-bg)',
      }}
    >
      {/* ── Browser Chrome ────────────────────────────────────────────────────── */}
      <div className="browser-chrome">
        {/* Tab bar */}
        <TabBar
          onNewTab={handleNewTab}
          onCloseTab={handleCloseTab}
          onSelectTab={handleSelectTab}
        />

        {/* Navigation bar + sidebar toggles */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <NavigationBar
            onNavigate={handleNavigate}
            onBack={handleBack}
            onForward={handleForward}
            onReload={handleReload}
            onHome={handleHome}
          />
          <div style={{ paddingRight: 8 }}>
            <SidebarButtons onToggle={handleToggleSidebar} />
          </div>
        </div>
      </div>

      {/* ── Content area ──────────────────────────────────────────────────────── */}
      <div className="browser-content">
        {showNewTabPage ? (
          <NewTabPage onNavigate={handleNavigate} />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 12,
              color: 'var(--browser-text-muted)',
              fontSize: 13,
            }}
          >
            {/* 
              The actual web content is rendered in a separate Tauri WebviewWindow.
              This area serves as the visual placeholder / new-tab page for the chrome UI.
              When a URL is loaded, the tab's WebviewWindow is displayed over this area.
            */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {activeTab?.loading ? (
                <>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      border: '3px solid var(--browser-border)',
                      borderTopColor: 'var(--browser-accent)',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  <span>Loading {activeTab.url}…</span>
                </>
              ) : (
                <span style={{ fontSize: 12 }}>
                  Page opened in browser window
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Sidebar ────────────────────────────────────────────────────────────── */}
      <Sidebar
        onNavigate={handleNavigate}
        onCreateTask={handleCreateTask}
        onSwitchTask={handleSwitchTask}
        onCloseTask={handleCloseTask}
      />
    </div>
  );
}

export default App;
