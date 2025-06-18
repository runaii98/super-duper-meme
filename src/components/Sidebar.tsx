import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { FileManager } from './FileManager';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

interface NavigationItem {
  name: string;
  href?: string;
  icon: string;
  isAction?: boolean;
}

const navigation: NavigationItem[] = [
  {
    name: 'My Apps',
    href: '/dashboard',
    icon: '📱',
  },
  {
    name: 'File Manager',
    icon: '📁',
    isAction: true,
  },
  {
    name: 'Discover',
    href: '/discover',
    icon: '🔍',
  },
  {
    name: 'AI Generators',
    href: '/generators',
    icon: '🤖',
  },
  {
    name: 'Tutorial Hub',
    href: '/tutorials',
    icon: '📚',
  },
  {
    name: 'Payment Management',
    href: '/payments',
    icon: '💳',
  },
];

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);

  return (
    <>
    <div
      className={`${
        isOpen ? 'w-64' : 'w-20'
      } bg-[#1e1e1e] min-h-screen transition-all duration-300 ease-in-out border-r border-[#2a2a2a]`}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-[#2a2a2a]">
          <div className="flex items-center justify-between">
            {isOpen && (
              <span className="text-xl font-bold text-white">ComfyUI</span>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-[#2a2a2a] text-gray-400"
            >
              {isOpen ? '←' : '→'}
            </button>
          </div>
        </div>

        <div className="mt-4">
          <button
            className="w-full px-4 py-2 mb-4 btn-primary flex items-center justify-center gap-2"
          >
            {isOpen ? '+ Add New App' : '+'}
          </button>
        </div>

        <nav className="flex-1 px-2 py-4">
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                  {item.isAction ? (
                    <button
                      onClick={() => setIsFileManagerOpen(true)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors text-gray-400 hover:bg-[#2a2a2a] hover:text-white`}
                    >
                      <span className="text-xl mr-3">{item.icon}</span>
                      {isOpen && <span>{item.name}</span>}
                    </button>
                  ) : (
                <Link
                      href={item.href || '#'}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-[#2a2a2a] text-white'
                      : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                  }`}
                >
                  <span className="text-xl mr-3">{item.icon}</span>
                  {isOpen && <span>{item.name}</span>}
                </Link>
                  )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-white">
              U
            </div>
            {isOpen && (
              <div className="flex-1">
                <div className="text-sm font-medium text-white">User</div>
                <div className="text-xs text-gray-400">Free Plan</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* File Manager Modal */}
      {isFileManagerOpen && (
        <FileManager
          isOpen={isFileManagerOpen}
          onClose={() => setIsFileManagerOpen(false)}
          containerId={selectedContainerId || 'default'}
          bucketName="comfyui-storage"
        />
      )}
    </>
  );
} 