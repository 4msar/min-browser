use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State, WebviewUrl, WebviewWindowBuilder};

// ─── Data structures ──────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bookmark {
    pub id: String,
    pub url: String,
    pub title: String,
    pub tags: Vec<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub id: String,
    pub url: String,
    pub title: String,
    pub visited_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserSettings {
    pub search_engine: String,
    pub homepage: String,
    pub theme: String,
    pub ad_blocking: bool,
    pub new_tab_url: String,
}

impl Default for BrowserSettings {
    fn default() -> Self {
        Self {
            search_engine: "https://duckduckgo.com/?q={}".to_string(),
            homepage: "about:blank".to_string(),
            theme: "system".to_string(),
            ad_blocking: true,
            new_tab_url: "about:blank".to_string(),
        }
    }
}

// ─── Ad-block domain list (well-known trackers) ───────────────────────────────

const BLOCKED_DOMAINS: &[&str] = &[
    "doubleclick.net",
    "googlesyndication.com",
    "googletagmanager.com",
    "googletagservices.com",
    "google-analytics.com",
    "analytics.google.com",
    "adservice.google.com",
    "ads.twitter.com",
    "static.ads-twitter.com",
    "advertising.amazon.com",
    "fls-na.amazon.com",
    "omtrdc.net",
    "2mdn.net",
    "adsystem.com",
    "adnxs.com",
    "pubmatic.com",
    "rubiconproject.com",
    "openx.net",
    "moatads.com",
    "tapad.com",
    "turn.com",
    "rlcdn.com",
    "crwdcntrl.net",
    "bluekai.com",
    "scorecardresearch.com",
    "quantserve.com",
    "addthis.com",
    "sharethis.com",
    "outbrain.com",
    "taboola.com",
    "criteo.com",
    "criteo.net",
    "casalemedia.com",
    "bidswitch.net",
    "contextweb.com",
    "33across.com",
    "spotxchange.com",
    "advertising.com",
    "yieldbot.com",
    "smartadserver.com",
    "appnexus.com",
    "lijit.com",
    "gravity.com",
    "tribalfusion.com",
    "undertone.com",
    "valueclick.com",
    "trafficjunky.net",
    "exelator.com",
    "kontera.com",
    "bizographics.com",
    "bounceexchange.com",
    "mopub.com",
    "facebook.net",
    "connect.facebook.net",
];

// ─── App state ────────────────────────────────────────────────────────────────

pub struct AppState {
    pub bookmarks: Mutex<Vec<Bookmark>>,
    pub history: Mutex<Vec<HistoryEntry>>,
    pub settings: Mutex<BrowserSettings>,
}

// ─── Tab / Webview commands ───────────────────────────────────────────────────

