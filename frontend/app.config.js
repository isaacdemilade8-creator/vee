const fs = require('fs');
const path = require('path');

function loadDotenv(dotenvPath) {
  const env = {};
  if (!fs.existsSync(dotenvPath)) {
    return env;
  }

  const contents = fs.readFileSync(dotenvPath, 'utf8');
  contents.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      return;
    }

    const [key, ...rest] = trimmed.split('=');
    env[key.trim()] = rest.join('=').trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  });

  return env;
}

const env = loadDotenv(path.resolve(__dirname, '.env'));
const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  env.EXPO_PUBLIC_API_URL ||
  'https://vee-production-76c2.up.railway.app/api';

module.exports = {
  expo: {
    name: 'Vee',
    slug: 'vee',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './src/assets/vtwo.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './src/assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.vee.app',
      infoPlist: {
        NSPhotoLibraryUsageDescription: 'Allow Vee to access your photos to share them.',
        NSCameraUsageDescription: 'Allow Vee to use your camera to take photos.',
        NSMicrophoneUsageDescription: 'Allow Vee to use your microphone for live streams.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './src/assets/v.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.vee.app',
      softwareKeyboardLayoutMode: 'resize',
      permissions: ['READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE', 'CAMERA', 'RECORD_AUDIO', 'MODIFY_AUDIO_SETTINGS', 'POST_NOTIFICATIONS'],
    },
    web: {
      favicon: './src/assets/v.png',
    },
    plugins: [
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow Vee to access your photos.',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './src/assets/v.png',
          color: '#0f766e',
          defaultChannel: 'default',
        },
      ],
      [
        '@livekit/react-native-expo-plugin',
        {
          android: {
            audioType: 'communication',
          },
        },
      ],
      '@config-plugins/react-native-webrtc',
      'expo-video',
      'expo-audio',
    ],
    extra: {
      apiUrl,
      eas: {
        projectId: '786b26ea-7f67-451e-b8b5-c71c5edd10a4',
      },
    },
  },
};
