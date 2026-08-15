import { createRoot } from 'react-dom/client';

import { App } from './App';
import { MobileExperienceGate } from './components/MobileExperienceGate';
import './styles.css';

const element = document.getElementById('root');
if (!element) throw new Error('Karaa root element is missing.');

createRoot(element).render(
  <MobileExperienceGate>
    <App />
  </MobileExperienceGate>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Karaa remains fully usable online when service-worker registration is unavailable.
    });
  });
}
