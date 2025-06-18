import { Box, BoxProps } from '@chakra-ui/react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-[#1e1e1e] rounded-lg shadow-lg border border-[#2a2a2a] p-6 ${className}`}>
      {children}
    </div>
  );
} 