import { createContext, useContext } from 'react';

// shared in-memory copy of enriched lessons + scores, kept in sync
// by App.jsx. Lessons include their .quiz field attached from the
// quizzes IDB store.
const AppDataContext = createContext({ lessons: [], scores: [], refresh: () => {} });

export function AppDataProvider({ value, children }) {
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  return useContext(AppDataContext);
}
