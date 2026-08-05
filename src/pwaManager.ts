// PWA Service Worker registration and Install Prompt manager

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners: Array<() => void> = [];

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
}

export function canInstallPWA(): boolean {
  if (isStandalone()) return false;
  return deferredPrompt !== null || isIOS();
}

export function promptInstallPWA(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!deferredPrompt) {
      resolve(false);
      return;
    }

    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted PWA install prompt');
        deferredPrompt = null;
        notifyListeners();
        resolve(true);
      } else {
        console.log('User dismissed PWA install prompt');
        resolve(false);
      }
    });
  });
}

function notifyListeners() {
  listeners.forEach((cb) => cb());
}

export function subscribePWAState(callback: () => void): () => void {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('PWA ServiceWorker registered successfully with scope:', registration.scope);
      })
      .catch((error) => {
        console.error('PWA ServiceWorker registration failed:', error);
      });
  });

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('PWA beforeinstallprompt event captured');
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    deferredPrompt = null;
    notifyListeners();
  });
}
