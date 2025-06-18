import React from 'react';

interface GpuBasicIconProps {
  className?: string;
  size?: number;
}

export const GpuBasicIcon: React.FC<GpuBasicIconProps> = ({ className = '', size = 24 }) => {
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
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h8" />
      <path d="M6 14h8" />
      <circle cx="16" cy="12" r="1" />
      <path d="M2 10h2" />
      <path d="M2 14h2" />
    </svg>
  );
};

export default GpuBasicIcon; 