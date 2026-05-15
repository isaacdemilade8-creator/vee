/**
 * App.js — Root of the Vee React Native App
 *
 * Wraps the entire app in:
 *  - SafeAreaProvider (for device safe areas)
 *  - GestureHandlerRootView (required by React Navigation)
 *  - AuthProvider (global auth state)
 *  - AppNavigator (handles auth vs main routing)
 */
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { PreferencesProvider, usePreferences } from './src/context/PreferencesContext';
import AppNavigator from './src/navigation/AppNavigator';
import { PushNotificationsProvider } from './src/providers/PushNotificationsProvider';

function AppShell() {
  const { preferences } = usePreferences();

  return (
    <AuthProvider>
      <StatusBar style={preferences.theme === 'dark' ? 'light' : 'dark'} />
      <PushNotificationsProvider>
        <AppNavigator />
      </PushNotificationsProvider>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PreferencesProvider>
          <AppShell />
        </PreferencesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
