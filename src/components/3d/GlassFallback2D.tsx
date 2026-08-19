import React from 'react';
import { CupId } from '../../types/hydration';

interface GlassFallback2DProps {
  cupId: CupId;
  fillRatio?: number;
  className?: string;
}

export const GlassFallback2D: React.FC<GlassFallback2DProps> = ({ cupId, fillRatio = 0.85, className = 'w-full h-full' }) => {
  const percent = Math.round(fillRatio * 100);

  if (cupId === 'tall-10oz') {
    return (
      <div className={`relative flex flex-col items-center justify-center p-2 ${className}`}>
        <svg viewBox="0 0 100 180" className="h-full max-h-32 drop-shadow-[0_4px_12px_rgba(56,189,248,0.3)]">
          <defs>
            <linearGradient id="tallGlassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
              <stop offset="15%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="85%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.45)" />
            </linearGradient>
            <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <clipPath id="tallInnerClip">
              <rect x="23" y="10" width="54" height="135" rx="3" />
            </clipPath>
          </defs>

          {/* Solid glass base sham at bottom */}
          <rect x="20" y="145" width="60" height="25" rx="4" fill="url(#tallGlassGrad)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
          
          {/* Outer cylinder */}
          <rect x="20" y="10" width="60" height="160" rx="4" fill="url(#tallGlassGrad)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />

          {/* Liquid fill */}
          <g clipPath="url(#tallInnerClip)">
            <rect
              x="23"
              y={145 - (135 * (percent / 100))}
              width="54"
              height={135 * (percent / 100)}
              fill="url(#waterGrad)"
              opacity="0.85"
            />
            {/* Wave top */}
            <ellipse
              cx="50"
              cy={145 - (135 * (percent / 100))}
              rx="27"
              ry="4"
              fill="#7dd3fc"
              opacity="0.9"
            />
          </g>

          {/* Base bottom highlight */}
          <ellipse cx="50" cy="166" rx="25" ry="3" fill="rgba(255,255,255,0.3)" />
        </svg>
      </div>
    );
  }

  if (cupId === 'bulbous-10oz') {
    return (
      <div className={`relative flex flex-col items-center justify-center p-2 ${className}`}>
        <svg viewBox="0 0 140 160" className="h-full max-h-32 drop-shadow-[0_4px_12px_rgba(56,189,248,0.3)]">
          <defs>
            <linearGradient id="bulbousGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
              <stop offset="20%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="80%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.45)" />
            </linearGradient>
            <clipPath id="bulbousClip">
              <path d="M 42 20 C 30 70, 18 105, 38 140 C 44 146, 96 146, 102 140 C 122 105, 110 70, 98 20 Z" />
            </clipPath>
          </defs>

          {/* Glass body path */}
          <path
            d="M 40 18 C 28 70, 15 105, 36 142 C 42 148, 98 148, 104 142 C 125 105, 112 70, 100 18 Z"
            fill="url(#bulbousGrad)"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1.5"
          />

          {/* Liquid fill */}
          <g clipPath="url(#bulbousClip)">
            <rect
              x="15"
              y={145 - (125 * (percent / 100))}
              width="110"
              height={125 * (percent / 100)}
              fill="url(#waterGrad)"
              opacity="0.85"
            />
          </g>

          {/* Rim ellipse */}
          <ellipse cx="70" cy="19" rx="30" ry="3" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
          <ellipse cx="70" cy="144" rx="32" ry="3" fill="rgba(255,255,255,0.25)" />
        </svg>
      </div>
    );
  }

  // rocks-8oz
  return (
    <div className={`relative flex flex-col items-center justify-center p-2 ${className}`}>
      <svg viewBox="0 0 120 140" className="h-full max-h-32 drop-shadow-[0_4px_12px_rgba(56,189,248,0.3)]">
        <defs>
          <linearGradient id="rocksGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="15%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="85%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.45)" />
          </linearGradient>
          <clipPath id="rocksClip">
            <rect x="22" y="20" width="76" height="100" rx="3" />
          </clipPath>
        </defs>

        {/* Base */}
        <rect x="20" y="120" width="80" height="12" rx="3" fill="url(#rocksGrad)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />

        {/* Outer body */}
        <rect x="20" y="20" width="80" height="112" rx="4" fill="url(#rocksGrad)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />

        {/* Liquid */}
        <g clipPath="url(#rocksClip)">
          <rect
            x="22"
            y={120 - (100 * (percent / 100))}
            width="76"
            height={100 * (percent / 100)}
            fill="url(#waterGrad)"
            opacity="0.85"
          />
          <ellipse
            cx="60"
            cy={120 - (100 * (percent / 100))}
            rx="38"
            ry="4"
            fill="#7dd3fc"
            opacity="0.9"
          />
        </g>

        {/* Top Rim */}
        <ellipse cx="60" cy="20" rx="40" ry="3.5" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
      </svg>
    </div>
  );
};
