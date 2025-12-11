import React from 'react';

export function GiftBox({ className = '' }: { className?: string }) {
  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Gift box base */}
      <rect x="40" y="80" width="120" height="100" fill="url(#boxGradient)" rx="8" />
      <rect x="40" y="80" width="120" height="100" fill="url(#boxShine)" opacity="0.3" />

      {/* Ribbon vertical */}
      <rect x="95" y="80" width="10" height="100" fill="url(#ribbonGradient)" />
      <rect x="95" y="80" width="10" height="100" fill="url(#ribbonShine)" opacity="0.4" />

      {/* Ribbon horizontal */}
      <rect x="40" y="125" width="120" height="10" fill="url(#ribbonGradient)" />
      <rect x="40" y="125" width="120" height="10" fill="url(#ribbonShine)" opacity="0.4" />

      {/* Ribbon bow top */}
      <path d="M85 80 L95 70 L105 80 L100 75 L100 90 L90 90 L90 75 Z" fill="url(#ribbonGradient)" />
      <path d="M95 70 L100 65 L105 70 L100 75" fill="url(#ribbonShine)" opacity="0.5" />

      {/* Ribbon bow bottom */}
      <path d="M85 180 L95 190 L105 180 L100 185 L100 170 L90 170 L90 185 Z" fill="url(#ribbonGradient)" />
      <path d="M95 190 L100 195 L105 190 L100 185" fill="url(#ribbonShine)" opacity="0.5" />

      {/* Sparkles */}
      <circle cx="30" cy="60" r="3" fill="#fbbf24" opacity="0.8">
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="170" cy="50" r="2.5" fill="#f472b6" opacity="0.7">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="50" cy="40" r="2" fill="#a78bfa" opacity="0.6">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2.5s" repeatCount="indefinite" />
      </circle>

      <defs>
        <linearGradient id="boxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#f472b6', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#a21caf', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="boxShine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.5 }} />
          <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
        </linearGradient>
        <linearGradient id="ribbonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#ef4444', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#dc2626', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="ribbonShine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.6 }} />
          <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
        </linearGradient>
      </defs>
    </svg>
  );
}

