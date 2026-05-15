import * as SecureStore from 'expo-secure-store';

const PUSH_TOKEN_KEY = 'expo_push_token';

export const PushTokenStorage = {
  get: () => SecureStore.getItemAsync(PUSH_TOKEN_KEY),
  save: (token) => SecureStore.setItemAsync(PUSH_TOKEN_KEY, token),
  remove: () => SecureStore.deleteItemAsync(PUSH_TOKEN_KEY),
};
