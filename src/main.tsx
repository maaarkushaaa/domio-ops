import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply dark theme by default
document.documentElement.classList.add('dark');

// SERVICE WORKER DISABLED TO FIX DEMO USER CACHING ISSUE
// Unregister any existing service workers
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        console.log('🚫 Unregistering existing Service Worker:', registration.scope);
        registration.unregister();
      });
    });
  });
}

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(<App />);
}
