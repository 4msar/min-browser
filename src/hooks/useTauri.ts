import { invoke } from '@tauri-apps/api/core';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useRef } from 'react';
import { useBrowserStore } from '../store/browserStore';
import type { Bookmark, HistoryEntry, BrowserSettings } from '../types';

// ─── Tauri invocation helpers ──────────────────────────────────────────────────

export function useTauri() {
  const store = useBrowserStore();

  // Load initial data from Rust state
  const loadData = useCallback(async () => {
    try {
      const [bookmarks, history, settings] = await Promise.all([
        invoke<Bookmark[]>('get_bookmarks'),
        invoke<HistoryEntry[]>('get_history'),
        invoke<BrowserSettings>('get_settings'),
      ]);
      store.setBookmarks(bookmarks);
      store.setHistory(history);
      store.setSettings(settings);
    } catch (err) {
      console.error('Failed to load browser data:', err);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData();
  }, [loadData]);
}

// ─── Tab management hook ───────────────────────────────────────────────────────

export function useTabManager() {
  const store = useBrowserStore();
  const windowRefs = useRef<Map<string, WebviewWindow>>(new Map());

  /**
   * Open a new browser tab in a new WebviewWindow.
   */
  const openTab = useCallback(
    async (url: string, taskId?: string) => {
      const tabId = store.createTab(url, taskId);
      const tab = useBrowserStore
        .getState()
        .tabs.find((t) => t.id === tabId);
      if (!tab) return tabId;

      const resolvedUrl = url
        ? await invoke<string>('build_search_url', { query: url })
        : 'about:blank';

      try {
        const win = new WebviewWindow(tab.label, {
          url: resolvedUrl === 'about:blank' ? 'about:blank' : resolvedUrl,
          title: 'New Tab',
          width: 1200,
          height: 800,
          visible: false,
        });

        windowRefs.current.set(tab.label, win);

        // Listen for title changes
        win.listen<string>('tauri://title-changed', (event) => {
          store.updateTab(tabId, { title: event.payload ?? 'Untitled' });
        });

        // Listen for URL navigation (Tauri emits this on navigation)
        win.listen<{ url: string }>('tauri://navigation', (event) => {
          const newUrl = event.payload?.url ?? '';
          store.updateTab(tabId, { url: newUrl, loading: false });
          if (newUrl && newUrl !== 'about:blank') {
            addHistory(newUrl, useBrowserStore.getState().tabs.find(t => t.id === tabId)?.title ?? '');
          }
        });

        win.listen('tauri://load-start', () => {
          store.updateTab(tabId, { loading: true });
        });

        win.listen('tauri://load-end', () => {
          store.updateTab(tabId, { loading: false });
        });

        if (resolvedUrl !== 'about:blank') {
          store.updateTab(tabId, { url: resolvedUrl });
        }
      } catch (err) {
        console.error('Failed to create tab window:', err);
      }

      return tabId;
    },
    [store]
  );

  /**
   * Switch to a tab (show its window, hide others in the same task group view).
   */
  const activateTab = useCallback(
    async (tabId: string) => {
      store.setActiveTab(tabId);
      const tab = useBrowserStore.getState().tabs.find((t) => t.id === tabId);
      if (!tab) return;

      try {
        await invoke('show_tab', { label: tab.label });
      } catch (err) {
        // Window might not exist yet; try to create it
        console.warn('show_tab failed:', err);
      }
    },
    [store]
  );

  /**
   * Close a tab and its associated window.
   */
  const closeTab = useCallback(
    async (tabId: string) => {
      const tab = useBrowserStore.getState().tabs.find((t) => t.id === tabId);
      store.closeTab(tabId);

      if (tab) {
        try {
          await invoke('close_tab', { label: tab.label });
        } catch (err) {
          console.warn('close_tab failed:', err);
        }
        windowRefs.current.delete(tab.label);
      }
    },
    [store]
  );

  /**
   * Navigate the active tab to a URL or search query.
   */
  const navigate = useCallback(
    async (query: string, tabId?: string) => {
      const id = tabId ?? useBrowserStore.getState().activeTabId;
      if (!id) return;
      const tab = useBrowserStore.getState().tabs.find((t) => t.id === id);
      if (!tab) return;

      const url = await invoke<string>('build_search_url', { query });
      store.updateTab(id, { url, loading: true });

      try {
        await invoke('navigate_tab', { label: tab.label, url });
      } catch (err) {
        console.warn('navigate_tab failed, trying to create window:', err);
        await openTab(url, tab.taskId);
      }
    },
    [store, openTab]
  );

  const goBack = useCallback(async (tabId?: string) => {
    const id = tabId ?? useBrowserStore.getState().activeTabId;
    const tab = useBrowserStore.getState().tabs.find((t) => t.id === id);
    if (tab) await invoke('tab_go_back', { label: tab.label });
  }, []);

  const goForward = useCallback(async (tabId?: string) => {
    const id = tabId ?? useBrowserStore.getState().activeTabId;
    const tab = useBrowserStore.getState().tabs.find((t) => t.id === id);
    if (tab) await invoke('tab_go_forward', { label: tab.label });
  }, []);

  const reload = useCallback(async (tabId?: string) => {
    const id = tabId ?? useBrowserStore.getState().activeTabId;
    const tab = useBrowserStore.getState().tabs.find((t) => t.id === id);
    if (tab) await invoke('tab_reload', { label: tab.label });
  }, []);

  return { openTab, activateTab, closeTab, navigate, goBack, goForward, reload };
}

// ─── Bookmark helpers ──────────────────────────────────────────────────────────

export async function addBookmark(
  url: string,
  title: string,
  tags: string[] = []
): Promise<Bookmark | null> {
  try {
    const bookmark = await invoke<Bookmark>('add_bookmark', { url, title, tags });
    useBrowserStore.getState().addBookmark(bookmark);
    return bookmark;
  } catch (err) {
    console.error('add_bookmark failed:', err);
    return null;
  }
}

export async function removeBookmark(id: string): Promise<void> {
  try {
    await invoke('remove_bookmark', { id });
    useBrowserStore.getState().removeBookmark(id);
  } catch (err) {
    console.error('remove_bookmark failed:', err);
  }
}

export async function isBookmarked(url: string): Promise<boolean> {
  try {
    return await invoke<boolean>('is_bookmarked', { url });
  } catch {
    return false;
  }
}

// ─── History helpers ───────────────────────────────────────────────────────────

export async function addHistory(url: string, title: string): Promise<void> {
  try {
    await invoke('add_history', { url, title });
    const entry: HistoryEntry = {
      id: `h-${Date.now()}`,
      url,
      title,
      visited_at: new Date().toISOString(),
    };
    useBrowserStore.getState().prependHistory(entry);
  } catch (err) {
    console.error('add_history failed:', err);
  }
}

export async function searchHistory(query: string): Promise<HistoryEntry[]> {
  try {
    return await invoke<HistoryEntry[]>('search_history', { query });
  } catch {
    return [];
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await invoke('clear_history');
    useBrowserStore.getState().clearHistory();
  } catch (err) {
    console.error('clear_history failed:', err);
  }
}

// ─── Settings helpers ──────────────────────────────────────────────────────────

export async function saveSettings(settings: BrowserSettings): Promise<void> {
  try {
    await invoke('update_settings', { settings });
    useBrowserStore.getState().setSettings(settings);
  } catch (err) {
    console.error('update_settings failed:', err);
  }
}

// ─── Global keyboard shortcuts ─────────────────────────────────────────────────

export function useKeyboardShortcuts(
  tabManager: ReturnType<typeof useTabManager>
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 't') {
        e.preventDefault();
        tabManager.openTab('');
      } else if (mod && e.key === 'w') {
        e.preventDefault();
        const id = useBrowserStore.getState().activeTabId;
        if (id) tabManager.closeTab(id);
      } else if (mod && e.key === 'r') {
        e.preventDefault();
        tabManager.reload();
      } else if (mod && e.key === 'ArrowLeft') {
        e.preventDefault();
        tabManager.goBack();
      } else if (mod && e.key === 'ArrowRight') {
        e.preventDefault();
        tabManager.goForward();
      } else if (mod && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        useBrowserStore.getState().toggleSidebar('bookmarks');
      } else if (mod && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        useBrowserStore.getState().toggleSidebar('history');
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tabManager]);
}

// ─── Tab event listener ────────────────────────────────────────────────────────

export function useTabEvents() {
  useEffect(() => {
    const unlistenPromise = listen<{ label: string; url: string; title: string }>(
      'tab-info',
      (event) => {
        const { tabs, updateTab } = useBrowserStore.getState();
        const tab = tabs.find((t) => t.label === event.payload?.label);
        if (tab) {
          updateTab(tab.id, {
            url: event.payload.url,
            title: event.payload.title,
          });
        }
      }
    );
    return () => {
      unlistenPromise.then((fn) => fn());
    };
  }, []);
}
