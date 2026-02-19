import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'SmartCOI — AI-Powered COI Compliance Tracking';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #0f6b3a 0%, #064e2b 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          {/* Logo icon — rounded square with document checkmark */}
          <svg
            width="88"
            height="88"
            viewBox="0 0 96 96"
            fill="none"
          >
            <defs>
              <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#73E2A7" />
                <stop offset="100%" stopColor="#5CC98E" />
              </linearGradient>
            </defs>
            <rect width="96" height="96" rx="19" fill="url(#g)" />
            <g
              transform="translate(24, 20)"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            >
              <path d="M28 4H12C9.79 4 8 5.79 8 8V48C8 50.21 9.79 52 12 52H36C38.21 52 40 50.21 40 48V16L28 4Z" />
              <path d="M28 4V16H40" />
              <path d="M16 32L22 38L32 28" />
            </g>
          </svg>
          <span
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: '#ffffff',
              marginLeft: 20,
              letterSpacing: '-0.02em',
            }}
          >
            SmartCOI
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: '#ffffff',
            opacity: 0.95,
            letterSpacing: '0.01em',
          }}
        >
          AI-Powered COI Compliance Tracking
        </div>

        {/* Domain */}
        <div
          style={{
            fontSize: 18,
            fontWeight: 400,
            color: '#a7f3d0',
            marginTop: 16,
            letterSpacing: '0.04em',
          }}
        >
          smartcoi.io
        </div>
      </div>
    ),
    { ...size }
  );
}
