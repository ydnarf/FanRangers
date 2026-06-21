import { useEffect } from 'react';

const KOFI_USERNAME = import.meta.env.VITE_KOFI_USERNAME as string | undefined;

// Extend window to accommodate Ko-fi overlay script
declare global {
  interface Window {
    kofiWidgetOverlay?: {
      draw: (username: string, options: Record<string, string>) => void;
    };
  }
}

export default function KoFiWidget() {
  useEffect(() => {
    if (!KOFI_USERNAME) return;

    // Avoid injecting the script more than once
    const SCRIPT_ID = 'kofi-overlay-script';
    if (document.getElementById(SCRIPT_ID)) {
      // Script already loaded — draw immediately if API is ready
      if (window.kofiWidgetOverlay) {
        window.kofiWidgetOverlay.draw(KOFI_USERNAME, {
          type: 'floating-chat',
          'floating-chat-direction': 'left',
          color: '#e50914',
        });
      }
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';
    script.async = true;
    script.onload = () => {
      window.kofiWidgetOverlay?.draw(KOFI_USERNAME!, {
        type: 'floating-chat',
        'floating-chat-direction': 'left',
        color: '#e50914',
      });
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup is intentionally omitted: Ko-fi widget manages its own DOM nodes
    };
  }, []);

  // This component renders no visible markup of its own
  return null;
}
