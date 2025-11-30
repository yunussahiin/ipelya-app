import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "ipelya-app",
  slug: "ipelya-app",
  scheme: "ipelya",
  version: "1.0.1",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#000000"
  },
  updates: {
    url: "https://u.expo.dev/ef2464e9-74a9-4b09-9ff6-a936e9cdc65a",
    fallbackToCacheTimeout: 0
  },
  runtimeVersion: {
    policy: "appVersion"
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.ipelya.mobile",
    usesAppleSignIn: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription: "İçerik oluşturmak için kamera erişimi gereklidir.",
      NSMicrophoneUsageDescription: "Video kaydetmek için mikrofon erişimi gereklidir.",
      NSPhotoLibraryUsageDescription: "Fotoğraf ve video seçmek için galeri erişimi gereklidir."
    },
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
    }
  },
  android: {
    package: "com.ipelya.mobile",
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      }
    },
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#000000"
    },
    permissions: [
      "NOTIFICATIONS",
      "CAMERA",
      "RECORD_AUDIO",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE"
    ]
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
    "expo-iap",
    [
      "expo-local-authentication",
      {
        faceIDPermission: "Shadow profiline erişim için Face ID gereklidir."
      }
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#ffffff"
      }
    ],
    "expo-maps",
    "expo-video",
    [
      "expo-audio",
      {
        microphonePermission: "Ses kaydı için mikrofon erişimi gereklidir."
      }
    ],
    [
      "react-native-vision-camera",
      {
        cameraPermissionText: "İçerik oluşturmak için kamera erişimi gereklidir.",
        enableMicrophonePermission: true,
        microphonePermissionText: "Video kaydetmek için mikrofon erişimi gereklidir.",
        enableFrameProcessors: true
      }
    ],
    [
      "expo-media-library",
      {
        photosPermission: "Fotoğraf ve video seçmek için galeri erişimi gereklidir.",
        savePhotosPermission: "Çekilen fotoğrafları kaydetmek için izin gereklidir."
      }
    ],
    [
      "expo-build-properties",
      {
        ios: {
          // VisionCameraFaceDetector (MLKit) requires iOS 16+
          deploymentTarget: process.env.IOS_DEPLOYMENT_TARGET || "16.0"
        }
      }
    ]
  ],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    livekitUrl: process.env.EXPO_PUBLIC_LIVEKIT_URL,
    eas: {
      projectId: "ef2464e9-74a9-4b09-9ff6-a936e9cdc65a"
    }
  }
});
