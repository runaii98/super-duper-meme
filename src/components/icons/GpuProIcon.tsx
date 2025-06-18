import React from 'react';

interface GpuProIconProps {
  className?: string;
  size?: number;
}

export const GpuProIcon: React.FC<GpuProIconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M6 8h12" />
      <path d="M6 12h12" />
      <path d="M6 16h8" />
      <circle cx="19" cy="8" r="1.5" fill="currentColor" />
      <circle cx="19" cy="12" r="1.5" fill="currentColor" />
      <circle cx="19" cy="16" r="1.5" fill="currentColor" />
      <path d="M2 8h2" />
      <path d="M2 12h2" />
      <path d="M2 16h2" />
      <path d="M16 4v16" strokeDasharray="2 2" />
    </svg>
  );
};

export default GpuProIcon; 