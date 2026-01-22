// sentry.js
// Sentry error monitoring configuration

import * as Sentry from '@sentry/react';

export function initSentry() {
  // Only initialize if DSN is configured
  const dsn = process.env.REACT_APP_SENTRY_DSN;

  if (!dsn) {
    console.log('Sentry DSN not configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,

    // Sample rate for performance monitoring (10% of transactions)
    tracesSampleRate: 0.1,

    // Sample rate for error events (100% of errors)
    sampleRate: 1.0,

    // Only send errors in production
    enabled: process.env.NODE_ENV === 'production',

    // Filter out known non-critical errors
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Ignore network errors that are expected
      if (error?.message?.includes('Failed to fetch')) {
        return null;
      }

      // Ignore auth errors (user not logged in)
      if (error?.message?.includes('not authenticated')) {
        return null;
      }

      return event;
    },

    // Add user context when available
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
  });
}

// Helper to set user context after login
export function setSentryUser(user) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
    });
  } else {
    Sentry.setUser(null);
  }
}

// Helper to capture errors with context
export function captureError(error, context = {}) {
  Sentry.captureException(error, {
    extra: context,
  });
}

// Re-export Sentry for direct use
export { Sentry };
