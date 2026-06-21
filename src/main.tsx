import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Type declaration for the splash screen hide function injected by index.html
declare global {
  interface Window {
    __tvHideSplash?: () => void;
  }
}

// Hide splash screen as soon as React is mounted and first paint has happened.
// Small delay ensures the rendered UI is actually visible before we fade out.
if (typeof window.__tvHideSplash === 'function') {
  window.setTimeout(() => window.__tvHideSplash?.(), 120);
}

