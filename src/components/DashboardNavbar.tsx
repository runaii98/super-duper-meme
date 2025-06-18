'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DashboardNavbar() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications] = useState([
    {
      id: 1,
      title: 'Instance Started',
      message: 'Your ComfyUI instance has been successfully started.',
      time: '2 min ago',
      type: 'success'
    },
    {
      id: 2,
      title: 'Storage Alert',
      message: 'Your instance is approaching storage limit (85% used)',
      time: '1 hour ago',
      type: 'warning'
    }
  ]);

  const handleSignOut = () => {
    // Add sign out logic here
    console.log('Signing out...');
  };

  return (
    <nav className="fixed top-0 right-0 left-64 h-16 bg-black/50 backdrop-blur-xl border-b border-emerald-500/10 z-40">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Search instances, files, or commands..."
              className="w-full bg-emerald-400/5 border border-emerald-500/10 rounded-lg px-4 py-2 pl-10 text-gray-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-emerald-500/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <div className="absolute right-3 top-2 text-xs text-emerald-500/50">⌘K</div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 rounded-lg hover:bg-emerald-400/5 text-gray-400 hover:text-emerald-400 transition-colors relative"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-emerald-400 rounded-full"></span>
            </button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-black border border-emerald-500/10 rounded-lg shadow-lg overflow-hidden">
                <div className="p-4 border-b border-emerald-500/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium">Notifications</h3>
                    <button className="text-xs text-emerald-400 hover:text-emerald-300">Mark all as read</button>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 border-b border-emerald-500/10 hover:bg-emerald-400/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 h-2 w-2 rounded-full ${
                          notification.type === 'success' ? 'bg-emerald-400' : 'bg-amber-400'
                        }`} />
                        <div>
                          <h4 className="text-sm font-medium text-white">{notification.title}</h4>
                          <p className="text-sm text-gray-400 mt-1">{notification.message}</p>
                          <span className="text-xs text-gray-500 mt-2 block">{notification.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-emerald-500/10 bg-black">
                  <Link
                    href="/notifications"
                    className="text-sm text-center text-emerald-400 hover:text-emerald-300 block"
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Help */}
          <button className="p-2 rounded-lg hover:bg-emerald-400/5 text-gray-400 hover:text-emerald-400 transition-colors">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          {/* User Menu */}
          <div className="relative flex items-center space-x-3 pl-4 border-l border-emerald-500/10">
            <div className="flex flex-col items-end">
              <span className="text-sm text-white">John Doe</span>
              <span className="text-xs text-emerald-400">Pro Plan</span>
            </div>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="h-8 w-8 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 flex items-center justify-center text-black font-medium hover:opacity-90 transition-opacity"
            >
              JD
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-black border border-emerald-500/10 rounded-lg shadow-lg overflow-hidden">
                <div className="p-2">
                  <div className="px-2 py-3 border-b border-emerald-500/10">
                    <p className="text-sm text-white font-medium">John Doe</p>
                    <p className="text-xs text-emerald-400">john.doe@example.com</p>
                  </div>
                  
                  <div className="py-1">
                    <Link 
                      href="/dashboard/account"
                      className="w-full px-3 py-2 text-sm text-left text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 rounded-lg flex items-center gap-2"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Account Settings
                    </Link>
                    
                    <button 
                      className="w-full px-3 py-2 text-sm text-left text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 rounded-lg flex items-center gap-2"
                      onClick={() => {/* Navigate to billing */}}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Billing & Plan
                    </button>
                    
                    <button 
                      className="w-full px-3 py-2 text-sm text-left text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 rounded-lg flex items-center gap-2"
                      onClick={() => {/* Navigate to API keys */}}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      API Keys
                    </button>
                  </div>

                  <div className="py-1 border-t border-emerald-500/10">
                    <button 
                      className="w-full px-3 py-2 text-sm text-left text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2"
                      onClick={handleSignOut}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 