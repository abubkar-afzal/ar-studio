// pages/_app.js
import React from 'react';
import { useState, useEffect } from 'react';
import '../styles/globals.css';

// Global Context for theme and editor state
export const AppContext = React.createContext();

export default function MyApp({ Component, pageProps }) {
  const [theme, setTheme] = useState('light');
  const [activeEditor, setActiveEditor] = useState(null); // 'photo', 'video', 'audio'

  // Apply theme attribute to <html> for CSS variable scoping
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <AppContext.Provider value={{ theme, setTheme, activeEditor, setActiveEditor }}>
      <Component {...pageProps} />
    </AppContext.Provider>
  );
}