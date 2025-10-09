import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log('🚀 Main.tsx: Application starting...');

// Apply dark theme by default
document.documentElement.classList.add('dark');
console.log('🎨 Dark theme applied');

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('✅ SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('❌ SW registration failed: ', registrationError);
      });
  });
}

const rootElement = document.getElementById("root");
console.log('📦 Root element:', rootElement);

if (rootElement) {
  createRoot(rootElement).render(<App />);
  console.log('✅ App rendered successfully');
} else {
  console.error('❌ Root element not found!');
}
