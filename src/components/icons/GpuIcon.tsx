import React from 'react';

interface GpuIconProps {
  className?: string;
  size?: number;
}

export const GpuIcon: React.FC<GpuIconProps> = ({ className = '', size = 24 }) => {
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
      <path d="M6 8h.01" />
      <path d="M6 12h.01" />
      <path d="M6 16h.01" />
      <rect x="8" y="8" width="12" height="8" rx="1" />
      <path d="M12 12h4" />
    </svg>
  );
};

export default GpuIcon; 