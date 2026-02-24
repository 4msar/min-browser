import { create } from 'zustand';
import type {
  Tab,
  Task,
  Bookmark,
  HistoryEntry,
  BrowserSettings,
  SidebarPanel,
} from '../types';

let tabCounter = 0;
let taskCounter = 0;

function generateTabId() {
  return `tab-${++tabCounter}-${Date.now()}`;
}

function generateTaskId() {
  return `task-${++taskCounter}-${Date.now()}`;
}

function generateLabel(id: string) {
  // Tauri window labels must be alphanumeric + dashes
  return id.replace(/[^a-zA-Z0-9-]/g, '-');
}

interface BrowserState {
  // Tabs
  tabs: Tab[];
  activeTabId: string | null;

  // Tasks (tab groups)
  tasks: Task[];
  activeTaskId: string | null;

  // Sidebar
  sidebarOpen: boolean;
  sidebarPanel: SidebarPanel;

  // Data
  bookmarks: Bookmark[];
  history: HistoryEntry[];

  // Settings
  settings: BrowserSettings;

  // Actions – tabs
  createTab: (url?: string, taskId?: string) => string;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  getActiveTab: () => Tab | null;
  getTabsByTask: (taskId: string) => Tab[];

  // Actions – tasks
  createTask: (name?: string) => string;
  removeTask: (taskId: string) => void;
  setActiveTask: (taskId: string) => void;
  renameTask: (taskId: string, name: string) => void;

  // Actions – sidebar
  toggleSidebar: (panel?: SidebarPanel) => void;
  closeSidebar: () => void;

  // Actions – bookmarks
  setBookmarks: (bookmarks: Bookmark[]) => void;
  addBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (id: string) => void;

  // Actions – history
  setHistory: (history: HistoryEntry[]) => void;
  prependHistory: (entry: HistoryEntry) => void;
  clearHistory: () => void;

  // Actions – settings
  setSettings: (settings: BrowserSettings) => void;
  updateSetting: <K extends keyof BrowserSettings>(
    key: K,
    value: BrowserSettings[K]
  ) => void;
}

