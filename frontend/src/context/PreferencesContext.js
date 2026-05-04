import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

const KEY = 'vee_preferences';

const DEFAULTS = {
  theme: 'light',
  fontScale: 1,
  autoplayVideos: true,
  reduceMotion: false,
  privateAccount: false,
  analyticsHints: true,
};

const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync(KEY)
      .then((raw) => {
        if (raw) setPreferences({ ...DEFAULTS, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updatePreference = async (name, value) => {
    const next = { ...preferences, [name]: value };
    setPreferences(next);
    await SecureStore.setItemAsync(KEY, JSON.stringify(next));
  };

  const value = useMemo(() => ({
    preferences,
    loading,
    updatePreference,
  }), [preferences, loading]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used inside PreferencesProvider');
  }
  return context;
}