/// Open a URL in a new managed WebviewWindow (browser tab).
#[tauri::command]
pub async fn open_tab(
    app: AppHandle,
    label: String,
    url: String,
) -> Result<(), String> {
    let safe_url = if url.is_empty() || url == "about:blank" {
        WebviewUrl::App("about:blank".into())
    } else if url.starts_with("http://") || url.starts_with("https://") {
        WebviewUrl::External(url.parse().map_err(|e: url::ParseError| e.to_string())?)
    } else {
        WebviewUrl::External(
            format!("https://{}", url)
                .parse()
                .map_err(|e: url::ParseError| e.to_string())?,
        )
    };

    WebviewWindowBuilder::new(&app, &label, safe_url)
        .title("")
        .inner_size(1200.0, 800.0)
        .visible(false)
        .build()
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Navigate an existing tab to a new URL.
#[tauri::command]
pub async fn navigate_tab(
    app: AppHandle,
    label: String,
    url: String,
) -> Result<(), String> {
    let window = app.get_webview_window(&label).ok_or("Tab not found")?;
    let nav_url: tauri::Url = if url.starts_with("http://") || url.starts_with("https://") {
        url.parse().map_err(|e: url::ParseError| e.to_string())?
    } else {
        format!("https://{}", url)
            .parse()
            .map_err(|e: url::ParseError| e.to_string())?
    };
    window.navigate(nav_url).map_err(|e| e.to_string())?;
    Ok(())
}

/// Close a tab (destroy its WebviewWindow).
#[tauri::command]
pub async fn close_tab(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Show a tab window (bring to front, show, focus).
#[tauri::command]
pub async fn show_tab(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Hide a tab window.
#[tauri::command]
pub async fn hide_tab(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Navigate back in a tab's history.
#[tauri::command]
pub async fn tab_go_back(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window
            .eval("history.back()")
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Navigate forward in a tab's history.
#[tauri::command]
pub async fn tab_go_forward(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window
            .eval("history.forward()")
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Reload a tab.
#[tauri::command]
pub async fn tab_reload(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window
            .eval("location.reload()")
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Get the current URL and title of a tab by evaluating JS.
#[tauri::command]
pub async fn get_tab_info(app: AppHandle, label: String) -> Result<serde_json::Value, String> {
    if let Some(window) = app.get_webview_window(&label) {
        let _ = window.eval(
            r#"
            (function() {
                if (window.__TAURI_INTERNALS__) {
                    window.__TAURI_INTERNALS__.transformCallback = window.__TAURI_INTERNALS__.transformCallback || function(){};
                }
                const info = { url: location.href, title: document.title };
                window.__TAURI_INTERNALS__?.invoke?.('plugin:event|emit', {
                    event: 'tab-info',
                    windowLabel: null,
                    payload: info
                });
            })()
            "#,
        );
        Ok(serde_json::json!({ "url": window.url().map(|u| u.to_string()).unwrap_or_default(), "title": "" }))
    } else {
        Err("Tab not found".to_string())
    }
}

/// Check whether a domain should be blocked (ad blocking).
#[tauri::command]
pub fn is_domain_blocked(state: State<'_, AppState>, url: String) -> bool {
    let settings = state.settings.lock().unwrap();
    if !settings.ad_blocking {
        return false;
    }
    if let Ok(parsed) = url.parse::<url::Url>() {
        if let Some(host) = parsed.host_str() {
            return BLOCKED_DOMAINS
                .iter()
                .any(|&blocked| host == blocked || host.ends_with(&format!(".{}", blocked)));
        }
    }
    false
}

/// Build a search URL from a query string.
#[tauri::command]
pub fn build_search_url(state: State<'_, AppState>, query: String) -> String {
    let settings = state.settings.lock().unwrap();
    // If it looks like a URL, return it as-is (with scheme if missing)
    let trimmed = query.trim();
    if trimmed.starts_with("http://")
        || trimmed.starts_with("https://")
        || trimmed.starts_with("about:")
    {
        return trimmed.to_string();
    }
    // Heuristic: contains a dot and no spaces → treat as URL
    if !trimmed.contains(' ') && trimmed.contains('.') {
        return format!("https://{}", trimmed);
    }
    settings
        .search_engine
        .replace("{}", &urlencoding_encode(trimmed))
}

fn urlencoding_encode(s: &str) -> String {
    s.chars()
        .map(|c| match c {
            ' ' => '+'.to_string(),
            c if c.is_alphanumeric() || "-_.~".contains(c) => c.to_string(),
            c => format!("%{:02X}", c as u8),
        })
        .collect()
}

// ─── Bookmark commands ────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_bookmarks(state: State<'_, AppState>) -> Vec<Bookmark> {
    state.bookmarks.lock().unwrap().clone()
}

#[tauri::command]
pub fn add_bookmark(
    state: State<'_, AppState>,
    url: String,
    title: String,
    tags: Vec<String>,
) -> Bookmark {
    let id = format!("bm-{}", Utc::now().timestamp_millis());
    let bookmark = Bookmark {
        id: id.clone(),
        url,
        title,
        tags,
        created_at: Utc::now().to_rfc3339(),
    };
    state.bookmarks.lock().unwrap().push(bookmark.clone());
    bookmark
}

#[tauri::command]
pub fn remove_bookmark(state: State<'_, AppState>, id: String) {
    state
        .bookmarks
        .lock()
        .unwrap()
        .retain(|b| b.id != id);
}

#[tauri::command]
pub fn is_bookmarked(state: State<'_, AppState>, url: String) -> bool {
    state
        .bookmarks
        .lock()
        .unwrap()
        .iter()
        .any(|b| b.url == url)
}

// ─── History commands ─────────────────────────────────────────────────────────

#[tauri::command]
pub fn add_history(
    state: State<'_, AppState>,
    url: String,
    title: String,
) {
    if url.is_empty() || url == "about:blank" {
        return;
    }
    let entry = HistoryEntry {
        id: format!("h-{}", Utc::now().timestamp_millis()),
        url,
        title,
        visited_at: Utc::now().to_rfc3339(),
    };
    let mut history = state.history.lock().unwrap();
    history.insert(0, entry);
    // Keep only last 1000 entries
    history.truncate(1000);
}

#[tauri::command]
pub fn get_history(state: State<'_, AppState>) -> Vec<HistoryEntry> {
    state.history.lock().unwrap().clone()
}

#[tauri::command]
pub fn search_history(state: State<'_, AppState>, query: String) -> Vec<HistoryEntry> {
    let q = query.to_lowercase();
    state
        .history
        .lock()
        .unwrap()
        .iter()
        .filter(|e| {
            e.url.to_lowercase().contains(&q) || e.title.to_lowercase().contains(&q)
        })
        .cloned()
        .collect()
}

#[tauri::command]
pub fn clear_history(state: State<'_, AppState>) {
    state.history.lock().unwrap().clear();
}

// ─── Settings commands ────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> BrowserSettings {
    state.settings.lock().unwrap().clone()
}

#[tauri::command]
pub fn update_settings(state: State<'_, AppState>, settings: BrowserSettings) {
    *state.settings.lock().unwrap() = settings;
}

// ─── App entry point ──────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let state = AppState {
        bookmarks: Mutex::new(Vec::new()),
        history: Mutex::new(Vec::new()),
        settings: Mutex::new(BrowserSettings::default()),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            open_tab,
            navigate_tab,
            close_tab,
            show_tab,
            hide_tab,
            tab_go_back,
            tab_go_forward,
            tab_reload,
            get_tab_info,
            is_domain_blocked,
            build_search_url,
            get_bookmarks,
            add_bookmark,
            remove_bookmark,
            is_bookmarked,
            add_history,
            get_history,
            search_history,
            clear_history,
            get_settings,
            update_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
