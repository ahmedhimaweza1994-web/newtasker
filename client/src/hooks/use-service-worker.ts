import { useEffect, useState } from 'react';

export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('[Service Worker] Not supported in this browser');
      setIsSupported(false);
      return;
    }

    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.log('[Service Worker] HTTPS required for service workers (except localhost)');
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    navigator.serviceWorker
      .register('/service-worker.js', {
        scope: '/'
      })
      .then((reg) => {
        console.log('[Service Worker] Registered successfully:', reg.scope);
        setRegistration(reg);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                console.log('[Service Worker] New version activated');
              }
            });
          }
        });
      })
      .catch((err) => {
        console.error('[Service Worker] Registration failed:', err);
        setError(err);
        setIsSupported(false);
      });

    navigator.serviceWorker.ready
      .then(() => {
        console.log('[Service Worker] Ready');
      })
      .catch((err) => {
        console.error('[Service Worker] Ready check failed:', err);
      });
  }, []);

  return {
    registration,
    isSupported,
    error,
  };
}
