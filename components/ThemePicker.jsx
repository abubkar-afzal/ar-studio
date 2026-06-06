// components/ThemePicker.jsx
import { useContext } from 'react';
import { AppContext } from '../pages/_app';
import axios from 'axios'; // or use fetch

const themes = [
  { name: 'light', label: '☀️ Light', colors: ['#ffffff', '#2563eb'] },
  { name: 'dark', label: '🌙 Dark', colors: ['#0f172a', '#4f46e5'] },
  { name: 'cyberpunk', label: '🤖 Cyberpunk', colors: ['#0d0221', '#ff007f'] },
  { name: 'nature', label: '🌿 Nature', colors: ['#f0fdf4', '#047857'] },
];

export default function ThemePicker() {
  const { theme, setTheme } = useContext(AppContext);

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    // Persist theme to SQLite via API
    try {
      await fetch('/api/save-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme }),
      });
    } catch (e) {
      console.warn('Could not save theme', e);
    }
  };

  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {themes.map((t) => (
        <button
          key={t.name}
          onClick={() => handleThemeChange(t.name)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-500
            ${theme === t.name ? 'border-primary scale-110 shadow-lg' : 'border-muted hover:scale-105'}
            bg-surface text-text`}
        >
          <span className="flex gap-1">
            {t.colors.map((color, i) => (
              <span
                key={i}
                className="w-4 h-4 rounded-full border border-muted"
                style={{ backgroundColor: color }}
              />
            ))}
          </span>
          {t.label}
        </button>
      ))}
    </div>
  );
}