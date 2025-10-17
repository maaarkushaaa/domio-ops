import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply dark theme by default
document.documentElement.classList.add('dark');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(error => {
      console.error('Service worker registration failed:', error);
    });
  });
}

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(<App />);
}
