// ═══════════════════════════════════════
// 글로벌 에러 핸들러 (개발 환경 디버깅용)
// ═══════════════════════════════════════

if (import.meta.env.DEV) {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[SSL] Unhandled Promise Rejection:', event.reason);
  });

  window.addEventListener('error', (event) => {
    // CSS 파싱 경고는 무시 (브라우저가 에러로 보고하는 경우 방지)
    if (event.message?.includes('CSS') || event.message?.includes('Declaration')) {
      return;
    }
    console.error('[SSL] Uncaught Error:', event.error || event.message);
  });
}

import { createRoot } from "react-dom/client";
import { Component, type ReactNode } from "react";
import App from "./App.tsx";
import "./index.css";

// Force reload when a new service worker activates and claims this client.
// Required for mobile PWA: without this, skipWaiting+clientsClaim activates
// the new SW but the old JS bundle keeps running in memory.
let swRefreshing = false;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (swRefreshing) return;
    swRefreshing = true;
    window.location.reload();
  });
}

// Top-level error boundary: prevents a blank white screen on unhandled JS errors.
class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0d0d12 0%, #141420 40%, #1a1528 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        color: "#c9a96e", fontFamily: "sans-serif", padding: "2rem", textAlign: "center",
      }}>
        <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
          Something went wrong. Please refresh the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: "transparent", border: "1px solid #c9a96e", color: "#c9a96e",
            padding: "0.5rem 1.5rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.9rem",
          }}
        >
          Refresh
        </button>
        {import.meta.env.DEV && (
          <pre style={{ marginTop: "1rem", fontSize: "0.75rem", color: "#888", maxWidth: "600px", overflow: "auto", textAlign: "left" }}>
            {error.message}
          </pre>
        )}
      </div>
    );
  }
}

createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
