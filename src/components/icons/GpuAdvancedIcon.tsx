import React from 'react';

interface GpuAdvancedIconProps {
  className?: string;
  size?: number;
}

export const GpuAdvancedIcon: React.FC<GpuAdvancedIconProps> = ({ className = '', size = 24 }) => {
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
      <path d="M6 8h10" />
      <path d="M6 12h10" />
      <path d="M6 16h6" />
      <circle cx="18" cy="8" r="1" />
      <circle cx="18" cy="12" r="1" />
      <circle cx="18" cy="16" r="1" />
      <path d="M2 8h2" />
      <path d="M2 12h2" />
      <path d="M2 16h2" />
    </svg>
  );
};

export default GpuAdvancedIcon; 