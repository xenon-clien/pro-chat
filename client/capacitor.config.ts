import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prochat.app',
  appName: 'ProChat',
  webDir: 'dist',
  server: {
    // In development, point to local server
    // In production build, uses bundled dist/
    androidScheme: 'https',
    // Allow cleartext for local dev if needed
    allowNavigation: ['*'],
  },
  android: {
    // Allow fullscreen (no status bar)
    backgroundColor: '#080A0F',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    // Keep status bar hidden for immersive feel
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#080A0F',
      overlaysWebView: false,
    },
    // Keyboard behavior
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    // Splash screen (use our custom splash)
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#080A0F',
      showSpinner: false,
    },
  },
};

export default config;
