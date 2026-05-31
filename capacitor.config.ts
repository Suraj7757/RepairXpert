// Capacitor configuration for Servixo Android APK
// Install @capacitor/cli and @capacitor/core before building:
//   npm install @capacitor/core @capacitor/cli

const config = {
  appId: 'com.servixo.app',
  appName: 'Servixo',
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

