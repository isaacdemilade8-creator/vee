import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { PushAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { PushTokenStorage } from '../utils/pushTokenStorage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const PushNotificationsContext = createContext(null);

export function PushNotificationsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState(null);
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {});
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {});

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function register() {
      if (!isAuthenticated) {
        setExpoPushToken(null);
        return;
      }

      try {
        const token = await registerForPushNotificationsAsync();
        if (!token || cancelled) {
          return;
        }

        setExpoPushToken(token);
        await PushTokenStorage.save(token);
        await PushAPI.registerToken(token, Platform.OS);
      } catch (error) {
        console.warn('Push notification registration failed:', error?.message || error);
      }
    }

    register();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return (
    <PushNotificationsContext.Provider value={{ expoPushToken }}>
      {children}
    </PushNotificationsContext.Provider>
  );
}

export function usePushNotifications() {
  return useContext(PushNotificationsContext);
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0f766e',
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let finalStatus = existing.status;

  if (existing.status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId;

  const result = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );

  return result.data;
}
