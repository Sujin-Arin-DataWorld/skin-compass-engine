import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api/geo": {
        target: "https://geocoding-api.open-meteo.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/geo/, ""),
      },
      "/api/archive": {
        target: "https://archive-api.open-meteo.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/archive/, ""),
      },
      "/api/forecast": {
        target: "https://api.open-meteo.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/forecast/, ""),
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["SSL.png", "robots.txt"],
      manifest: {
        name: "SkinStrategyLab",
        short_name: "SkinStrategy",
        description: "AI-powered clinical skin analysis",
        theme_color: "#0d0d12",
        background_color: "#0d0d12",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "/SSL.png", sizes: "192x192 512x512", type: "image/png", purpose: "any maskable" }
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ["**/*.{js,css,html,ico,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            // Supabase Edge Functions (AI analysis, feedback) — NEVER cache
            urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/.*/i,
            handler: 'NetworkOnly' as const,
          },
          {
            // Supabase Auth — NEVER cache
            urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
            handler: 'NetworkOnly' as const,
          },
          {
            // Supabase REST API — NEVER cache
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkOnly' as const,
          },
          {
            // Supabase Storage (product images, skin images) — cache with revalidation
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'StaleWhileRevalidate' as const,
            options: {
              cacheName: 'supabase-storage',
              expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
          {
            // Video files — CacheFirst with range request support for mobile seeking
            urlPattern: /\.mp4$/i,
            handler: 'CacheFirst' as const,
            options: {
              cacheName: 'video-cache',
              expiration: { maxEntries: 5, maxAgeSeconds: 30 * 24 * 60 * 60 },
              rangeRequests: true,
            },
          },
          {
            // Static assets (fonts, icons, images) — aggressive cache
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/i,
            handler: 'CacheFirst' as const,
            options: {
              cacheName: 'static-assets',
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  css: {
    // CSS 모듈이 아닌 일반 CSS의 소스맵을 dev에서만 활성화
    devSourcemap: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
