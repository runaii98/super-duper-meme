'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Combobox, Transition } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import { ChangeEvent } from 'react';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'model' | 'doc' | 'action';
  icon: JSX.Element;
  href?: string;
  onClick?: () => void;
}

export default function CommandPalette({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (open: boolean) => void }) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  // Example search results - you can expand this based on your needs
  const searchResults: SearchResult[] = [
    {
      id: '1',
      title: 'Generate Images',
      description: 'Create AI-generated images using stable diffusion',
      type: 'model',
      icon: (
        <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: '/generate-images'
    },
    {
      id: '2',
      title: 'Documentation',
      description: 'View API documentation and guides',
      type: 'doc',
      icon: (
        <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      href: '/docs'
    },
    {
      id: 'quickstart',
      title: 'Quick Start Guide',
      description: 'Get started with ComfyUI in minutes',
      type: 'doc',
      icon: (
        <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      href: '/docs/getting-started/quickstart'
    },
    {
      id: 'api-docs',
      title: 'API Reference',
      description: 'Explore REST, GraphQL, and WebSocket APIs',
      type: 'doc',
      icon: (
        <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      href: '/docs/api/rest'
    },
    {
      id: 'examples',
      title: 'Example Projects',
      description: 'View sample applications and code examples',
      type: 'doc',
      icon: (
        <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      href: '/docs/examples'
    },
    {
      id: '3',
      title: 'Pricing',
      description: 'View our pricing plans and hardware configurations',
      type: 'action',
      icon: (
        <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: '/pricing'
    },
    // Apps Section
    {
      id: 'app-1',
      title: 'WanVideo 2.1',
      description: 'Image to Video Generation (30.5 GB)',
      type: 'model',
      icon: (
        <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      href: '/workflows/wanvideo-2-1'
    },
    {
      id: 'app-2',
      title: 'Hunyuan Video',
      description: 'High-Speed Text-to-Video Generation',
      type: 'model',
      icon: (
        <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
      ),
      href: '/workflows/hunyuan-video'
    },
    {
      id: 'app-3',
      title: 'FramePack',
      description: 'Generate long videos with consistent subject (15.6 GB)',
      type: 'model',
      icon: (
        <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      href: '/workflows/framepack'
    },
    {
      id: 'app-4',
      title: 'LoRA Training',
      description: 'Train custom AI models with LoRA',
      type: 'model',
      icon: (
        <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      href: '/workflows/lora'
    }
  ];

  const filteredResults = query === ''
    ? searchResults
    : searchResults.filter((result) =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.description.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, setIsOpen]);

  const onSelect = (result: SearchResult) => {
    setIsOpen(false);
    if (result.href) {
      router.push(result.href);
    } else if (result.onClick) {
      result.onClick();
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog onClose={setIsOpen} className="fixed inset-0 z-[60] overflow-y-auto p-4 pt-[25vh]">
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />

        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Dialog.Panel className="relative max-w-xl mx-auto">
            <Combobox
              onChange={onSelect}
              as="div"
              className="relative rounded-xl bg-[#1a1a1a] shadow-2xl ring-1 ring-emerald-900/10"
            >
              <div className="flex items-center px-4">
                <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Combobox.Input
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                  className="w-full bg-transparent border-0 px-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
                  placeholder="Search..."
                  autoComplete="off"
                />
                <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-400 bg-[#2a2a2a] rounded-lg">
                  ESC
                </kbd>
              </div>

              {filteredResults.length > 0 && (
                <Combobox.Options static className="max-h-96 overflow-y-auto border-t border-[#2a2a2a] py-4 text-sm">
                  {filteredResults.map((result) => (
                    <Combobox.Option key={result.id} value={result} className={({ active }: { active: boolean }) => `cursor-pointer select-none px-4 py-2 ${active ? 'bg-emerald-500/10 text-emerald-400' : 'text-gray-400'}`}>
                      {({ active }: { active: boolean }) => (
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">{result.icon}</div>
                          <div className="flex-1">
                            <p className={`${active ? 'text-emerald-400' : 'text-white'} font-medium`}>{result.title}</p>
                            <p className="text-gray-500">{result.description}</p>
                          </div>
                        </div>
                      )}
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              )}

              {query && filteredResults.length === 0 && (
                <div className="py-14 px-6 text-center text-sm sm:px-14">
                  <svg className="mx-auto h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="mt-4 font-semibold text-white">No results found</p>
                  <p className="mt-2 text-gray-500">We couldn't find anything with that term. Please try again.</p>
                </div>
              )}
            </Combobox>
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition.Root>
  );
} 