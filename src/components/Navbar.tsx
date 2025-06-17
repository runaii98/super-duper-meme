'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CommandPalette from './CommandPalette';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { 
      href: '/about', 
      label: 'About',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      href: '/apps', 
      label: 'Apps',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    { 
      href: '/pricing', 
      label: 'Pricing',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      href: '/docs', 
      label: 'Docs',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-black/30 backdrop-blur-sm border-b border-emerald-900/10 shadow-lg shadow-emerald-900/5'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Search Section */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-3 flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center transform transition-all duration-300 hover:scale-110 hover:rotate-3 hover:shadow-lg hover:shadow-emerald-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 7H7v6h6V7z" />
                    <path fillRule="evenodd" d="M7 2a1 1 0 00-1 1v1H5a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 00-1-1H7zm4 0H9v2h2V2z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white">ComfyUI</span>
              </Link>

              {/* Search Bar */}
              <div className="hidden md:flex relative group">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="w-[280px] flex items-center space-x-3 px-4 py-2 text-base text-gray-400 bg-[#1a1a1a]/50 hover:bg-[#1a1a1a] rounded-xl transition-all duration-300 border border-emerald-900/10 hover:border-emerald-900/20"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-gray-500">Search...</span>
                  <span className="ml-auto text-xs text-gray-600 bg-[#2a2a2a] px-2 py-1 rounded">⌘K</span>
                </button>
              </div>
            </div>

            {/* Navigation and Auth - Right aligned with more spacing */}
            <div className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[15px] transition-all duration-300 relative group flex items-center space-x-2 ${
                    pathname === link.href
                      ? 'text-emerald-400 font-medium'
                      : 'text-gray-400 hover:text-emerald-300'
                  }`}
                >
                  {link.icon}
                  <span className="relative z-10">{link.label}</span>
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:-translate-y-1 hover:translate-x-0.5"></div>
                </Link>
              ))}

              <div className="h-6 w-px bg-gray-800"></div>

              {/* Auth Section */}
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-[15px] text-gray-400 hover:text-emerald-300 transition-all duration-300 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Login</span>
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 text-[15px] bg-gradient-to-r from-emerald-400 to-emerald-600 text-black font-medium rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <span>Get Started</span>
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-emerald-300 focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 transform transition-all duration-500 backdrop-blur-none md:hidden ${
          isMobileMenuOpen ? 'translate-x-0 backdrop-blur-xl' : 'translate-x-full backdrop-blur-none'
        }`}
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm">
          <div className="fixed right-0 top-0 bottom-0 w-3/4 bg-black/95 border-l border-emerald-900/10 shadow-2xl shadow-emerald-900/50 transition-transform duration-500">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <Link href="/" className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 7H7v6h6V7z" />
                      <path fillRule="evenodd" d="M7 2a1 1 0 00-1 1v1H5a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 00-1-1H7zm4 0H9v2h2V2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-xl font-bold text-white">ComfyUI</span>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-emerald-300 focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Mobile Search */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSearchOpen(true);
                }}
                className="w-full px-4 py-3 mb-4 flex items-center justify-between text-base text-gray-400 bg-[#1a1a1a]/50 rounded-xl border border-emerald-900/10"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-gray-500">Search...</span>
                </div>
                <kbd className="text-xs text-gray-600 bg-[#2a2a2a] px-2 py-1 rounded">⌘K</kbd>
              </button>

              <div className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-4 py-3 text-base rounded-lg transition-all duration-300 flex items-center space-x-3 ${
                      pathname === link.href
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'text-gray-400 hover:bg-emerald-500/5 hover:text-emerald-300'
                    }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                ))}
                <div className="h-px bg-gray-800 my-4"></div>
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 text-base text-gray-400 hover:text-emerald-300 transition-all duration-300 flex items-center space-x-3"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Login</span>
                </Link>
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 mt-4 text-center text-base bg-gradient-to-r from-emerald-400 to-emerald-600 text-black font-medium rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <span>Get Started</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette isOpen={isSearchOpen} setIsOpen={setIsSearchOpen} />
    </>
  );
} 