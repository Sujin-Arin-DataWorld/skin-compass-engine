// Prompt 5 — Capacitor configuration
// Run: npm install @capacitor/core @capacitor/cli @capacitor/camera
//      npx cap init (skip if this file already exists)
//      npx cap add android
//      npm run build && npx cap sync
//      npx cap open android

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.skinstrategylab.app',
  appName: 'SkinStrategyLab',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    Camera: {
      // Native camera UI is used on mobile — no extra options needed
    },
  },
};

export default config;
