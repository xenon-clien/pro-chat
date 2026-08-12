import { useState, useEffect } from 'react';

let deferredPrompt: any = null;

export function usePwaInstall() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      deferredPrompt = null;
      setIsInstallable(false);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      // Fallback instruction for iOS or unsupported browsers
      alert("To install ProChat on your phone:\n\n• On Android (Chrome/Edge): Tap the 3 dots (⋮) in the top right and tap 'Install App' or 'Add to Home screen'.\n• On iPhone (Safari): Tap the Share button (⎋) at the bottom and tap 'Add to Home Screen' (⊕).");
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setIsInstalled(true);
      }
      deferredPrompt = null;
    } catch (e) {
      console.warn('Install prompt error:', e);
    }
  };

  return { isInstallable, isInstalled, promptInstall };
}

export default usePwaInstall;
