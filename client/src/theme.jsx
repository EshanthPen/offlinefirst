import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'light', setTheme: () => {} });

const KEY = 'of_theme';

function initialTheme() {
  if (typeof document === 'undefined') return 'light';
  const cur = document.documentElement.getAttribute('data-theme');
  if (cur === 'light' || cur === 'dark') return cur;
  const saved = localStorage.getItem(KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  const sysDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return sysDark ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
