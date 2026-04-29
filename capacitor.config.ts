import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.eaje.whatsbot',
  appName: 'EAJE WhatsBot',
  webDir: '.next/standalone',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#0b1020',
      showSpinner: false,
    },
  },
}

export default config
