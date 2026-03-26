import { createRoot } from "react-dom/client";
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

createRoot(document.getElementById("root")!).render(<App />);