export const useBrowserStore = create<BrowserState>((set, get) => {
  // Create initial task and tab
  const initialTaskId = generateTaskId();
  const initialTabId = generateTabId();
  const initialLabel = generateLabel(initialTabId);

  const initialTab: Tab = {
    id: initialTabId,
    label: initialLabel,
    url: '',
    title: 'New Tab',
    favicon: null,
    loading: false,
    taskId: initialTaskId,
    canGoBack: false,
    canGoForward: false,
  };

  const initialTask: Task = {
    id: initialTaskId,
    name: 'Task 1',
    tabIds: [initialTabId],
    createdAt: new Date().toISOString(),
  };

  return {
    tabs: [initialTab],
    activeTabId: initialTabId,
    tasks: [initialTask],
    activeTaskId: initialTaskId,
    sidebarOpen: false,
    sidebarPanel: null,
    bookmarks: [],
    history: [],
    settings: {
      search_engine: 'https://duckduckgo.com/?q={}',
      homepage: '',
      theme: 'system',
      ad_blocking: true,
      new_tab_url: '',
    },

    // ── Tab actions ─────────────────────────────────────────────────────────
    createTab: (url = '', taskId?: string) => {
      const { tasks, activeTaskId } = get();
      const targetTaskId = taskId ?? activeTaskId ?? tasks[0]?.id;
      if (!targetTaskId) return '';

      const id = generateTabId();
      const label = generateLabel(id);
      const newTab: Tab = {
        id,
        label,
        url,
        title: 'New Tab',
        favicon: null,
        loading: !!url,
        taskId: targetTaskId,
        canGoBack: false,
        canGoForward: false,
      };

      set((state) => ({
        tabs: [...state.tabs, newTab],
        activeTabId: id,
        tasks: state.tasks.map((t) =>
          t.id === targetTaskId
            ? { ...t, tabIds: [...t.tabIds, id] }
            : t
        ),
      }));
      return id;
    },

    closeTab: (tabId: string) => {
      const { tabs, activeTabId } = get();
      const tab = tabs.find((t) => t.id === tabId);
      if (!tab) return;

      const taskTabs = tabs.filter((t) => t.taskId === tab.taskId);
      let nextActiveId: string | null = activeTabId;

      if (activeTabId === tabId) {
        const taskTabIds = taskTabs.map((t) => t.id);
        const idx = taskTabIds.indexOf(tabId);
        const sibling =
          taskTabs[idx + 1] ?? taskTabs[idx - 1] ?? null;
        nextActiveId = sibling?.id ?? null;

        // If no sibling in task, find in other tasks
        if (!nextActiveId) {
          const remaining = tabs.filter((t) => t.id !== tabId);
          nextActiveId = remaining[remaining.length - 1]?.id ?? null;
        }
      }

      set((state) => ({
        tabs: state.tabs.filter((t) => t.id !== tabId),
        activeTabId: nextActiveId,
        tasks: state.tasks.map((t) =>
          t.id === tab.taskId
            ? { ...t, tabIds: t.tabIds.filter((id) => id !== tabId) }
            : t
        ),
      }));

      // Remove empty tasks (but keep at least one)
      const { tasks: updatedTasks, tabs: updatedTabs } = get();
      const emptyTaskIds = updatedTasks
        .filter((t) => !updatedTabs.some((tab) => tab.taskId === t.id))
        .map((t) => t.id);

      if (emptyTaskIds.length > 0 && updatedTasks.length > emptyTaskIds.length) {
        set((state) => ({
          tasks: state.tasks.filter((t) => !emptyTaskIds.includes(t.id)),
        }));
      }
    },

    setActiveTab: (tabId: string) => {
      const tab = get().tabs.find((t) => t.id === tabId);
      if (tab) {
        set({ activeTabId: tabId, activeTaskId: tab.taskId });
      }
    },

    updateTab: (tabId: string, updates: Partial<Tab>) => {
      set((state) => ({
        tabs: state.tabs.map((t) =>
          t.id === tabId ? { ...t, ...updates } : t
        ),
      }));
    },

    getActiveTab: () => {
      const { tabs, activeTabId } = get();
      return tabs.find((t) => t.id === activeTabId) ?? null;
    },

    getTabsByTask: (taskId: string) => {
      return get().tabs.filter((t) => t.taskId === taskId);
    },

    // ── Task actions ─────────────────────────────────────────────────────────
    createTask: (name?: string) => {
      const taskId = generateTaskId();
      const taskName = name ?? `Task ${get().tasks.length + 1}`;
      const newTask: Task = {
        id: taskId,
        name: taskName,
        tabIds: [],
        createdAt: new Date().toISOString(),
      };
      set((state) => ({
        tasks: [...state.tasks, newTask],
        activeTaskId: taskId,
      }));
      return taskId;
    },

    removeTask: (taskId: string) => {
      const { tasks, tabs } = get();
      if (tasks.length <= 1) return;

      const remainingTabs = tabs.filter((t) => t.taskId !== taskId);
      const remainingTasks = tasks.filter((t) => t.id !== taskId);

      set({
        tasks: remainingTasks,
        tabs: remainingTabs,
        activeTaskId: remainingTasks[0]?.id ?? null,
        activeTabId: remainingTabs[remainingTabs.length - 1]?.id ?? null,
      });
    },

    setActiveTask: (taskId: string) => {
      const { tabs } = get();
      const taskTabs = tabs.filter((t) => t.taskId === taskId);
      const firstTab = taskTabs[taskTabs.length - 1] ?? null;
      set({ activeTaskId: taskId, activeTabId: firstTab?.id ?? null });
    },

    renameTask: (taskId: string, name: string) => {
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, name } : t
        ),
      }));
    },

    // ── Sidebar actions ──────────────────────────────────────────────────────
    toggleSidebar: (panel?: SidebarPanel) => {
      const { sidebarOpen, sidebarPanel } = get();
      if (panel && sidebarPanel === panel && sidebarOpen) {
        set({ sidebarOpen: false, sidebarPanel: null });
      } else {
        set({ sidebarOpen: true, sidebarPanel: panel ?? sidebarPanel });
      }
    },

    closeSidebar: () => {
      set({ sidebarOpen: false, sidebarPanel: null });
    },

    // ── Bookmark actions ──────────────────────────────────────────────────────
    setBookmarks: (bookmarks: Bookmark[]) => set({ bookmarks }),
    addBookmark: (bookmark: Bookmark) =>
      set((state) => ({ bookmarks: [...state.bookmarks, bookmark] })),
    removeBookmark: (id: string) =>
      set((state) => ({
        bookmarks: state.bookmarks.filter((b) => b.id !== id),
      })),

    // ── History actions ───────────────────────────────────────────────────────
    setHistory: (history: HistoryEntry[]) => set({ history }),
    prependHistory: (entry: HistoryEntry) =>
      set((state) => ({
        history: [entry, ...state.history].slice(0, 1000),
      })),
    clearHistory: () => set({ history: [] }),

    // ── Settings actions ──────────────────────────────────────────────────────
    setSettings: (settings: BrowserSettings) => set({ settings }),
    updateSetting: (key, value) =>
      set((state) => ({
        settings: { ...state.settings, [key]: value },
      })),
  };
});
