import { useEffect } from 'react';

/**
 * usePwaAutoUpdate - Automatically updates the installed PWA app
 * whenever a new version is deployed to Vercel.
 *
 * Flow:
 * 1. On app open, browser checks for a new Service Worker.
 * 2. If a new SW is found, it activates immediately (skipWaiting).
 * 3. We listen for the "controllerchange" event and silently reload the page.
 * 4. The user gets the latest version without doing ANYTHING manually.
 */
export function usePwaAutoUpdate() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;

    // When a new SW takes control, reload the page once
    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      console.log('[PWA] New version available - auto-reloading...');
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Check for SW updates on every app focus (user comes back to app)
    const checkForUpdate = () => {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          reg.update().catch(() => {});
        }
      });
    };

    // Check on page focus (app switch on mobile)
    window.addEventListener('focus', checkForUpdate);
    // Also check immediately on mount
    checkForUpdate();

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      window.removeEventListener('focus', checkForUpdate);
    };
  }, []);
}

export default usePwaAutoUpdate;
