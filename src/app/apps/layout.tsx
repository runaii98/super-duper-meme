import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apps - ComfyUI',
  description: 'Explore the powerful applications available on ComfyUI platform.',
};

export default function AppsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 