import type { ExpoConfig } from 'expo/config';

// google-services.json은 레포에 두지 않고 EAS 파일 환경변수(GOOGLE_SERVICES_JSON, secret)로 빌드 러너에 주입한다.
// 변수가 없는 로컬(iOS 개발 빌드)에서는 항목 자체를 생략해 android prebuild가 없는 파일을 찾지 않게 한다.
const googleServicesFile = process.env.GOOGLE_SERVICES_JSON;

const config: ExpoConfig = {
  name: 'LUNOTE',
  slug: 'lunote',
  version: '1.0.0',
  // EAS Update(OTA) — JS·에셋만 바뀐 수정은 스토어 심사 없이 배포한다 (2026-10-20).
  // runtimeVersion은 app version과 묶는다: 네이티브 모듈·설정이 바뀌면 version을 올려 새 빌드와 번들을 분리한다.
  updates: { url: 'https://u.expo.dev/9310e104-679f-484f-8459-3613fc9cd271' },
  runtimeVersion: { policy: 'appVersion' },
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'lunote',
  userInterfaceStyle: 'dark',
  ios: {
    icon: './assets/expo.icon',
    bundleIdentifier: 'com.lunoteapp',
    appleTeamId: 'R8529642F3',
    usesAppleSignIn: true,
    // HTTPS만 사용(수출 규정 면제) — TestFlight 빌드마다 암호화 규정 질문을 받지 않도록 선언
    config: { usesNonExemptEncryption: false },
  },
  android: {
    package: 'com.lunoteapp',
    ...(googleServicesFile ? { googleServicesFile } : {}),
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#0F1430',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    'expo-secure-store',
    '@portone/react-native-sdk',
    'expo-apple-authentication',
    [
      '@react-native-google-signin/google-signin',
      {
        iosUrlScheme: 'com.googleusercontent.apps.786866774491-n0ei2tp87pre6lj6vll3a260mqe4jnpe',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/notification-icon.png',
        color: '#7B5BF5',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: '9310e104-679f-484f-8459-3613fc9cd271',
    },
  },
};

export default config;
