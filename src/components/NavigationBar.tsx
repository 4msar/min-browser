import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  X,
  Home,
  Loader2,
  Lock,
  Globe,
} from 'lucide-react';
import { useBrowserStore } from '../store/browserStore';

interface NavigationBarProps {
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onHome: () => void;
}

export function NavigationBar({
  onNavigate,
  onBack,
  onForward,
  onReload,
  onHome,
}: NavigationBarProps) {
  const activeTab = useBrowserStore((s) => s.getActiveTab());
  const [inputValue, setInputValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input with active tab URL when not focused
  useEffect(() => {
    if (!focused) {
      setInputValue(activeTab?.url ?? '');
    }
  }, [activeTab?.url, focused]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = inputValue.trim();
      if (val) {
        onNavigate(val);
        inputRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      setInputValue(activeTab?.url ?? '');
      inputRef.current?.blur();
    }
  };

  const handleFocus = () => {
    setFocused(true);
    inputRef.current?.select();
  };

  const handleBlur = () => {
    setFocused(false);
    setInputValue(activeTab?.url ?? '');
  };

  const isSecure =
    activeTab?.url?.startsWith('https://') ||
    activeTab?.url?.startsWith('about:');

  const displayValue = focused ? inputValue : (activeTab?.url ?? '');

  return (
    <div className="nav-bar">
      {/* Back */}
      <button
        className="nav-btn"
        onClick={onBack}
        disabled={!activeTab?.canGoBack}
        title="Back (Ctrl+←)"
        aria-label="Go back"
      >
        <ArrowLeft size={16} />
      </button>

      {/* Forward */}
      <button
        className="nav-btn"
        onClick={onForward}
        disabled={!activeTab?.canGoForward}
        title="Forward (Ctrl+→)"
        aria-label="Go forward"
      >
        <ArrowRight size={16} />
      </button>

      {/* Reload / Stop */}
      <button
        className="nav-btn"
        onClick={onReload}
        title="Reload (Ctrl+R)"
        aria-label="Reload"
      >
        {activeTab?.loading ? (
          <Loader2 size={16} className="loading-spinner" />
        ) : (
          <RotateCw size={16} />
        )}
      </button>

      {/* Home */}
      <button
        className="nav-btn"
        onClick={onHome}
        title="Home"
        aria-label="Home"
      >
        <Home size={14} />
      </button>

      {/* URL bar */}
      <div className="url-bar">
        {/* Security indicator */}
        {displayValue && !focused && (
          <span style={{ color: isSecure ? '#22c55e' : 'var(--browser-text-muted)', flexShrink: 0 }}>
            {isSecure ? <Lock size={12} /> : <Globe size={12} />}
          </span>
        )}

        <input
          ref={inputRef}
          className="url-input"
          type="text"
          value={focused ? inputValue : displayValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Search or enter address"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="Address bar"
        />

        {/* Clear button */}
        {focused && inputValue && (
          <button
            className="nav-btn"
            style={{ width: 22, height: 22 }}
            onMouseDown={(e) => {
              e.preventDefault();
              setInputValue('');
            }}
            aria-label="Clear"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
