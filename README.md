# min-browser
A minimal lightweight browser built in tauri and react.

## Features

- **Tab Management** – Create, close, and switch between multiple browser tabs
- **Tasks (Tab Groups)** – Group tabs into workspaces (tasks) to stay organized
- **URL Bar with Search** – Type a URL or search query; auto-detects URLs vs. searches
- **Navigation** – Back, forward, reload, and home buttons
- **Bookmarks** – Bookmark pages with tags; search and manage bookmarks
- **History** – Full browsing history with full-text search
- **Ad & Tracker Blocking** – Built-in block list of known ad/tracker domains (Rust-side)
- **Dark / Light / System Theme** – Toggle appearance or follow OS setting
- **Settings** – Choose search engine (DuckDuckGo, Google, Bing, Brave), homepage, and privacy options
- **New Tab Page** – Quick-access search bar, recent history, and bookmarks

## Technology Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Build Tool | [Vite 7](https://vitejs.dev/) |
| CSS | [Tailwind CSS v4](https://tailwindcss.com/) |
| State Management | [Zustand 5](https://zustand-demo.pmnd.rs/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Desktop Runtime | [Tauri v2](https://v2.tauri.app/) (Rust) |
| Backend Language | [Rust](https://www.rust-lang.org/) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [Rust](https://rustup.rs/) (stable)
- Tauri v2 system dependencies – see [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)
  - **Linux**: `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, etc.
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Microsoft C++ Build Tools, WebView2

### Install dependencies

```bash
npm install
```

### Run in development mode

```bash
npm run tauri dev
```

This starts the Vite dev server and the Tauri application.

### Build for production

```bash
npm run tauri build
```

Produces a native installer in `src-tauri/target/release/bundle/`.

## Project Structure

```
min-browser/
├── src/                        # React frontend (browser chrome)
│   ├── components/
│   │   ├── NavigationBar.tsx   # Back/forward/reload + URL bar
│   │   ├── TabBar.tsx          # Tab strip
│   │   ├── NewTabPage.tsx      # New-tab welcome screen
│   │   ├── Sidebar.tsx         # Side panel container + toggle buttons
│   │   ├── BookmarksPanel.tsx  # Bookmark management
│   │   ├── HistoryPanel.tsx    # History viewer with search
│   │   ├── SettingsPanel.tsx   # Browser settings
│   │   └── TasksPanel.tsx      # Task (tab group) switcher
│   ├── hooks/
│   │   └── useTauri.ts         # Tauri bridge: commands, events, shortcuts
│   ├── store/
│   │   └── browserStore.ts     # Zustand state management
│   ├── types/
│   │   └── index.ts            # Shared TypeScript types
│   ├── App.tsx                 # Root component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles (CSS vars + Tailwind)
├── src-tauri/                  # Rust / Tauri backend
│   ├── src/
│   │   ├── lib.rs              # Commands: tabs, bookmarks, history, settings
│   │   └── main.rs             # Entry point
│   ├── capabilities/
│   │   └── default.json        # Tauri permission configuration
│   └── tauri.conf.json         # Tauri application configuration
├── index.html
├── package.json
└── vite.config.ts
```

## Architecture

Each browser **tab** is a separate `WebviewWindow` created via Tauri v2's `WebviewWindowBuilder`. The browser chrome (tabs, URL bar, sidebar) lives in the main Tauri window which hosts the React application. The React UI communicates with tab windows and the Rust backend using Tauri's `invoke` and `event` APIs.

Ad blocking is enforced Rust-side: when `is_domain_blocked` returns `true` for a URL, the JavaScript layer skips navigation. The block list covers major advertising and tracking networks.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/⌘ + T` | New tab |
| `Ctrl/⌘ + W` | Close current tab |
| `Ctrl/⌘ + R` | Reload |
| `Ctrl/⌘ + ←` | Go back |
| `Ctrl/⌘ + →` | Go forward |
| `Ctrl/⌘ + Shift + B` | Toggle bookmarks |
| `Ctrl/⌘ + Shift + H` | Toggle history |
