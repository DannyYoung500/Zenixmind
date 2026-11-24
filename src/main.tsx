import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ViewportStability } from './components/viewport-stability';

// Register the offline navigation fallback in production without caching private API data.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('ZenixMind offline support could not be registered:', error);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ViewportStability />
    <App />
  </StrictMode>,
);
