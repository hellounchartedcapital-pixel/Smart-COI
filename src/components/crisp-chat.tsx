'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    $crisp: unknown[];
    CRISP_WEBSITE_ID: string;
  }
}

/**
 * Crisp live chat widget — loads asynchronously inside the dashboard.
 *
 * Props:
 *  - userEmail: sets the user email in Crisp so agents can see who's chatting
 *  - userName: sets the user nickname in Crisp
 */
export function CrispChat({
  userEmail,
  userName,
}: {
  userEmail?: string;
  userName?: string;
}) {
  useEffect(() => {
    const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
    if (!websiteId || typeof window === 'undefined') return;

    // Initialize Crisp
    window.$crisp = window.$crisp || [];
    window.CRISP_WEBSITE_ID = websiteId;

    // Set user identity if available
    if (userEmail) {
      window.$crisp.push(['set', 'user:email', [userEmail]]);
    }
    if (userName) {
      window.$crisp.push(['set', 'user:nickname', [userName]]);
    }

    // Load script asynchronously
    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount (e.g., navigating away from dashboard)
      script.remove();
    };
  }, [userEmail, userName]);

  return null;
}
