import React, { useId } from 'react';

export interface KaenLogoProps {
  className?: string;
  variant?: 'horizontal' | 'icon' | 'badge' | 'stacked';
  alt?: string;
  theme?: 'dark' | 'light';
}

export const KaenLogo: React.FC<KaenLogoProps> = ({ 
  className = "h-10", 
  variant = "horizontal",
  theme = "dark"
}) => {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9]/g, '');

  // 12-tooth precision gear path for Horizontal layout (cx=68, cy=68)
  const gearHorizontalPath = "M 69.7 30.0 L 74.3 20.4 L 82.4 22.2 L 82.5 32.9 L 88.4 36.0 L 97.2 29.9 L 103.4 35.6 L 98.1 44.9 L 101.7 50.5 L 112.3 49.6 L 114.9 57.6 L 105.7 63.0 L 106.0 69.7 L 115.6 74.3 L 113.8 82.4 L 103.1 82.5 L 100.0 88.4 L 106.1 97.2 L 100.4 103.4 L 91.1 98.1 L 85.5 101.7 L 86.4 112.3 L 78.4 114.9 L 73.0 105.7 L 66.3 106.0 L 61.7 115.6 L 53.6 113.8 L 53.5 103.1 L 47.6 100.0 L 38.8 106.1 L 32.6 100.4 L 37.9 91.1 L 34.3 85.5 L 23.7 86.4 L 21.1 78.4 L 30.3 73.0 L 30.0 66.3 L 20.4 61.7 L 22.2 53.6 L 32.9 53.5 L 36.0 47.6 L 29.9 38.8 L 35.6 32.6 L 44.9 37.9 L 50.5 34.3 L 49.6 23.7 L 57.6 21.1 L 63.0 30.3 Z M 88.0 68.0 L 87.7 64.5 L 86.8 61.2 L 85.3 58.0 L 83.3 55.1 L 80.9 52.7 L 78.0 50.7 L 74.8 49.2 L 71.5 48.3 L 68.0 48.0 L 64.5 48.3 L 61.2 49.2 L 58.0 50.7 L 55.1 52.7 L 52.7 55.1 L 50.7 58.0 L 49.2 61.2 L 48.3 64.5 L 48.0 68.0 L 48.3 71.5 L 49.2 74.8 L 50.7 78.0 L 52.7 80.9 L 55.1 83.3 L 58.0 85.3 L 61.2 86.8 L 64.5 87.7 L 68.0 88.0 L 71.5 87.7 L 74.8 86.8 L 78.0 85.3 L 80.9 83.3 L 83.3 80.9 L 85.3 78.0 L 86.8 74.8 L 87.7 71.5 L 88.0 68.0 Z";

  // 12-tooth precision gear path for Icon/Badge layout (cx=80, cy=80)
  const gearIconPath = "M 82.2 30.0 L 88.1 18.5 L 98.6 20.9 L 99.1 33.8 L 106.9 37.8 L 117.7 30.8 L 125.7 38.1 L 119.7 49.6 L 124.4 56.9 L 137.3 56.3 L 140.5 66.6 L 129.6 73.5 L 130.0 82.2 L 141.5 88.1 L 139.1 98.6 L 126.2 99.1 L 122.2 106.9 L 129.2 117.7 L 121.9 125.7 L 110.4 119.7 L 103.1 124.4 L 103.7 137.3 L 93.4 140.5 L 86.5 129.6 L 77.8 130.0 L 71.9 141.5 L 61.4 139.1 L 60.9 126.2 L 53.1 122.2 L 42.3 129.2 L 34.3 121.9 L 40.3 110.4 L 35.6 103.1 L 22.7 103.7 L 19.5 93.4 L 30.4 86.5 L 30.0 77.8 L 18.5 71.9 L 20.9 61.4 L 33.8 60.9 L 37.8 53.1 L 30.8 42.3 L 38.1 34.3 L 49.6 40.3 L 56.9 35.6 L 56.3 22.7 L 66.6 19.5 L 73.5 30.4 Z M 106.0 80.0 L 105.6 75.5 L 104.4 71.1 L 102.5 67.0 L 99.9 63.3 L 96.7 60.1 L 93.0 57.5 L 88.9 55.6 L 84.5 54.4 L 80.0 54.0 L 75.5 54.4 L 71.1 55.6 L 67.0 57.5 L 63.3 60.1 L 60.1 63.3 L 57.5 67.0 L 55.6 71.1 L 54.4 75.5 L 54.0 80.0 L 54.4 84.5 L 55.6 88.9 L 57.5 93.0 L 60.1 96.7 L 63.3 99.9 L 67.0 102.5 L 71.1 104.4 L 75.5 105.6 L 80.0 106.0 L 84.5 105.6 L 88.9 104.4 L 93.0 102.5 L 96.7 99.9 L 99.9 96.7 L 102.5 93.0 L 104.4 88.9 L 105.6 84.5 L 106.0 80.0 Z";

  // Common Gradients Definition
  const Gradients = () => (
    <defs>
      {/* Polished Chrome Gradient for Gear */}
      <linearGradient id={`${id}-gearGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="30%" stopColor="#E2E8F0" />
        <stop offset="65%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>

      {/* Dynamic Racing Red Gradient */}
      <linearGradient id={`${id}-redGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF385C" />
        <stop offset="45%" stopColor="#E60026" />
        <stop offset="100%" stopColor="#9E0017" />
      </linearGradient>

      {/* Chrome Gradient for Letters AEN */}
      <linearGradient id={`${id}-chromeGrad`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={theme === 'dark' ? '#FFFFFF' : '#1E293B'} />
        <stop offset="45%" stopColor={theme === 'dark' ? '#F8FAFC' : '#0F172A'} />
        <stop offset="55%" stopColor={theme === 'dark' ? '#E2E8F0' : '#090D16'} />
        <stop offset="100%" stopColor={theme === 'dark' ? '#94A3B8' : '#020617'} />
      </linearGradient>

      {/* Subtle Drop Shadow */}
      <filter id={`${id}-shadow`} x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.85" />
      </filter>

      {/* Red Glow Filter */}
      <filter id={`${id}-redGlow`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  );

  // 1. ICON VARIANT (Square isolated symbol: Gear + K)
  if (variant === 'icon') {
    return (
      <svg 
        viewBox="0 0 160 160" 
        className={`select-none shrink-0 ${className}`}
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Auto Mecânica Kaen Símbolo"
      >
        <Gradients />
        <g filter={`url(#${id}-shadow)`}>
          {/* Mechanical Gear */}
          <path 
            d={gearIconPath} 
            fill={`url(#${id}-gearGrad)`} 
            stroke="#1E293B" 
            strokeWidth="1.5" 
            strokeLinejoin="round" 
          />
          {/* Center Hub */}
          <circle cx="80" cy="80" r="25" fill="#0A0B0E" stroke="#475569" strokeWidth="2" />
          <circle cx="80" cy="80" r="14" fill={`url(#${id}-gearGrad)`} opacity="0.6" />

          {/* Aerodynamic Speed Wing */}
          <path 
            d="M 68 28 C 104 18, 134 22, 152 30 C 128 35, 102 38, 92 40 Z" 
            fill={`url(#${id}-redGrad)`} 
          />

          {/* Dynamic Red K */}
          {/* Stem */}
          <path 
            d="M 68 28 L 44 132 L 68 132 L 92 28 Z" 
            fill={`url(#${id}-redGrad)`} 
            stroke="#7F0015" 
            strokeWidth="1" 
          />
          {/* Upper Arm */}
          <path 
            d="M 80 74 L 132 38 L 148 48 L 94 92 Z" 
            fill={`url(#${id}-redGrad)`} 
            stroke="#7F0015" 
            strokeWidth="1" 
          />
          {/* Lower Leg */}
          <path 
            d="M 92 84 L 144 132 L 118 132 L 74 96 Z" 
            fill={`url(#${id}-redGrad)`} 
            stroke="#7F0015" 
            strokeWidth="1" 
          />

          {/* 3D Reflection Highlights */}
          <path d="M 69 31 L 47 129 L 53 129 L 76 31 Z" fill="#FFA3B3" opacity="0.5" />
          <path d="M 84 75 L 130 43 L 136 47 L 92 88 Z" fill="#FFA3B3" opacity="0.35" />
        </g>
      </svg>
    );
  }

  // 2. BADGE VARIANT (Squircle Icon with dark glass border)
  if (variant === 'badge') {
    return (
      <div className="relative inline-flex items-center justify-center p-2 rounded-2xl bg-zinc-950 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <KaenLogo variant="icon" className={className} theme={theme} />
      </div>
    );
  }

  // 3. STACKED VARIANT (Centered Icon on top + KAEN + AUTO MECÂNICA below)
  if (variant === 'stacked') {
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <KaenLogo variant="icon" className="h-20 sm:h-24 w-auto mb-2" theme={theme} />
        <span 
          className="text-4xl sm:text-5xl font-black italic tracking-wider text-white"
          style={{ fontFamily: "'Kanit', 'Changa', sans-serif" }}
        >
          KAEN
        </span>
        <div className="mt-1 bg-gradient-to-r from-[#FF385C] to-[#9E0017] px-4 py-1 rounded-sm transform -skew-x-12">
          <span 
            className="text-[10px] sm:text-xs font-black italic tracking-[0.3em] text-white block uppercase"
            style={{ fontFamily: "'Kanit', 'Changa', sans-serif" }}
          >
            AUTO MECÂNICA
          </span>
        </div>
      </div>
    );
  }

  // 4. DEFAULT: OFFICIAL HORIZONTAL LOGO (Gear + K + AEN + Auto Mecânica Banner)
  return (
    <svg 
      viewBox="0 0 420 142" 
      className={`select-none shrink-0 ${className}`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Auto Mecânica Kaen Logo"
    >
      <Gradients />
      <g filter={`url(#${id}-shadow)`}>
        {/* 1. MECHANICAL GEAR (Behind the K) */}
        <path 
          d={gearHorizontalPath} 
          fill={`url(#${id}-gearGrad)`} 
          stroke="#1E293B" 
          strokeWidth="1.5" 
          strokeLinejoin="round" 
        />
        {/* Hub */}
        <circle cx="68" cy="68" r="20" fill="#0A0B0E" stroke="#475569" strokeWidth="2" />
        <circle cx="68" cy="68" r="10" fill={`url(#${id}-gearGrad)`} opacity="0.6" />

        {/* 2. AERODYNAMIC SPEED WING (Curves across over the letters) */}
        <path 
          d="M 58 24 C 128 14, 215 16, 305 23 C 230 28, 155 32, 90 36 Z" 
          fill={`url(#${id}-redGrad)`} 
        />

        {/* 3. DYNAMIC RED K */}
        {/* Main stem */}
        <path 
          d="M 58 24 L 38 104 L 56 104 L 76 24 Z" 
          fill={`url(#${id}-redGrad)`} 
          stroke="#7F0015" 
          strokeWidth="1" 
        />
        {/* Upper arm */}
        <path 
          d="M 68 60 L 114 34 L 128 42 L 80 74 Z" 
          fill={`url(#${id}-redGrad)`} 
          stroke="#7F0015" 
          strokeWidth="1" 
        />
        {/* Lower leg */}
        <path 
          d="M 78 67 L 122 104 L 100 104 L 62 78 Z" 
          fill={`url(#${id}-redGrad)`} 
          stroke="#7F0015" 
          strokeWidth="1" 
        />

        {/* K 3D Reflection Highlights */}
        <path d="M 59 26 L 41 101 L 46 101 L 64 26 Z" fill="#FFA3B3" opacity="0.45" />
        <path d="M 72 61 L 110 37 L 116 41 L 78 70 Z" fill="#FFA3B3" opacity="0.35" />

        {/* 4. WORDMARK "AEN" - Precision Italic Display Typography */}
        <text 
          x="132" 
          y="102" 
          fontFamily="'Kanit', 'Changa', 'Outfit', sans-serif" 
          fontWeight="900" 
          fontStyle="italic" 
          fontSize="84" 
          letterSpacing="2" 
          fill={`url(#${id}-chromeGrad)`} 
          stroke={theme === 'dark' ? "#0A0B0E" : "#FFFFFF"} 
          strokeWidth="2" 
          strokeLinejoin="round"
        >
          AEN
        </text>

        {/* 5. RACING SUB-BANNER: AUTO MECÂNICA */}
        {/* Left speed lines */}
        <line x1="104" y1="120" x2="132" y2="120" stroke="#E60026" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="114" y1="126" x2="132" y2="126" stroke="#E60026" strokeWidth="2" strokeLinecap="round" />

        {/* Slanted Red Plaque */}
        <polygon 
          points="138,112 360,112 348,132 126,132" 
          fill={`url(#${id}-redGrad)`} 
          stroke="#7F0015" 
          strokeWidth="1" 
        />

        {/* Right speed lines */}
        <line x1="366" y1="120" x2="394" y2="120" stroke="#E60026" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="366" y1="126" x2="384" y2="126" stroke="#E60026" strokeWidth="2" strokeLinecap="round" />

        {/* Banner text */}
        <text 
          x="243" 
          y="126.5" 
          textAnchor="middle" 
          fontFamily="'Kanit', 'Changa', 'Outfit', sans-serif" 
          fontWeight="900" 
          fontStyle="italic" 
          fontSize="12.5" 
          letterSpacing="4.5" 
          fill="#FFFFFF"
        >
          AUTO MECÂNICA
        </text>
      </g>
    </svg>
  );
};

export default KaenLogo;
