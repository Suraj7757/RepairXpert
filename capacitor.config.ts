// Capacitor configuration for ServiceHub Android APK
// Install @capacitor/cli and @capacitor/core before building:
//   npm install @capacitor/core @capacitor/cli

const config = {
  appId: 'com.servicehub.app',
  appName: 'ServiceHub',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1e293b',
      showSpinner: true,
      spinnerColor: '#6366f1',
    },
  },
};

export default config;

