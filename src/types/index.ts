// ─── Browser types ─────────────────────────────────────────────────────────────

export interface Tab {
  id: string;
  label: string;      // Tauri window label
  url: string;
  title: string;
  favicon: string | null;
  loading: boolean;
  taskId: string;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface Task {
  id: string;
  name: string;
  tabIds: string[];
  createdAt: string;
}

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  tags: string[];
  created_at: string;
}

export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  visited_at: string;
}

export interface BrowserSettings {
  search_engine: string;
  homepage: string;
  theme: 'light' | 'dark' | 'system';
  ad_blocking: boolean;
  new_tab_url: string;
}

export type SidebarPanel = 'bookmarks' | 'history' | 'settings' | 'tasks' | null;

export const SEARCH_ENGINES: Record<string, { name: string; url: string }> = {
  duckduckgo: {
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q={}',
  },
  google: {
    name: 'Google',
    url: 'https://www.google.com/search?q={}',
  },
  bing: {
    name: 'Bing',
    url: 'https://www.bing.com/search?q={}',
  },
  brave: {
    name: 'Brave Search',
    url: 'https://search.brave.com/search?q={}',
  },
};
