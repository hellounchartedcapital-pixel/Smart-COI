import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
};

export default withSentryConfig(nextConfig, {
  // Route Sentry events through our server to avoid ad blockers
  tunnelRoute: '/monitoring',

  // Source map upload for readable stack traces
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only log upload info in CI
  silent: !process.env.CI,

  // Disable telemetry to Sentry
  telemetry: false,
});
