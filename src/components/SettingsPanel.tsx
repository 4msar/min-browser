import { useState } from 'react';
import { useBrowserStore } from '../store/browserStore';
import { saveSettings } from '../hooks/useTauri';
import type { BrowserSettings } from '../types';
import { SEARCH_ENGINES } from '../types';

export function SettingsPanel() {
  const settings = useBrowserStore((s) => s.settings);
  const [local, setLocal] = useState<BrowserSettings>({ ...settings });
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await saveSettings(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const update = <K extends keyof BrowserSettings>(key: K, value: BrowserSettings[K]) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '4px 0' }}>
      {/* Theme */}
      <section>
        <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--browser-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
          Appearance
        </h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => update('theme', t)}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 8,
                border: `2px solid ${local.theme === t ? 'var(--browser-accent)' : 'var(--browser-border)'}`,
                background: local.theme === t ? 'var(--browser-active)' : 'transparent',
                color: local.theme === t ? 'var(--browser-accent)' : 'var(--browser-text-muted)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: local.theme === t ? 600 : 400,
                textTransform: 'capitalize',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* Search engine */}
      <section>
        <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--browser-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
          Search Engine
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Object.entries(SEARCH_ENGINES).map(([key, engine]) => (
            <button
              key={key}
              onClick={() => update('search_engine', engine.url)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 8,
                border: `2px solid ${local.search_engine === engine.url ? 'var(--browser-accent)' : 'var(--browser-border)'}`,
                background: local.search_engine === engine.url ? 'var(--browser-active)' : 'transparent',
                color: 'var(--browser-text)',
                cursor: 'pointer',
                fontSize: 12,
                textAlign: 'left',
              }}
            >
              <span>{engine.name}</span>
              {local.search_engine === engine.url && (
                <span style={{ color: 'var(--browser-accent)', fontWeight: 600 }}>✓</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Ad blocking */}
      <section>
        <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--browser-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
          Privacy
        </h3>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--browser-border)',
            cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--browser-text)' }}>
              Ad & Tracker Blocking
            </div>
            <div style={{ fontSize: 11, color: 'var(--browser-text-muted)', marginTop: 2 }}>
              Block known advertising and tracking domains
            </div>
          </div>
          <div
            onClick={() => update('ad_blocking', !local.ad_blocking)}
            style={{
              width: 40,
              height: 22,
              borderRadius: 11,
              background: local.ad_blocking ? 'var(--browser-accent)' : 'var(--browser-border)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 2,
                left: local.ad_blocking ? 20 : 2,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }}
            />
          </div>
        </label>
      </section>

      {/* Homepage */}
      <section>
        <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--browser-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>
          Homepage
        </h3>
        <input
          value={local.homepage}
          onChange={(e) => update('homepage', e.target.value)}
          placeholder="https://example.com"
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--browser-border)',
            background: 'var(--browser-bg)',
            color: 'var(--browser-text)',
            fontSize: 12,
            outline: 'none',
          }}
        />
      </section>

      {/* Save button */}
      <button
        onClick={handleSave}
        style={{
          padding: '10px 0',
          borderRadius: 8,
          border: 'none',
          background: saved ? '#22c55e' : 'var(--browser-accent)',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
      >
        {saved ? '✓ Saved' : 'Save Settings'}
      </button>
    </div>
  );
}
